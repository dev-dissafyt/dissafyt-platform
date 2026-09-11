import { NextRequest, NextResponse } from 'next/server';
import {
  WhatsAppService,
  DEFAULT_VERIFY_TOKEN,
  WHATSAPP_FLOW_ID,
  BarbershopService,
  AuditService,
  GUEST_USER_ID,
} from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';

const CURTIS_PHONE = process.env.ADMIN_ALERT_PHONE || '27818082570';

/**
 * GET /api/whatsapp/webhook
 * Meta WhatsApp Webhook Challenge Verification.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const configuredToken = process.env.WHATSAPP_VERIFY_TOKEN || DEFAULT_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === configuredToken) {
    console.log('Meta WhatsApp Webhook subscription verified successfully.');
    return new Response(challenge || 'OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('WhatsApp webhook verification mismatch. Expected:', configuredToken, 'Received:', token);
  return new Response('Forbidden: Verification token mismatch', { status: 403 });
}

/**
 * POST /api/whatsapp/webhook
 * Handles incoming WhatsApp events, interactive buttons, WhatsApp Flow responses, and client messages.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a WhatsApp status update or message event
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Acknowledge receipt immediately as required by Meta (within 3 seconds)
    if (!value?.messages || value.messages.length === 0) {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const message = value.messages[0];
    const contact = value.contacts?.[0];
    const fromPhone = message.from; // e.g. "27821234567"
    const senderName = contact?.profile?.name || 'Valued Client';
    const messageType = message.type;

    console.log(`[WhatsApp Inbound] From: ${fromPhone} (${senderName}), Type: ${messageType}`);

    // =========================================================================
    // CASE 1: WhatsApp Flow Submission (interactive.nfm_reply)
    // =========================================================================
    if (messageType === 'interactive' && message.interactive?.type === 'nfm_reply') {
      const nfmReply = message.interactive.nfm_reply;
      let flowData: Record<string, any> = {};

      try {
        flowData = JSON.parse(nfmReply.response_json || '{}');
      } catch (parseErr) {
        console.warn('Failed to parse flow response_json:', nfmReply.response_json);
      }

      console.log('[WhatsApp Flow Submitted]', flowData);

      const actionType = flowData.action_type || '';

      // -----------------------------------------------------------------------
      // SUB-CASE 1A: MEMBER SIGN-UP / SIGN-IN FLOW SUBMISSION
      // -----------------------------------------------------------------------
      if (
        actionType === 'sign_up' ||
        actionType === 'sign_in' ||
        flowData.status === 'registered' ||
        flowData.status === 'signed_in' ||
        flowData.first_name ||
        flowData.confirm_password
      ) {
        const clientName = flowData.name || flowData.first_name || senderName;
        await WhatsAppService.sendInteractiveButtons(
          fromPhone,
          `🎉 *WELCOME TO THE DISSAFYT GUILD, ${clientName.toUpperCase()}!*\n\n` +
          `Your membership profile is active and linked to WhatsApp (+${fromPhone}).\n\n` +
          `Enjoy priority appointment booking, member perks, and direct concierge access to master barber Curtis Lee.`,
          [
            { id: 'btn_book_flow', title: '✂️ Book Haircut' },
            { id: 'btn_support', title: '🆘 Appointment Help' },
            { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
          ],
          'Account Active',
          'Ace of Fyt Guild'
        );

        await AuditService.recordLog({
          actor_email: `whatsapp:${fromPhone}`,
          actor_role: 'customer',
          action: 'whatsapp.flow_auth_completed',
          entity_type: 'profile',
          entity_id: fromPhone,
          changes: { flowData },
        });

        return NextResponse.json({ status: 'auth_flow_processed' }, { status: 200 });
      }

      // -----------------------------------------------------------------------
      // SUB-CASE 1B: POST-HAIRCUT FEEDBACK FLOW SUBMISSION
      // -----------------------------------------------------------------------
      if (
        actionType === 'feedback' ||
        flowData.rating ||
        flowData.status === 'feedback_received'
      ) {
        const rating = Number(flowData.rating) || 5;
        const barber = flowData.barber || 'Curtis Lee';
        const comments = flowData.comments || '';

        await AuditService.recordLog({
          actor_email: `whatsapp:${fromPhone}`,
          actor_role: 'customer',
          action: 'whatsapp.flow_feedback_completed',
          entity_type: 'customer_review',
          entity_id: fromPhone,
          changes: { rating, barber, comments, flowData },
        });

        if (rating >= 4) {
          await WhatsAppService.sendInteractiveButtons(
            fromPhone,
            `🌟 *THANK YOU FOR YOUR FEEDBACK!*\n\n` +
            `We are thrilled you had an outstanding cut with *${barber}* at Ace of Fyt Cape Town!\n\n` +
            `⭐⭐⭐⭐⭐ If you have 30 seconds, please drop a review on our Google Maps profile:\n` +
            `👉 https://maps.google.com/?q=Dissafyt+Studio+Cape+Town\n\n` +
            `🎁 *10% VIP Perk on Next Visit:* Use code *FYTVIP10* when booking!`,
            [
              { id: 'btn_book_flow', title: '✂️ Book Next Cut' },
              { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
            ],
            'Ace of Fyt Review',
            'Dissafyt Platform'
          );
        } else {
          await WhatsAppService.sendInteractiveButtons(
            fromPhone,
            `🙏 *THANK YOU FOR YOUR HONEST FEEDBACK*\n\n` +
            `Hi *${senderName}*, at Dissafyt we hold our craft to the absolute highest standard. Curtis has been notified of your comments and will follow up with you personally to make sure your next cut is 100% dialled in.`,
            [
              { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
              { id: 'btn_support', title: '🆘 Appointment Help' },
            ],
            'We Hear You',
            'Dissafyt Concierge'
          );

          try {
            await WhatsAppService.sendTextMessage(
              CURTIS_PHONE,
              `🚨 *CRITICAL CLIENT REVIEW NOTIFICATION*\n\n` +
              `• *Client:* ${senderName} (+${fromPhone})\n` +
              `• *Rating:* ${rating}/5 Stars ⚠️\n` +
              `• *Barber:* ${barber}\n` +
              `• *Comments:* "${comments || 'No comment provided'}"\n\n` +
              `👉 Chat with client to resolve: https://wa.me/${fromPhone}`
            );
          } catch (curtisErr) {
            console.warn('Failed to notify Curtis of low rating:', curtisErr);
          }
        }

        return NextResponse.json({ status: 'feedback_flow_processed' }, { status: 200 });
      }

      // -----------------------------------------------------------------------
      // SUB-CASE 1C: SUPPORT / HELP FLOW SUBMISSION
      // -----------------------------------------------------------------------
      if (
        actionType === 'support' ||
        flowData.topic ||
        flowData.status === 'ticket_created'
      ) {
        const topic = flowData.topic || 'General Support';
        const details = flowData.details || '';
        const bookingRef = flowData.booking_ref || 'N/A';

        await AuditService.recordLog({
          actor_email: `whatsapp:${fromPhone}`,
          actor_role: 'customer',
          action: 'whatsapp.flow_support_completed',
          entity_type: 'support_ticket',
          entity_id: fromPhone,
          changes: { topic, details, bookingRef, flowData },
        });

        try {
          await WhatsAppService.sendTextMessage(
            CURTIS_PHONE,
            `🆘 *CLIENT CONCIERGE HELP REQUEST*\n\n` +
            `• *Client:* ${senderName} (+${fromPhone})\n` +
            `• *Topic:* ${topic}\n` +
            `• *Ref:* ${bookingRef}\n` +
            `• *Details:* "${details}"\n\n` +
            `👉 Chat with client: https://wa.me/${fromPhone}`
          );
        } catch (curtisErr) {
          console.warn('Failed to notify Curtis of support request:', curtisErr);
        }

        await WhatsAppService.sendInteractiveButtons(
          fromPhone,
          `🆘 *SUPPORT REQUEST LOGGED*\n\n` +
          `Hi *${senderName}*, your request regarding *${topic}* has been sent directly to Curtis Lee and our studio concierge.\n\n` +
          `We will reply right here in WhatsApp shortly.`,
          [
            { id: 'btn_support', title: '📅 Check Booking' },
            { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
          ],
          'Concierge Support',
          'Ace of Fyt Studio'
        );

        return NextResponse.json({ status: 'support_flow_processed' }, { status: 200 });
      }

      // -----------------------------------------------------------------------
      // SUB-CASE 1D: HAIRCUT BOOKING FLOW SUBMISSION (DEFAULT)
      // -----------------------------------------------------------------------
      // 1. Resolve or create customer account in Supabase
      const admin = getSupabaseAdminClient();
      let customerId = GUEST_USER_ID;

      // Look up existing customer by phone number
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id, full_name, email')
        .or(`phone.eq.${fromPhone},phone.eq.+${fromPhone}`)
        .maybeSingle();

      if (existingProfile) {
        customerId = existingProfile.id;
      }

      // 2. Resolve Service and Barber from Flow inputs or defaults
      const services = await BarbershopService.listServices();
      const activeServices = services.filter((s) => s.is_active && !s.is_subscription);
      
      let selectedService = activeServices.find(
        (s) => s.id === flowData.service_id || s.name.toLowerCase() === (flowData.service || '').toLowerCase()
      );
      if (!selectedService && activeServices.length > 0) {
        selectedService = activeServices[0];
      }

      const activeStaff = await BarbershopService.listActiveStaff();
      let selectedBarber = activeStaff.find(
        (b) => b.id === flowData.barber_id || b.display_name.toLowerCase().includes((flowData.barber || '').toLowerCase())
      );

      // 3. Compute appointment time (fallback to next day 14:00 if not in flow)
      let appointmentDate = new Date();
      if (flowData.date && flowData.time) {
        appointmentDate = new Date(`${flowData.date}T${flowData.time}:00+02:00`);
      } else {
        appointmentDate.setDate(appointmentDate.getDate() + 1);
        appointmentDate.setHours(14, 0, 0, 0);
      }

      if (isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
        appointmentDate = new Date(Date.now() + 24 * 3600 * 1000);
        appointmentDate.setHours(14, 0, 0, 0);
      }

      // 4. Create appointment in database
      const bookingResult = await BarbershopService.createBooking({
        customer_id: customerId,
        service_id: selectedService ? selectedService.id : activeServices[0]?.id,
        staff_id: selectedBarber ? selectedBarber.id : null,
        start_time: appointmentDate.toISOString(),
        location_id: 'loc-cpt-flagship',
        notes: `Booked via WhatsApp Flow [Flow_ID: ${WHATSAPP_FLOW_ID}] by ${senderName} (${fromPhone})`,
        payment_choice: 'payfast',
      });

      if (bookingResult.success && bookingResult.booking) {
        const dateTimeStr = appointmentDate.toLocaleString('en-ZA', {
          timeZone: 'Africa/Johannesburg',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        await WhatsAppService.sendBookingConfirmation(fromPhone, {
          id: bookingResult.booking.id,
          customerName: senderName,
          serviceName: selectedService?.name || 'Classic Haircut',
          barberName: selectedBarber?.display_name || 'Assigned Master Barber',
          dateTimeFormatted: dateTimeStr,
          amount: Number(bookingResult.booking.total_amount || selectedService?.price || 120),
        });

        // Audit Trail
        await AuditService.recordLog({
          actor_email: `whatsapp:${fromPhone}`,
          actor_role: 'customer',
          action: 'whatsapp.flow_booking_created',
          entity_type: 'booking',
          entity_id: bookingResult.booking.id,
          changes: { flowData, booking: bookingResult.booking },
        });
      } else {
        await WhatsAppService.sendTextMessage(
          fromPhone,
          `⚠️ We could not complete your automated booking: ${bookingResult.error || 'Please try another time'}.\n\nTap below to speak with Curtis or choose another slot:`
        );
        await WhatsAppService.sendMainMenu(fromPhone, senderName);
      }

      return NextResponse.json({ status: 'flow_processed' }, { status: 200 });
    }

    // =========================================================================
    // CASE 2: Interactive Quick Reply Button Click
    // =========================================================================
    if (messageType === 'interactive' && message.interactive?.type === 'button_reply') {
      const buttonId = message.interactive.button_reply.id;

      if (buttonId === 'btn_book_flow' || buttonId === 'btn_book') {
        await WhatsAppService.sendBookingFlowMessage(fromPhone, WHATSAPP_FLOW_ID);
        return NextResponse.json({ status: 'flow_sent' }, { status: 200 });
      }

      if (buttonId === 'btn_signup_flow') {
        await WhatsAppService.sendSignUpFlowMessage(fromPhone);
        return NextResponse.json({ status: 'signup_flow_sent' }, { status: 200 });
      }

      if (buttonId === 'btn_review_flow') {
        await WhatsAppService.sendFeedbackFlowMessage(fromPhone);
        return NextResponse.json({ status: 'feedback_flow_sent' }, { status: 200 });
      }

      if (buttonId === 'btn_review_5') {
        await AuditService.recordLog({
          actor_email: `whatsapp:${fromPhone}`,
          actor_role: 'customer',
          action: 'whatsapp.quick_5_star_review',
          entity_type: 'customer_review',
          entity_id: fromPhone,
          changes: { rating: 5, senderName },
        });

        await WhatsAppService.sendInteractiveButtons(
          fromPhone,
          `⭐⭐⭐⭐⭐ *THANK YOU, ${senderName.toUpperCase()}!*\n\n` +
          `We appreciate you! Please take 20 seconds to drop your 5-star review on our Google Maps profile:\n` +
          `👉 https://maps.google.com/?q=Dissafyt+Studio+Cape+Town\n\n` +
          `🎁 *VIP Discount Code:* Use *FYTVIP10* when booking for 10% off your next session!`,
          [
            { id: 'btn_book_flow', title: '✂️ Book Haircut' },
            { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
          ],
          '5-Star Review',
          'Ace of Fyt Flagship'
        );
        return NextResponse.json({ status: 'quick_review_handled' }, { status: 200 });
      }

      if (buttonId === 'btn_support') {
        const admin = getSupabaseAdminClient();
        const { data: profile } = await admin
          .from('profiles')
          .select('id')
          .or(`phone.eq.${fromPhone},phone.eq.+${fromPhone}`)
          .maybeSingle();

        let query = admin
          .from('bookings')
          .select('*, service:services(*), staff:staff(*)')
          .neq('status', 'cancelled')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(1);

        if (profile?.id) {
          query = query.or(`customer_id.eq.${profile.id},notes.ilike.%${fromPhone}%`);
        } else {
          query = query.ilike('notes', `%${fromPhone}%`);
        }

        const { data: bookings } = await query;
        const activeBooking = bookings?.[0];
        await WhatsAppService.sendSupportOverview(fromPhone, senderName, activeBooking);
        return NextResponse.json({ status: 'support_overview_sent' }, { status: 200 });
      }

      if (buttonId.startsWith('btn_cancel_')) {
        const bookingId = buttonId.replace('btn_cancel_', '');
        const cancelResult = await BarbershopService.cancelBooking(bookingId, GUEST_USER_ID, true);

        if (cancelResult.success) {
          await WhatsAppService.sendInteractiveButtons(
            fromPhone,
            `✅ *APPOINTMENT CANCELLED*\n\n` +
            `Your booking (\`${bookingId.slice(0, 8)}\`) has been cancelled successfully.\n\n` +
            `Your chair slot has been released. Whenever you are ready to book a new appointment, tap below:`,
            [
              { id: 'btn_book_flow', title: '✂️ Book Haircut' },
              { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
            ],
            'Cancelled',
            'Dissafyt Studio'
          );

          try {
            await WhatsAppService.sendTextMessage(
              CURTIS_PHONE,
              `⚠️ *CHAIR SLOT CANCELLED VIA WHATSAPP*\n\n` +
              `• *Client:* ${senderName} (+${fromPhone})\n` +
              `• *Booking Ref:* \`${bookingId.slice(0, 8)}\`\n` +
              `• *Slot Released:* Studio calendar updated.`
            );
          } catch (curtisErr) {
            console.warn('Could not alert Curtis of cancellation:', curtisErr);
          }

          await AuditService.recordLog({
            actor_email: `whatsapp:${fromPhone}`,
            actor_role: 'customer',
            action: 'whatsapp.appointment_cancelled',
            entity_type: 'booking',
            entity_id: bookingId,
            changes: { senderName, fromPhone, cancelled_at: new Date().toISOString() },
          });
        } else {
          await WhatsAppService.sendTextMessage(
            fromPhone,
            `⚠️ We could not cancel booking \`${bookingId.slice(0, 8)}\`: ${cancelResult.error || 'Please talk to Curtis'}.`
          );
          await WhatsAppService.sendMainMenu(fromPhone, senderName);
        }

        return NextResponse.json({ status: 'cancel_processed' }, { status: 200 });
      }

      if (buttonId.startsWith('btn_reschedule_')) {
        const bookingId = buttonId.replace('btn_reschedule_', '');
        await WhatsAppService.sendTextMessage(
          fromPhone,
          `🔄 *RESCHEDULING APPOINTMENT \`${bookingId.slice(0, 8)}\`*\n\n` +
          `Tap below to select your new preferred service, barber, day, and time:`
        );
        await WhatsAppService.sendBookingFlowMessage(fromPhone, WHATSAPP_FLOW_ID);
        return NextResponse.json({ status: 'reschedule_flow_sent' }, { status: 200 });
      }

      if (buttonId === 'btn_talk_curtis') {
        const reply = [
          `🔥 *CONNECTED WITH CURTIS*`,
          ``,
          `Hi *${senderName}*, Curtis has been notified and will jump directly into this WhatsApp chat with you shortly!`,
          ``,
          `Feel free to reply right here with what you need, reference photos of haircuts, or styling requests.`,
        ].join('\n');

        await WhatsAppService.sendTextMessage(fromPhone, reply);

        // Notify Curtis on his studio WhatsApp with a direct link to the customer
        if (CURTIS_PHONE && CURTIS_PHONE !== fromPhone) {
          try {
            await WhatsAppService.sendTextMessage(
              CURTIS_PHONE,
              `🚨 *CLIENT CONCIERGE REQUEST*\n\n*${senderName}* (+${fromPhone}) tapped *Talk with Curtis* on WhatsApp!\n\n👉 Click to chat with client: https://wa.me/${fromPhone}`
            );
          } catch (notifyErr) {
            console.warn('Failed to notify Curtis on WhatsApp:', notifyErr);
          }
        }

        // Audit & alert
        await AuditService.recordLog({
          actor_email: `whatsapp:${fromPhone}`,
          actor_role: 'customer',
          action: 'whatsapp.talk_to_curtis_requested',
          entity_type: 'whatsapp_conversation',
          entity_id: fromPhone,
          changes: { senderName, fromPhone, requested_at: new Date().toISOString() },
        });

        return NextResponse.json({ status: 'curtis_alerted' }, { status: 200 });
      }

      if (buttonId === 'btn_studio_info') {
        const info = [
          `💈 *ACE OF FYT FLAGSHIP STUDIO*`,
          ``,
          `📍 *Address:* Ace of Fyt Flagship Studio, Cape Town, Western Cape`,
          `🗺️ *Google Maps:* https://maps.google.com/?q=Dissafyt+Studio+Cape+Town`,
          `⏰ *Hours:* Tue – Sat: 09:00 – 19:00 | Sun: 10:00 – 16:00`,
          `📞 *Studio Line:* +27 81 808 2570`,
          `☕ *Perks:* Specialty espresso bar, secure parking, garment lab lounge`,
        ].join('\n');

        await WhatsAppService.sendInteractiveButtons(
          fromPhone,
          info,
          [
            { id: 'btn_book_flow', title: '✂️ Book Haircut' },
            { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
          ],
          'Studio Location'
        );

        return NextResponse.json({ status: 'studio_info_sent' }, { status: 200 });
      }

      if (buttonId === 'btn_on_my_way') {
        await WhatsAppService.sendTextMessage(
          fromPhone,
          `💈 *Great!* Your chair is prepped and the master barber is ready for you at Dissafyt Studio Cape Town. See you shortly!`
        );
        return NextResponse.json({ status: 'acknowledged' }, { status: 200 });
      }
    }

    // =========================================================================
    // CASE 3: Inbound Text Messages ("Hi", "Book", "Pay", etc.)
    // =========================================================================
    if (messageType === 'text') {
      const textBody = (message.text?.body || '').trim().toLowerCase();

      // If user asks for post-haircut review / feedback
      if (textBody.includes('review') || textBody.includes('feedback') || textBody.includes('rate') || textBody.includes('star')) {
        await WhatsAppService.sendPostHaircutReviewPrompt(fromPhone, senderName);
        return NextResponse.json({ status: 'review_prompt_sent' }, { status: 200 });
      }

      // If user asks for appointment help, cancel, reschedule, or status
      if (
        textBody.includes('support') ||
        textBody.includes('help') ||
        textBody.includes('cancel') ||
        textBody.includes('reschedule') ||
        textBody.includes('my booking') ||
        textBody.includes('status')
      ) {
        const admin = getSupabaseAdminClient();
        const { data: profile } = await admin
          .from('profiles')
          .select('id')
          .or(`phone.eq.${fromPhone},phone.eq.+${fromPhone}`)
          .maybeSingle();

        let query = admin
          .from('bookings')
          .select('*, service:services(*), staff:staff(*)')
          .neq('status', 'cancelled')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(1);

        if (profile?.id) {
          query = query.or(`customer_id.eq.${profile.id},notes.ilike.%${fromPhone}%`);
        } else {
          query = query.ilike('notes', `%${fromPhone}%`);
        }

        const { data: bookings } = await query;
        const activeBooking = bookings?.[0];
        await WhatsAppService.sendSupportOverview(fromPhone, senderName, activeBooking);
        return NextResponse.json({ status: 'support_overview_sent' }, { status: 200 });
      }

      // If user asks for account, signup, login
      if (
        textBody.includes('signup') ||
        textBody.includes('sign up') ||
        textBody.includes('register') ||
        textBody.includes('join') ||
        textBody.includes('login') ||
        textBody.includes('account')
      ) {
        await WhatsAppService.sendSignUpFlowMessage(fromPhone);
        return NextResponse.json({ status: 'signup_flow_sent' }, { status: 200 });
      }

      // If user asks to book
      if (textBody.includes('book') || textBody.includes('haircut') || textBody.includes('cut') || textBody.includes('fade')) {
        await WhatsAppService.sendBookingFlowMessage(fromPhone, WHATSAPP_FLOW_ID);
        return NextResponse.json({ status: 'flow_triggered' }, { status: 200 });
      }

      // If user asks for payment or pay-me link
      if (textBody.includes('pay') || textBody.includes('link') || textBody.includes('card')) {
        const payMeLink = WhatsAppService.generatePayMeLink({
          amount: 120,
          itemName: 'Ace of Fyt Haircut',
          customerPhone: fromPhone,
          customerName: senderName,
        });

        const payMessage = [
          `💳 *DISSAFYT SECURE PAY-ME LINK*`,
          ``,
          `Here is your direct PayFast payment link:`,
          `${payMeLink}`,
          ``,
          `Supports Visa, Mastercard, Instant EFT, SnapScan, and Masterpass.`,
        ].join('\n');

        await WhatsAppService.sendInteractiveButtons(
          fromPhone,
          payMessage,
          [
            { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
            { id: 'btn_book_flow', title: '✂️ Book Haircut' },
          ],
          'Pay-Me Link'
        );

        return NextResponse.json({ status: 'pay_link_sent' }, { status: 200 });
      }

      // Default: Send Interactive Main Menu
      await WhatsAppService.sendMainMenu(fromPhone, senderName);
      return NextResponse.json({ status: 'menu_sent' }, { status: 200 });
    }

    return NextResponse.json({ status: 'processed' }, { status: 200 });
  } catch (err: any) {
    console.error('WhatsApp Webhook handler error:', err);
    return NextResponse.json({ error: err.message || 'Internal webhook error' }, { status: 500 });
  }
}
