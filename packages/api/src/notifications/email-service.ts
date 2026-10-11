/**
 * Dissafyt Sovereign Email Service
 * High-deliverability transactional email dispatcher powered by Resend.
 * Brand Aesthetic: Luxury Black (#09090b) with Voltage Orange (#ff5500) accents.
 */

export interface EmailDispatchOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface OrderEmailItem {
  name: string;
  variant?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderConfirmationPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderEmailItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress?: {
    recipient_name?: string;
    street_address?: string;
    suburb?: string;
    city?: string;
    postal_code?: string;
  };
  trackingUrl?: string;
}

export interface BookingConfirmationPayload {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  staffName?: string;
  startTime: string | Date;
  locationName?: string;
  locationAddress?: string;
  totalAmount: number;
  paymentStatus: string;
  bookingUrl?: string;
}

export interface ShippingUpdatePayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  courierName?: string;
  trackingNumber: string;
  trackingUrl?: string;
  destinationCity?: string;
}

export interface TicketAcknowledgmentPayload {
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  messagePreview: string;
}

export interface AbandonedCartPayload {
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  cartTotal: number;
  checkoutUrl: string;
}

export class EmailService {
  private static readonly DEFAULT_FROM = 'Dissafyt Concierge <concierge@dissafyt.com>';
  private static readonly DEFAULT_REPLY_TO = 'letstalk@dissafyt.com';

  private static getApiKey(): string | null {
    return (
      process.env.RESEND_API_KEY ||
      process.env.RESEND_API ||
      null
    );
  }

  /**
   * Low-level dispatcher sending via Resend REST API
   */
  static async send(options: EmailDispatchOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('[EmailService] RESEND_API_KEY is not configured. Email suppressed.');
      return { success: false, error: 'RESEND_API_KEY missing' };
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const cleanRecipients = recipients.map((r) => r.trim()).filter(Boolean);

    if (cleanRecipients.length === 0) {
      return { success: false, error: 'No recipients provided' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from || this.DEFAULT_FROM,
          to: cleanRecipients,
          reply_to: options.replyTo || this.DEFAULT_REPLY_TO,
          subject: options.subject,
          html: options.html,
          text: options.text || undefined,
          tags: options.tags || undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.error('[EmailService] Resend API error:', response.status, errJson);
        return { success: false, error: errJson.message || `HTTP ${response.status}` };
      }

      const data = await response.json();
      console.log(`[EmailService] Dispatched "${options.subject}" to ${cleanRecipients.join(', ')} (ID: ${data.id})`);
      return { success: true, id: data.id };
    } catch (err: any) {
      console.error('[EmailService] Network exception sending email:', err);
      return { success: false, error: err.message || 'Dispatch failure' };
    }
  }

