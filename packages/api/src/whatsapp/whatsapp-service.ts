import { getSupabaseAdminClient } from '@dissafyt/database';
import { PayfastService } from '../commerce/payfast-service';
import { AuditService } from '../audit/audit-service';

export const WHATSAPP_FLOW_ID = process.env.WHATSAPP_FLOW_ID || '4355963527988248';
export const WHATSAPP_SIGNUP_FLOW_ID = process.env.WHATSAPP_SIGNUP_FLOW_ID || WHATSAPP_FLOW_ID;
export const WHATSAPP_FEEDBACK_FLOW_ID = process.env.WHATSAPP_FEEDBACK_FLOW_ID || WHATSAPP_FLOW_ID;
export const WHATSAPP_SUPPORT_FLOW_ID = process.env.WHATSAPP_SUPPORT_FLOW_ID || WHATSAPP_FLOW_ID;
export const WHATSAPP_API_VERSION = 'v20.0';
export const DEFAULT_VERIFY_TOKEN = 'dissafyt_whatsapp_verify_2026';

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppService {
  private static get phoneNumberId(): string {
    return process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  private static get accessToken(): string {
    return process.env.WHATSAPP_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN || '';
  }

  private static get baseUrl(): string {
    const id = this.phoneNumberId;
    return `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${id}/messages`;
  }

  /**
   * Cleans and formats phone numbers to international E.164 without leading plus (e.g. 27821234567).
   */
  static formatPhoneNumber(phone: string): string {
    let clean = phone.replace(/[^0-9]/g, '');
    // If local South African number starting with 0, convert to 27
    if (clean.startsWith('0') && clean.length === 10) {
      clean = `27${clean.slice(1)}`;
    }
    return clean;
  }

  /**
   * Internal wrapper to POST to Meta WhatsApp Graph API.
   */
  private static async sendGraphPayload(payload: any): Promise<WhatsAppSendResult> {
    const token = this.accessToken;
    const url = this.baseUrl;

    if (!token || !this.phoneNumberId) {
      console.warn('WhatsApp API credentials missing (WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN)');
      return { success: false, error: 'WhatsApp credentials not configured on server' };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        console.error('Meta WhatsApp API error response:', data);
        return {
          success: false,
          error: data.error?.message || `WhatsApp API error (${res.status})`,
        };
      }

      const messageId = data.messages?.[0]?.id;
      return { success: true, messageId };
    } catch (err: any) {
      console.error('Meta WhatsApp API fetch error:', err);
      return { success: false, error: err.message || 'Network error calling WhatsApp API' };
    }
  }

  /**
   * Sends a plain text WhatsApp message.
   */
  static async sendTextMessage(to: string, text: string): Promise<WhatsAppSendResult> {
    const formattedTo = this.formatPhoneNumber(to);
    return this.sendGraphPayload({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedTo,
      type: 'text',
      text: { body: text },
    });
  }

  /**
   * Sends an interactive message with up to 3 Quick Reply buttons.
   */
  static async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: { id: string; title: string }[],
    headerText?: string,
    footerText = 'Dissafyt Platform • Cape Town'
  ): Promise<WhatsAppSendResult> {
    const formattedTo = this.formatPhoneNumber(to);
    const actionButtons = buttons.slice(0, 3).map((b) => ({
      type: 'reply',
      reply: {
        id: b.id,
        title: b.title.slice(0, 20), // Meta limit: 20 chars
      },
    }));

    const interactivePayload: any = {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: actionButtons },
    };

    if (headerText) {
      interactivePayload.header = { type: 'text', text: headerText };
    }
    if (footerText) {
      interactivePayload.footer = { text: footerText };
    }

    return this.sendGraphPayload({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedTo,
      type: 'interactive',
      interactive: interactivePayload,
    });
  }

  /**
   * Sends an interactive List Menu with multiple sections and options.
   */
  static async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonLabel: string,
    sections: {
      title: string;
      rows: { id: string; title: string; description?: string }[];
    }[],
    headerText?: string,
    footerText = 'Dissafyt Concierge • Cape Town'
  ): Promise<WhatsAppSendResult> {
    const formattedTo = this.formatPhoneNumber(to);
    const interactivePayload: any = {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonLabel.slice(0, 20),
        sections: sections.map((s) => ({
          title: s.title.slice(0, 24),
          rows: s.rows.slice(0, 10).map((r) => ({
            id: r.id,
            title: r.title.slice(0, 24),
            description: r.description ? r.description.slice(0, 72) : undefined,
          })),
        })),
      },
    };

    if (headerText) {
      interactivePayload.header = { type: 'text', text: headerText };
    }
    if (footerText) {
      interactivePayload.footer = { text: footerText };
    }

    return this.sendGraphPayload({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedTo,
      type: 'interactive',
      interactive: interactivePayload,
    });
  }

  /**
   * Sends the native WhatsApp Booking Flow [Flow_ID = 4355963527988248].
   */
  static async sendBookingFlowMessage(
    to: string,
    flowId = WHATSAPP_FLOW_ID,
    flowCta = 'Book Haircut',
    screen = 'APPOINTMENT_SELECTION'
  ): Promise<WhatsAppSendResult> {
    const formattedTo = this.formatPhoneNumber(to);
    const flowToken = `bk_${Date.now()}_${formattedTo.slice(-4)}`;

    return this.sendGraphPayload({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedTo,
      type: 'interactive',
      interactive: {
        type: 'flow',
        header: {
          type: 'text',
          text: 'Ace of Fyt Barbershop',
        },
        body: {
          text: 'Reserve your haircut with our master barbers at Dissafyt Studio Cape Town. Tap below to select your service, barber, and preferred time slot.',
        },
        footer: {
          text: 'Dissafyt Platform • Cape Town',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: flowToken,
            flow_id: flowId,
            flow_cta: flowCta,
            flow_action: 'navigate',
            flow_action_payload: {
              screen,
            },
          },
        },
      },
    });
  }

  /**
   * Sends the native WhatsApp Sign-Up / Login Flow.
   */
  static async sendSignUpFlowMessage(
    to: string,
    flowId = WHATSAPP_SIGNUP_FLOW_ID,
    flowCta = 'Sign In / Join',
    screen = 'SIGN_IN'
  ): Promise<WhatsAppSendResult> {
    const formattedTo = this.formatPhoneNumber(to);
    const flowToken = `auth_${Date.now()}_${formattedTo.slice(-4)}`;

    return this.sendGraphPayload({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedTo,
      type: 'interactive',
      interactive: {
        type: 'flow',
        header: {
          type: 'text',
          text: 'Dissafyt Membership',
        },
        body: {
          text: 'Sign in to your Dissafyt account or register as a new client to unlock VIP barber scheduling and grooming perks.',
        },
        footer: {
          text: 'Dissafyt Platform • Cape Town',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: flowToken,
            flow_id: flowId,
            flow_cta: flowCta,
            flow_action: 'navigate',
            flow_action_payload: {
              screen,
            },
          },
        },
      },
    });
  }

  /**
   * Sends the native WhatsApp Feedback / Review Flow.
   */
  static async sendFeedbackFlowMessage(
    to: string,
    flowId = WHATSAPP_FEEDBACK_FLOW_ID,
    flowCta = 'Review Haircut',
    screen = 'FEEDBACK'
  ): Promise<WhatsAppSendResult> {
    const formattedTo = this.formatPhoneNumber(to);
    const flowToken = `rev_${Date.now()}_${formattedTo.slice(-4)}`;

    return this.sendGraphPayload({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedTo,
      type: 'interactive',
      interactive: {
        type: 'flow',
        header: {
          type: 'text',
          text: 'Ace of Fyt Reviews',
        },
        body: {
          text: 'How was your haircut today? Share your thoughts with Curtis Lee and the team to help us continually elevate your studio experience.',
        },
        footer: {
          text: 'Dissafyt Platform • Cape Town',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: flowToken,
            flow_id: flowId,
            flow_cta: flowCta,
            flow_action: 'navigate',
            flow_action_payload: {
              screen,
            },
          },
        },
      },
    });
  }

  /**
   * Sends the native WhatsApp Customer Support & Appointment Help Flow.
   */
  static async sendSupportFlowMessage(
    to: string,
    flowId = WHATSAPP_SUPPORT_FLOW_ID,
    flowCta = 'Appointment Help',
    screen = 'SUPPORT_TICKET'
  ): Promise<WhatsAppSendResult> {
    const formattedTo = this.formatPhoneNumber(to);
    const flowToken = `sup_${Date.now()}_${formattedTo.slice(-4)}`;

    return this.sendGraphPayload({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedTo,
      type: 'interactive',
      interactive: {
        type: 'flow',
        header: {
          type: 'text',
          text: 'Dissafyt Concierge Support',
        },
        body: {
          text: 'Need to reschedule, cancel, or ask Curtis about haircut styling? Submit your inquiry directly and we will assist you immediately.',
        },
        footer: {
          text: 'Dissafyt Platform • Cape Town',
        },
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: flowToken,
            flow_id: flowId,
            flow_cta: flowCta,
            flow_action: 'navigate',
            flow_action_payload: {
              screen,
            },
          },
        },
      },
    });
  }

  /**
   * Sends an automated post-haircut review prompt with interactive buttons.
   */
  static async sendPostHaircutReviewPrompt(
    to: string,
    clientName = 'there',
    barberName = 'Curtis Lee'
  ): Promise<WhatsAppSendResult> {
    const body = [
      `💈 *HOW WAS YOUR CHAIR SESSION?*`,
      ``,
      `Hi *${clientName}*, we hope you are looking and feeling fresh after your session with *${barberName}* at Ace of Fyt Cape Town!`,
      ``,
      `Your feedback directly shapes our craft. Tap below to share your rating with Curtis:`,
    ].join('\n');

    return this.sendInteractiveButtons(
      to,
      body,
      [
        { id: 'btn_review_flow', title: '⭐ Review Haircut' },
        { id: 'btn_review_5', title: '⭐⭐⭐⭐⭐ 5 Stars' },
        { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
      ],
      'Ace of Fyt Review',
      'Dissafyt Platform'
    );
  }

  /**
   * Sends customer appointment support overview with one-tap reschedule and cancellation actions.
   */
  static async sendSupportOverview(
    to: string,
    clientName = 'there',
    booking?: any
  ): Promise<WhatsAppSendResult> {
    if (booking) {
      const formattedDate = new Date(booking.start_time).toLocaleString('en-ZA', {
        timeZone: 'Africa/Johannesburg',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const body = [
        `💈 *YOUR UPCOMING APPOINTMENT*`,
        ``,
        `Hi *${clientName}*, here are the details for your chair session:`,
        ``,
        `• *Ref:* \`${booking.id.slice(0, 8)}\``,
        `• *Service:* ${booking.service?.name || 'Haircut'}`,
        `• *Barber:* ${booking.staff?.display_name || 'Assigned Barber'}`,
        `• *Time:* ${formattedDate} SAST`,
        `• *Status:* ${booking.status === 'confirmed' ? '✅ Confirmed' : '⏳ ' + booking.status}`,
        ``,
        `How would you like to proceed?`,
      ].join('\n');

      return this.sendInteractiveButtons(
        to,
        body,
        [
          { id: `btn_reschedule_${booking.id}`, title: '🔄 Reschedule' },
          { id: `btn_cancel_${booking.id}`, title: '❌ Cancel Booking' },
          { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
        ],
        'Appointment Support',
        'Ace of Fyt Flagship'
      );
    }

    const body = [
      `ℹ️ *APPOINTMENT & STUDIO HELP*`,
      ``,
      `Hi *${clientName}*, we do not see an active upcoming booking linked to your number.`,
      ``,
      `Would you like to reserve a chair session, view our studio details, or talk directly with Curtis?`,
    ].join('\n');

    return this.sendInteractiveButtons(
      to,
      body,
      [
        { id: 'btn_book_flow', title: '✂️ Book Haircut' },
        { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
        { id: 'btn_studio_info', title: '📍 Studio & Hours' },
      ],
      'Dissafyt Support',
      'Ace of Fyt Flagship'
    );
  }

  /**
   * Sends the primary Interactive Main Menu for greeting and self-service.
   */
  static async sendMainMenu(to: string, userName = 'there'): Promise<WhatsAppSendResult> {
    const body = [
      `🔥 *WELCOME TO DISSAFYT & ACE OF FYT*`,
      ``,
      `Hi *${userName}*, welcome to our WhatsApp concierge.`,
      ``,
      `Reserve your chair, manage appointments, sign in, or chat directly with master barber Curtis Lee.`,
    ].join('\n');

    return this.sendInteractiveButtons(
      to,
      body,
      [
        { id: 'btn_book_flow', title: '✂️ Book Haircut' },
        { id: 'btn_support', title: '🆘 Appointment Help' },
        { id: 'btn_signup_flow', title: '👤 Join / Sign-In' },
      ],
      'Dissafyt Flagship Cape Town',
      'Ace of Fyt Guild'
    );
  }

  /**
   * Generates a secure PayFast "Pay-Me" checkout link for bookings or custom amounts.
   */
  static generatePayMeLink(params: {
    bookingId?: string;
    orderId?: string;
    amount: number;
    itemName: string;
    customerPhone?: string;
    customerName?: string;
  }): string {
    const isProd = process.env.NODE_ENV === 'production';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (isProd ? 'https://dissafyt.com' : 'http://localhost:3000');

    const searchParams = new URLSearchParams();
    if (params.bookingId) searchParams.set('booking_id', params.bookingId);
    if (params.orderId) searchParams.set('order_id', params.orderId);
    searchParams.set('amount', params.amount.toFixed(2));
    searchParams.set('item', params.itemName);
    if (params.customerPhone) searchParams.set('phone', params.customerPhone);
    if (params.customerName) searchParams.set('name', params.customerName);

    return `${siteUrl}/pay?${searchParams.toString()}`;
  }

  /**
   * Sends a 6-digit WhatsApp verification OTP for client phone authentication.
   */
  static async sendVerificationCode(to: string, code: string): Promise<WhatsAppSendResult> {
    const body = [
      `🔒 *DISSAFYT VERIFICATION CODE*`,
      ``,
      `Your verification code is: *${code}*`,
      ``,
      `Enter this code to verify your phone number. This code expires in 10 minutes.`,
      `For security, never share this code with anyone.`,
    ].join('\n');

    return this.sendTextMessage(to, body);
  }

  /**
   * Sends an automated booking confirmation WhatsApp message with instant PayFast Pay-Me link.
   */
  static async sendBookingConfirmation(
    to: string,
    booking: {
      id: string;
      customerName: string;
      serviceName: string;
      barberName: string;
      dateTimeFormatted: string;
      amount: number;
      isSubscriptionCovered?: boolean;
    }
  ): Promise<WhatsAppSendResult> {
    const payMeLink = this.generatePayMeLink({
      bookingId: booking.id,
      amount: booking.amount,
      itemName: `Ace of Fyt: ${booking.serviceName}`,
      customerName: booking.customerName,
      customerPhone: to,
    });

    const paymentLine = booking.isSubscriptionCovered || booking.amount === 0
      ? `💎 *Payment:* Included in VIP Membership (R 0.00)`
      : `💵 *Payment Due:* R ${booking.amount.toFixed(2)}`;

    const body = [
      `✂️ *ACE OF FYT // BOOKING CONFIRMED*`,
      ``,
      `Hi *${booking.customerName}*, your appointment is locked in:`,
      ``,
      `💈 *Service:* ${booking.serviceName}`,
      `👤 *Barber:* ${booking.barberName}`,
      `📅 *Date & Time:* ${booking.dateTimeFormatted}`,
      `📍 *Location:* Dissafyt Studio, Cape Town`,
      paymentLine,
      ``,
      booking.amount > 0 && !booking.isSubscriptionCovered
        ? `👉 *Settle Online (PayFast Pay-Me):*\n${payMeLink}\n\n_Or pay via card machine in the chair on arrival._`
        : `See you in the chair!`,
    ].join('\n');

    return this.sendInteractiveButtons(
      to,
      body,
      [
        { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
        { id: 'btn_studio_info', title: '📍 Directions' },
      ],
      'Booking Confirmed'
    );
  }

  /**
   * Sends an automated 2-hour pre-appointment reminder WhatsApp message.
   */
  static async sendBookingReminder(
    to: string,
    booking: {
      id: string;
      customerName: string;
      serviceName: string;
      barberName: string;
      timeFormatted: string;
      amount: number;
      isSubscriptionCovered?: boolean;
    }
  ): Promise<WhatsAppSendResult> {
    const body = [
      `⏳ *ACE OF FYT APPOINTMENT REMINDER*`,
      ``,
      `Hi *${booking.customerName}*, your chair session is coming up in *2 hours*!`,
      ``,
      `💈 *Service:* ${booking.serviceName}`,
      `👤 *Barber:* ${booking.barberName}`,
      `⏰ *Time:* ${booking.timeFormatted} (SAST)`,
      `📍 *Studio:* Dissafyt Studio, Cape Town`,
      ``,
      `Please arrive 5 minutes early. If you need to reschedule or talk to Curtis, tap below.`,
    ].join('\n');

    return this.sendInteractiveButtons(
      to,
      body,
      [
        { id: 'btn_on_my_way', title: '✅ On My Way' },
        { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
      ],
      '2-Hour Reminder'
    );
  }
}
