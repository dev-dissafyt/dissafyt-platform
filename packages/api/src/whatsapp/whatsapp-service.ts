import { getSupabaseAdminClient } from '@dissafyt/database';
import { PayfastService } from '../commerce/payfast-service';
import { AuditService } from '../audit/audit-service';

export const WHATSAPP_FLOW_ID = '4355963527988248';
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
   * Sends the primary Interactive Main Menu for greeting and self-service.
   */
  static async sendMainMenu(to: string, userName = 'there'): Promise<WhatsAppSendResult> {
    const body = [
      `🔥 *WELCOME TO DISSAFYT & ACE OF FYT*`,
      ``,
      `Hi *${userName}*, how can we help you today?`,
      ``,
      `Choose an option below to book your chair session, settle payment, check studio details, or talk directly with Curtis.`,
    ].join('\n');

    return this.sendInteractiveButtons(
      to,
      body,
      [
        { id: 'btn_book_flow', title: '✂️ Book Haircut' },
        { id: 'btn_talk_curtis', title: '💬 Talk with Curtis' },
        { id: 'btn_studio_info', title: '📍 Studio & Hours' },
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