  /**
   * Wrap content in the unified Dissafyt Black & Voltage Orange HTML shell
   */
  private static renderShell(contentHtml: string, previewText?: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Dissafyt Concierge</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#f4f4f5;">
  ${previewText ? `<div style="display:none;font-size:1px;color:#09090b;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#111114;border:1px solid #27272a;border-radius:10px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,0.6);">
          
          <!-- Top Voltage Orange Glow Strip -->
          <tr>
            <td style="background-color:#ff5500;background:linear-gradient(90deg,#ff5500,#ff8800);height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Brand Header with Official Logo -->
          <tr>
            <td style="padding:28px 32px 22px;border-bottom:1px solid #1f1f23;text-align:left;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <a href="https://dissafyt.com" style="text-decoration:none;display:inline-block;" target="_blank">
                      <img src="https://dissafyt.com/logo.png" alt="DISSAFYT" width="140" style="display:block;max-width:140px;height:auto;border:0;outline:none;text-decoration:none;" />
                    </a>
                    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#ff5500;margin-top:6px;text-transform:uppercase;">
                      Sovereign Concierge
                    </div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;padding:5px 12px;background-color:#1c1917;border:1px solid #292524;border-radius:999px;font-size:10px;color:#a8a29e;font-family:monospace;letter-spacing:1px;text-transform:uppercase;">
                      Cape Town &bull; ZA
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dynamic Body Content -->
          <tr>
            <td style="padding:32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Sovereign Footer -->
          <tr>
            <td style="padding:28px 32px;background-color:#0c0a09;border-top:1px solid #1f1f23;text-align:center;color:#71717a;font-size:12px;line-height:1.6;">
              <div style="margin-bottom:12px;">
                <img src="https://dissafyt.com/logo.png" alt="DISSAFYT" width="70" style="display:inline-block;max-width:70px;height:auto;opacity:0.4;" />
              </div>
              <div style="color:#d4d4d8;font-weight:600;margin-bottom:4px;">
                Dissafyt Studio &bull; Cape Town Flagship
              </div>
              <div style="margin-bottom:12px;color:#a1a1aa;">
                1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570
              </div>
              <div style="border-top:1px solid #1c1917;padding-top:12px;font-size:11px;color:#71717a;">
                Direct inquiries or replies route to <a href="mailto:letstalk@dissafyt.com" style="color:#ff5500;text-decoration:none;font-weight:600;">letstalk@dissafyt.com</a> &bull; <a href="https://dissafyt.com/unsubscribe" style="color:#71717a;text-decoration:underline;">Unsubscribe</a>
                <br/>
                &copy; ${new Date().getFullYear()} Dissafyt Platform. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * 1. Order Confirmation & Itemized Receipt
   */
  static async sendOrderConfirmation(payload: OrderConfirmationPayload) {
    const itemsRows = payload.items
      .map(
        (i) => `
        <tr style="border-bottom:1px solid #27272a;">
          <td style="padding:12px 0;color:#f4f4f5;font-weight:600;font-size:14px;">
            ${i.name}
            ${i.variant ? `<br/><span style="font-size:12px;color:#a1a1aa;font-weight:400;">Variant: ${i.variant}</span>` : ''}
          </td>
          <td align="center" style="padding:12px 8px;color:#a1a1aa;font-size:13px;font-family:monospace;">
            ${i.quantity}
          </td>
          <td align="right" style="padding:12px 0;color:#ff5500;font-weight:700;font-size:14px;font-family:monospace;">
            R${i.total.toFixed(2)}
          </td>
        </tr>`
      )
      .join('');

    const addressHtml = payload.shippingAddress?.street_address
      ? `<div style="margin-top:20px;padding:16px;background-color:#18181b;border:1px solid #27272a;border-radius:6px;">
          <div style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:6px;">Delivery Destination</div>
          <div style="color:#f4f4f5;font-size:13px;line-height:1.4;">
            ${payload.shippingAddress.recipient_name ? `<strong>${payload.shippingAddress.recipient_name}</strong><br/>` : ''}
            ${payload.shippingAddress.street_address}<br/>
            ${payload.shippingAddress.suburb ? `${payload.shippingAddress.suburb}, ` : ''}${payload.shippingAddress.city || ''} ${payload.shippingAddress.postal_code || ''}
          </div>
        </div>`
      : '';

    const content = `
      <div style="margin-bottom:24px;">
        <span style="background-color:rgba(255,85,0,0.15);color:#ff5500;border:1px solid rgba(255,85,0,0.4);border-radius:4px;padding:4px 8px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
          Verified Payment
        </span>
        <h2 style="color:#ffffff;font-size:22px;font-weight:800;margin:12px 0 6px;">
          Order #${payload.orderNumber}
        </h2>
        <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
          Salute ${payload.customerName}, your order has been registered in the production vault and is being prepared.
        </p>
      </div>

      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <thead>
            <tr style="border-bottom:1px solid #3f3f46;">
              <th align="left" style="padding-bottom:8px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Garment / Item</th>
              <th align="center" style="padding-bottom:8px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:50px;">Qty</th>
              <th align="right" style="padding-bottom:8px;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" align="left" style="padding-top:14px;color:#a1a1aa;font-size:13px;">Subtotal</td>
              <td align="right" style="padding-top:14px;color:#f4f4f5;font-size:13px;font-family:monospace;">R${payload.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2" align="left" style="padding-top:6px;color:#a1a1aa;font-size:13px;">Door-to-Door Courier</td>
              <td align="right" style="padding-top:6px;color:#f4f4f5;font-size:13px;font-family:monospace;">R${payload.shippingCost.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2" align="left" style="padding-top:12px;border-top:1px solid #3f3f46;color:#ffffff;font-size:15px;font-weight:800;">Total Settled</td>
              <td align="right" style="padding-top:12px;border-top:1px solid #3f3f46;color:#ff5500;font-size:16px;font-weight:900;font-family:monospace;">R${payload.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      ${addressHtml}

      <div style="margin-top:28px;text-align:center;">
        <a href="${payload.trackingUrl || 'https://dissafyt.com/account/orders'}" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;display:inline-block;box-shadow:0 4px 14px rgba(255,85,0,0.35);">
          View Sovereign Order
        </a>
      </div>
    `;

    return this.send({
      to: payload.customerEmail,
      subject: `Order Confirmed #${payload.orderNumber} &bull; Dissafyt`,
      html: this.renderShell(content, `Order #${payload.orderNumber} confirmed. Total: R${payload.total.toFixed(2)}`),
      tags: [{ name: 'category', value: 'order_confirmation' }],
    });
  }

  /**
   * 2. Haircut & Studio Appointment Confirmation
   */
  static async sendBookingConfirmation(payload: BookingConfirmationPayload) {
    const formattedDate = new Date(payload.startTime).toLocaleString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const content = `
      <div style="margin-bottom:24px;">
        <span style="background-color:rgba(255,85,0,0.15);color:#ff5500;border:1px solid rgba(255,85,0,0.4);border-radius:4px;padding:4px 8px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
          Studio Reservation Confirmed
        </span>
        <h2 style="color:#ffffff;font-size:22px;font-weight:800;margin:12px 0 6px;">
          ${payload.serviceName}
        </h2>
        <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
          Greeting ${payload.customerName}, your chair session has been locked into the schedule.
        </p>
      </div>

      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-bottom:12px;color:#a1a1aa;font-size:13px;width:110px;">Scheduled Slot:</td>
            <td style="padding-bottom:12px;color:#ff5500;font-weight:700;font-size:14px;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding-bottom:12px;color:#a1a1aa;font-size:13px;">Lead Artist / Barber:</td>
            <td style="padding-bottom:12px;color:#f4f4f5;font-weight:600;font-size:14px;">${payload.staffName || 'Bernie'}</td>
          </tr>
          <tr>
            <td style="padding-bottom:12px;color:#a1a1aa;font-size:13px;">Studio Location:</td>
            <td style="padding-bottom:12px;color:#f4f4f5;font-size:13px;line-height:1.4;">
              <strong>${payload.locationName || 'Dissafyt Studio - Bernie'}</strong><br/>
              ${payload.locationAddress || '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570'}
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #27272a;padding-top:12px;color:#a1a1aa;font-size:13px;">Total Settled:</td>
            <td style="border-top:1px solid #27272a;padding-top:12px;color:#f4f4f5;font-weight:700;font-size:15px;font-family:monospace;">
              R${payload.totalAmount.toFixed(2)} (${payload.paymentStatus})
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color:#0c0a09;border-left:3px solid #ff5500;padding:12px 16px;margin-bottom:24px;border-radius:0 4px 4px 0;">
        <div style="color:#f4f4f5;font-size:12px;line-height:1.5;">
          <strong>Studio Etiquette:</strong> Please arrive 5 minutes prior to your allocated slot. If you need to reschedule or notify us of traffic delays, simply reply to this email.
        </div>
      </div>

      <div style="text-align:center;">
        <a href="${payload.bookingUrl || 'https://dissafyt.com/account/bookings'}" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;display:inline-block;box-shadow:0 4px 14px rgba(255,85,0,0.35);">
          Manage Appointment
        </a>
      </div>
    `;

    return this.send({
      to: payload.customerEmail,
      subject: `Appointment Confirmed: ${payload.serviceName} &bull; Dissafyt Studio`,
      html: this.renderShell(content, `Appointment booked for ${formattedDate} at Dissafyt Studio.`),
      tags: [{ name: 'category', value: 'booking_confirmation' }],
    });
  }

  /**
   * 3. Order Dispatched & Tracking Notice (The Courier Guy)
   */
  static async sendShippingUpdate(payload: ShippingUpdatePayload) {
    const courier = payload.courierName || 'The Courier Guy';
    const trackingUrl =
      payload.trackingUrl ||
      `https://portal.thecourierguy.co.za/track?tracking_reference=${encodeURIComponent(payload.trackingNumber)}`;

    const content = `
      <div style="margin-bottom:24px;">
        <span style="background-color:rgba(255,85,0,0.15);color:#ff5500;border:1px solid rgba(255,85,0,0.4);border-radius:4px;padding:4px 8px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
          En Route
        </span>
        <h2 style="color:#ffffff;font-size:22px;font-weight:800;margin:12px 0 6px;">
          Your Order Has Dispatched
        </h2>
        <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
          Peace ${payload.customerName}, Order #${payload.orderNumber} is sealed, handed over to ${courier}, and on its way to ${payload.destinationCity || 'your door'}.
        </p>
      </div>

      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
        <div style="color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Waybill / Tracking Reference</div>
        <div style="color:#ff5500;font-size:18px;font-weight:800;font-family:monospace;letter-spacing:1.5px;">
          ${payload.trackingNumber}
        </div>
        <div style="color:#a1a1aa;font-size:12px;margin-top:6px;">
          Courier Carrier: <strong>${courier}</strong>
        </div>
      </div>

      <div style="text-align:center;">
        <a href="${trackingUrl}" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;display:inline-block;box-shadow:0 4px 14px rgba(255,85,0,0.35);">
          Live Waybill Tracking
        </a>
      </div>
    `;

    return this.send({
      to: payload.customerEmail,
      subject: `Order #${payload.orderNumber} Dispatched &bull; Tracking #${payload.trackingNumber}`,
      html: this.renderShell(content, `Order #${payload.orderNumber} dispatched via ${courier}. Waybill: ${payload.trackingNumber}`),
      tags: [{ name: 'category', value: 'shipping_update' }],
    });
  }

  /**
   * 4. Support Form & Ticket Acknowledgment
   */
  static async sendTicketAcknowledgment(payload: TicketAcknowledgmentPayload) {
    const content = `
      <div style="margin-bottom:24px;">
        <span style="background-color:rgba(255,85,0,0.15);color:#ff5500;border:1px solid rgba(255,85,0,0.4);border-radius:4px;padding:4px 8px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
          Concierge Ticket #${payload.ticketNumber}
        </span>
        <h2 style="color:#ffffff;font-size:22px;font-weight:800;margin:12px 0 6px;">
          Inquiry Received
        </h2>
        <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
          Hello ${payload.customerName}, your communication regarding <strong>${payload.subject}</strong> has landed with our studio concierge.
        </p>
      </div>

      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <div style="color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Your Message Preview</div>
        <div style="color:#d4d4d8;font-size:13px;line-height:1.5;font-style:italic;">
          "${payload.messagePreview}"
        </div>
      </div>

      <p style="color:#a1a1aa;font-size:13px;line-height:1.5;margin-bottom:0;">
        Our team reviews all inquiries within 24 business hours. If you have additional notes or attachments, simply reply directly to this email.
      </p>
    `;

    return this.send({
      to: payload.customerEmail,
      subject: `Concierge Ticket #${payload.ticketNumber}: ${payload.subject}`,
      html: this.renderShell(content, `Inquiry #${payload.ticketNumber} received by Dissafyt Concierge.`),
      tags: [{ name: 'category', value: 'support_ticket' }],
    });
  }

  /**
   * 5. Abandoned Cart Recovery
   */
  static async sendAbandonedCart(payload: AbandonedCartPayload) {
    const itemsList = payload.items
      .map(
        (i) => `
        <li style="padding:6px 0;color:#f4f4f5;font-size:13px;">
          <strong>${i.name}</strong> (x${i.quantity}) &mdash; <span style="color:#ff5500;font-family:monospace;">R${i.price.toFixed(2)}</span>
        </li>`
      )
      .join('');

    const content = `
      <div style="margin-bottom:24px;">
        <span style="background-color:rgba(255,85,0,0.15);color:#ff5500;border:1px solid rgba(255,85,0,0.4);border-radius:4px;padding:4px 8px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
          Cart Reserved
        </span>
        <h2 style="color:#ffffff;font-size:22px;font-weight:800;margin:12px 0 6px;">
          Your Selection Is Waiting
        </h2>
        <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
          ${payload.customerName}, you left pieces in your vault during your recent visit:
        </p>
      </div>

      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <ul style="margin:0;padding-left:16px;list-style-type:circle;">
          ${itemsList}
        </ul>
        <div style="border-top:1px solid #27272a;margin-top:12px;padding-top:12px;color:#a1a1aa;font-size:13px;text-align:right;">
          Cart Value: <strong style="color:#ff5500;font-family:monospace;font-size:15px;">R${payload.cartTotal.toFixed(2)}</strong>
        </div>
      </div>

      <div style="text-align:center;">
        <a href="${payload.checkoutUrl}" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;display:inline-block;box-shadow:0 4px 14px rgba(255,85,0,0.35);">
          Resume Secure Checkout
        </a>
      </div>
    `;

    return this.send({
      to: payload.customerEmail,
      subject: `Complete Your Vault Selection &bull; Dissafyt`,
      html: this.renderShell(content, `Your cart is waiting at Dissafyt. Total: R${payload.cartTotal.toFixed(2)}`),
      tags: [{ name: 'category', value: 'abandoned_cart' }],
    });
  }

  /**
   * 6. Branded Password Reset Dispatch
   */
  static async sendPasswordReset(email: string, resetUrl: string) {
    const content = `
      <div style="margin-bottom:24px;">
        <span style="background-color:rgba(255,85,0,0.15);color:#ff5500;border:1px solid rgba(255,85,0,0.4);border-radius:4px;padding:4px 8px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
          Security Verification
        </span>
        <h2 style="color:#ffffff;font-size:22px;font-weight:800;margin:12px 0 6px;">
          Reset Your Access Key
        </h2>
        <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
          A password reset request was initiated for your Dissafyt sovereign profile (<strong>${email}</strong>).
        </p>
      </div>

      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:center;">
        <a href="${resetUrl}" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;display:inline-block;box-shadow:0 4px 14px rgba(255,85,0,0.35);">
          Reset Password Now
        </a>
        <div style="color:#71717a;font-size:12px;margin-top:12px;">
          This secure link expires in 60 minutes.
        </div>
      </div>

      <p style="color:#71717a;font-size:12px;line-height:1.5;margin-bottom:0;">
        If you did not request this verification, ignore this message. Your credentials remain safe and encrypted.
      </p>
    `;

    return this.send({
      to: email,
      subject: `Reset your Dissafyt password`,
      html: this.renderShell(content, 'Reset your Dissafyt password securely.'),
      tags: [{ name: 'category', value: 'auth_password_reset' }],
    });
  }
}
