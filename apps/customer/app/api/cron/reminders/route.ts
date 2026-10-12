import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppService, EmailService, BarbershopService, AuditService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/reminders
 * Automated cron worker that dispatches 2-hour pre-appointment WhatsApp and Email reminders
 * with studio address and prefilled Google Maps turn-by-turn directions.
 * Can be called by Vercel Cron or external scheduler every 15 minutes.
 */
export async function GET(request: NextRequest) {
  // Optional security token check for cron triggers
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdminClient();
    const now = new Date();

    // 2-hour window: 100 minutes to 140 minutes from now
    const windowStart = new Date(now.getTime() + 100 * 60 * 1000).toISOString();
    const windowEnd = new Date(now.getTime() + 140 * 60 * 1000).toISOString();

    // Fetch locations to resolve studio addresses and directions
    const locations = await BarbershopService.listLocations().catch(() => []);

    // Fetch confirmed bookings starting in this window
    const { data: upcomingBookings, error: bErr } = await admin
      .from('bookings')
      .select(`
        id,
        customer_id,
        service_id,
        staff_id,
        location_id,
        start_time,
        total_amount,
        status,
        is_subscription_covered,
        notes,
        service:services(name),
        staff:staff(display_name, location_id),
        customer:profiles(full_name, phone, email)
      `)
      .eq('status', 'confirmed')
      .gte('start_time', windowStart)
      .lte('start_time', windowEnd);

    if (bErr) {
      console.error('Failed to fetch upcoming bookings for reminders:', bErr);
      return NextResponse.json({ error: bErr.message }, { status: 500 });
    }

    if (!upcomingBookings || upcomingBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No upcoming appointments due for 2-hour reminders in this window.',
        processed: 0,
      });
    }

    let remindersDispatched = 0;
    const results: any[] = [];

    for (const booking of upcomingBookings) {
      // 1. Resolve studio location and directions
      const bookingLocId =
        (booking as any).location_id ||
        (booking.staff as any)?.location_id ||
        'loc-cpt-flagship';
      const loc = locations.find((l) => l.id === bookingLocId) || locations[0];
      const locationName = loc?.name || 'Dissafyt Studio - Bernie';
      const locationAddress = loc?.address || '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570';
      const googleMapsUrl =
        loc?.google_maps_url ||
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationAddress + ', South Africa')}`;

      // 2. Resolve phone number and email
      let phone = (booking.customer as any)?.phone;
      if (!phone && booking.notes) {
        const match = booking.notes.match(/(?:27|0)\d{9}/);
        if (match) phone = match[0];
      }
      const customerEmail = (booking.customer as any)?.email;

      if (!phone && !customerEmail) {
        results.push({ bookingId: booking.id, status: 'skipped_no_contact' });
        continue;
      }

      // 3. Prevent duplicate reminders for the same booking
      const { data: alreadySent } = await admin
        .from('audit_logs')
        .select('id')
        .eq('entity_id', booking.id)
        .eq('action', 'booking.reminder_sent')
        .maybeSingle();

      if (alreadySent) {
        results.push({ bookingId: booking.id, status: 'already_sent' });
        continue;
      }

      // 4. Format SAST appointment time
      const startTime = new Date(booking.start_time);
      const timeFormatted = startTime.toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Africa/Johannesburg',
      });

      const customerName = (booking.customer as any)?.full_name || 'Valued Client';
      const serviceName = (booking.service as any)?.name || 'Classic Haircut';
      const barberName = (booking.staff as any)?.display_name || 'Master Barber';

      let waDispatched = false;
      let emailDispatched = false;

      // 5. Dispatch WhatsApp reminder if phone exists
      if (phone) {
        const sendResult = await WhatsAppService.sendBookingReminder(phone, {
          id: booking.id,
          customerName,
          serviceName,
          barberName,
          timeFormatted,
          amount: Number(booking.total_amount || 0),
          isSubscriptionCovered: Boolean(booking.is_subscription_covered),
          locationName,
          locationAddress,
          directionsUrl: googleMapsUrl,
          googleMapsUrl,
        });
        if (sendResult.success) waDispatched = true;
      }

      // 6. Dispatch Email reminder with directions if email exists
      if (customerEmail) {
        try {
          await EmailService.sendBookingReminder({
            bookingId: booking.id,
            customerName,
            customerEmail,
            serviceName,
            staffName: barberName,
            startTime: booking.start_time,
            totalAmount: Number(booking.total_amount || 0),
            paymentStatus: booking.is_subscription_covered ? 'Covered by Membership' : 'Confirmed',
            locationName,
            locationAddress,
            googleMapsUrl,
            directionsUrl: googleMapsUrl,
          });
          emailDispatched = true;
        } catch (e) {
          console.warn(`Email reminder failed for booking ${booking.id}:`, e);
        }
      }

      if (waDispatched || emailDispatched) {
        remindersDispatched++;

        // 7. Record idempotent audit log
        await AuditService.recordLog({
          actor_email: 'cron@dissafyt.com',
          actor_role: 'system',
          action: 'booking.reminder_sent',
          entity_type: 'booking',
          entity_id: booking.id,
          changes: {
            phone,
            customerEmail,
            start_time: booking.start_time,
            locationName,
            locationAddress,
            googleMapsUrl,
            waDispatched,
            emailDispatched,
          },
        });

        results.push({ bookingId: booking.id, status: 'sent', waDispatched, emailDispatched });
      } else {
        results.push({ bookingId: booking.id, status: 'failed_dispatch' });
      }
    }

    return NextResponse.json({
      success: true,
      window: { start: windowStart, end: windowEnd },
      remindersDispatched,
      results,
    });
  } catch (err: any) {
    console.error('Reminder cron error:', err);
    return NextResponse.json({ error: err.message || 'Internal cron error' }, { status: 500 });
  }
}
