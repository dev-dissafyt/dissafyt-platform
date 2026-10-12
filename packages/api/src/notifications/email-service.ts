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

export interface BatchUnlockedPaymentPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  target: number;
  totalAmount: number;
  paymentUrl: string;
}

export interface AbandonedCartPayload {
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  cartTotal: number;
  checkoutUrl: string;
}

export interface PreorderDepositReceiptPayload {
  orderNumber: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  items: OrderEmailItem[];
  depositPaid: number;
  balanceDue: number;
  total: number;
  fulfillmentChoice: 'courier' | 'studio_collection';
  shippingAddress?: {
    recipient_name?: string;
    street_address?: string;
    suburb?: string;
    city?: string;
    postal_code?: string;
  };
  trackingUrl?: string;
}

export interface PreorderBalanceSettledPayload {
  orderNumber: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  items: OrderEmailItem[];
  depositPaid: number;
  balanceSettled: number;
  totalPaid: number;
  paymentMethod: string;
  fulfillmentChoice: 'courier' | 'studio_collection';
  collectionLocation?: string;
  trackingUrl?: string;
}

export interface PreorderDropMilestonePayload {
  recipientEmail: string;
  recipientName: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  currentClaimed: number;
  targetUnits: number;
  backerOrderNumber: string;
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

  /**
   * 7. Pre-Order Milestone Deposit Receipt
   * Dispatched when customer pays the upfront production deposit (e.g. 50%) for drop apparel.
   */
  static async sendPreorderDepositReceipt(payload: PreorderDepositReceiptPayload) {
    const itemsRows = payload.items
      .map(
        (item) => `
        <tr style="border-bottom:1px solid #27272a;">
          <td style="padding:12px 0;vertical-align:top;">
            <div style="font-weight:700;color:#ffffff;font-size:14px;">${item.name}</div>
            ${item.variant ? `<div style="color:#a1a1aa;font-size:12px;margin-top:2px;">Size / Fit: ${item.variant}</div>` : ''}
            <div style="color:#ff5500;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:4px;">
              &bull; Pre-Order Batch Production
            </div>
          </td>
          <td align="center" style="padding:12px 8px;vertical-align:top;color:#d4d4d8;font-size:13px;font-family:monospace;">
            &times;${item.quantity}
          </td>
          <td align="right" style="padding:12px 0;vertical-align:top;font-weight:700;color:#f4f4f5;font-size:14px;font-family:monospace;">
            R${item.total.toFixed(2)}
          </td>
        </tr>
      `
      )
      .join('');

    const fulfillmentDetailsHtml =
      payload.fulfillmentChoice === 'studio_collection'
        ? `
        <div style="background-color:#1c1917;border:1px solid #292524;border-radius:8px;padding:16px;margin-top:20px;">
          <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;color:#ff5500;text-transform:uppercase;margin-bottom:6px;">
            💈 Fulfillment: Free Studio Collection
          </div>
          <div style="color:#f4f4f5;font-weight:700;font-size:13px;">
            Dissafyt Studio &bull; Cape Town Flagship
          </div>
          <div style="color:#a1a1aa;font-size:12px;margin-top:2px;">
            1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570
          </div>
          <div style="color:#71717a;font-size:11px;margin-top:8px;border-top:1px solid #27272a;padding-top:8px;">
            Your remaining balance of <strong style="color:#ffffff;">R${payload.balanceDue.toFixed(2)}</strong> will be settled upon garment collection at the Studio POS register (card or cash).
          </div>
        </div>
      `
        : `
        <div style="background-color:#1c1917;border:1px solid #292524;border-radius:8px;padding:16px;margin-top:20px;">
          <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;color:#ff5500;text-transform:uppercase;margin-bottom:6px;">
            🚚 Fulfillment: Nationwide Courier Delivery
          </div>
          <div style="color:#f4f4f5;font-weight:700;font-size:13px;">
            ${payload.shippingAddress?.recipient_name || payload.customerName}
          </div>
          <div style="color:#a1a1aa;font-size:12px;margin-top:2px;">
            ${payload.shippingAddress?.street_address || ''}, ${payload.shippingAddress?.suburb || ''}, ${payload.shippingAddress?.city || ''} ${payload.shippingAddress?.postal_code || ''}
          </div>
          <div style="color:#71717a;font-size:11px;margin-top:8px;border-top:1px solid #27272a;padding-top:8px;">
            Your remaining balance of <strong style="color:#ffffff;">R${payload.balanceDue.toFixed(2)}</strong> will be settled online prior to courier dispatch.
          </div>
        </div>
      `;

    const trackingUrl = payload.trackingUrl || `https://dissafyt.com/account/orders?order=${payload.orderNumber}`;

    const content = `
      <div style="margin-bottom:24px;">
        <span style="background-color:rgba(255,85,0,0.15);color:#ff5500;border:1px solid rgba(255,85,0,0.4);border-radius:4px;padding:4px 8px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
          Pre-Order Deposit Confirmed
        </span>
        <h2 style="color:#ffffff;font-size:24px;font-weight:800;margin:12px 0 6px;">
          Drop Garment Queued For Production
        </h2>
        <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
          ${payload.customerName}, your milestone deposit for pre-order drop <strong style="color:#ffffff;">#${payload.orderNumber}</strong> has been secured. Your blanks are being sourced and added to the DTF printing queue.
        </p>
      </div>

      <!-- Garments Table -->
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
        <thead>
          <tr style="border-bottom:1px solid #3f3f46;">
            <th align="left" style="padding-bottom:8px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Garment</th>
            <th align="center" style="padding-bottom:8px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Qty</th>
            <th align="right" style="padding-bottom:8px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Full Value</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Milestone Financial Breakdown Card -->
      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:8px;padding:18px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:#a1a1aa;text-transform:uppercase;margin-bottom:12px;">
          Milestone Financial Summary
        </div>
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;line-height:1.8;">
          <tr>
            <td style="color:#a1a1aa;">Total Garment Value</td>
            <td align="right" style="color:#ffffff;font-family:monospace;font-weight:700;">R${payload.total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color:#22c55e;font-weight:700;">Production Deposit Paid Today</td>
            <td align="right" style="color:#22c55e;font-family:monospace;font-weight:800;font-size:14px;">- R${payload.depositPaid.toFixed(2)}</td>
          </tr>
          <tr style="border-top:1px solid #27272a;">
            <td style="padding-top:8px;color:#ff5500;font-weight:800;">Outstanding Balance Due Upon Handover</td>
            <td align="right" style="padding-top:8px;color:#ff5500;font-family:monospace;font-weight:800;font-size:16px;">R${payload.balanceDue.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Fulfillment Card -->
      ${fulfillmentDetailsHtml}

      <!-- CTA -->
      <div style="text-align:center;margin-top:28px;">
        <a href="${trackingUrl}" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;display:inline-block;box-shadow:0 4px 14px rgba(255,85,0,0.35);">
          Track Production Progress
        </a>
      </div>
    `;

    return this.send({
      to: payload.customerEmail,
      subject: `Pre-Order Confirmed #${payload.orderNumber} - Production Deposit Received`,
      html: this.renderShell(content, `Pre-order #${payload.orderNumber} deposit received. Production begun.`),
      tags: [{ name: 'category', value: 'preorder_deposit_receipt' }],
    });
  }

  /**
   * 8. Pre-Order Balance Settled Receipt
   * Dispatched when the customer settles the remaining balance at the studio POS or prior to dispatch.
   */
  static async sendPreorderBalanceSettledReceipt(payload: PreorderBalanceSettledPayload) {
    const itemsRows = payload.items
      .map(
        (item) => `
        <tr style="border-bottom:1px solid #27272a;">
          <td style="padding:10px 0;vertical-align:top;">
            <div style="font-weight:700;color:#ffffff;font-size:14px;">${item.name}</div>
            ${item.variant ? `<div style="color:#a1a1aa;font-size:12px;margin-top:2px;">Size / Fit: ${item.variant}</div>` : ''}
          </td>
          <td align="center" style="padding:10px 8px;vertical-align:top;color:#d4d4d8;font-size:13px;font-family:monospace;">
            &times;${item.quantity}
          </td>
          <td align="right" style="padding:10px 0;vertical-align:top;font-weight:700;color:#f4f4f5;font-size:14px;font-family:monospace;">
            R${item.total.toFixed(2)}
          </td>
        </tr>
      `
      )
      .join('');

    const trackingUrl = payload.trackingUrl || `https://dissafyt.com/account/orders?order=${payload.orderNumber}`;

    const content = `
      <div style="margin-bottom:24px;">
        <span style="background-color:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.4);border-radius:4px;padding:4px 8px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
          Balance Settled &bull; Handover Complete
        </span>
        <h2 style="color:#ffffff;font-size:24px;font-weight:800;margin:12px 0 6px;">
          Order #${payload.orderNumber} Fully Cleared
        </h2>
        <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
          ${payload.customerName}, your remaining balance has been received. Your pre-order is 100% settled and completed.
        </p>
      </div>

      <!-- Garments Table -->
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
        <thead>
          <tr style="border-bottom:1px solid #3f3f46;">
            <th align="left" style="padding-bottom:8px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Garment</th>
            <th align="center" style="padding-bottom:8px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Qty</th>
            <th align="right" style="padding-bottom:8px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Settlement Breakdown Card -->
      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:8px;padding:18px;margin-bottom:20px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:#a1a1aa;text-transform:uppercase;margin-bottom:12px;">
          Final Payment Ledger
        </div>
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;line-height:1.8;">
          <tr>
            <td style="color:#a1a1aa;">Initial Deposit Paid</td>
            <td align="right" style="color:#ffffff;font-family:monospace;">R${payload.depositPaid.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color:#a1a1aa;">Balance Settled (${payload.paymentMethod})</td>
            <td align="right" style="color:#22c55e;font-family:monospace;font-weight:700;">R${payload.balanceSettled.toFixed(2)}</td>
          </tr>
          <tr style="border-top:1px solid #27272a;">
            <td style="padding-top:8px;color:#ffffff;font-weight:700;">Total Paid to Date</td>
            <td align="right" style="padding-top:8px;color:#22c55e;font-family:monospace;font-weight:800;font-size:15px;">R${payload.totalPaid.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color:#a1a1aa;font-size:12px;">Remaining Balance</td>
            <td align="right" style="color:#22c55e;font-family:monospace;font-weight:700;font-size:13px;">R0.00 (Fully Settled)</td>
          </tr>
        </table>
      </div>

      <div style="background-color:#0c0a09;border:1px solid #1f1f23;border-radius:8px;padding:16px;text-align:center;">
        <div style="color:#d4d4d8;font-size:13px;font-weight:600;">
          Thank you for backing Dissafyt Streetwear culture.
        </div>
        <div style="color:#71717a;font-size:11px;margin-top:4px;">
          Wear your pieces with pride. If you need any size adjustments or support, reply to this email anytime.
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-top:24px;">
        <a href="${trackingUrl}" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;display:inline-block;">
          View Order History
        </a>
      </div>
    `;

    return this.send({
      to: payload.customerEmail,
      subject: `Order #${payload.orderNumber} Fully Settled - Handover Receipt`,
      html: this.renderShell(content, `Order #${payload.orderNumber} is fully settled. Thank you for shopping with Dissafyt.`),
      tags: [{ name: 'category', value: 'preorder_balance_settled' }],
    });
  }

  /**
   * 9. Pre-Order Drop Milestone Notification
   * Dispatched to all existing drop backers each time a new order is placed into the drop.
   * Notifies existing customers how close the drop is to reaching full batch production.
   */
  static async sendPreorderDropMilestoneNotification(payload: PreorderDropMilestonePayload) {
    const target = Math.max(1, payload.targetUnits);
    const claimed = payload.currentClaimed;
    const pct = Math.min(100, Math.round((claimed / target) * 100));
    const remaining = Math.max(0, target - claimed);
    const dropUrl = `https://dissafyt.com/shop/${payload.productSlug}`;
    const isCompleted = remaining === 0;

    const content = `
      <!-- Top Alert Pill -->
      <div style="text-align:center;margin-bottom:20px;">
        <span style="background-color:rgba(255,85,0,0.15);color:#ff5500;border:1px solid rgba(255,85,0,0.3);font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:9999px;display:inline-block;">
          Cape Town Garment Lab &bull; Live Drop Feed
        </span>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#ffffff;font-size:22px;font-weight:900;text-transform:uppercase;margin:0 0 8px 0;letter-spacing:0.5px;">
          ${isCompleted ? 'Drop 100% Unlocked! All Blanks Claimed' : 'Another Blank Claimed in Your Drop!'}
        </h2>
        <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
          ${payload.recipientName}, hype is rising in the garment lab! A new order was just placed into the <strong style="color:#ffffff;">${payload.productName}</strong> drop.
        </p>
      </div>

      <!-- Live Drop Progress Meter Card -->
      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:10px;padding:24px;margin-bottom:24px;box-shadow:0 8px 24px rgba(0,0,0,0.4);">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:12px;">
          <tr>
            <td align="left">
              <span style="font-size:11px;font-weight:800;letter-spacing:1px;color:#a1a1aa;text-transform:uppercase;">
                Batch Progress
              </span>
            </td>
            <td align="right">
              <span style="color:#ff5500;font-family:monospace;font-weight:900;font-size:14px;">
                ${pct}% UNLOCKED
              </span>
            </td>
          </tr>
        </table>

        <!-- Metric Numbers -->
        <div style="text-align:center;padding:12px 0 16px 0;">
          <div style="font-size:36px;font-weight:900;color:#ffffff;font-family:monospace;letter-spacing:1px;line-height:1;">
            ${claimed} <span style="font-size:20px;color:#71717a;">/ ${target}</span>
          </div>
          <div style="font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;margin-top:6px;font-weight:600;">
            Garments Claimed to Date
          </div>
        </div>

        <!-- Progress Bar (Table-based for universal email client compatibility) -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#27272a;border-radius:6px;overflow:hidden;height:12px;margin-bottom:14px;">
          <tr>
            <td width="${pct}%" style="background-color:#ff5500;height:12px;border-radius:6px;"></td>
            <td width="${100 - pct}%" style="background-color:#27272a;height:12px;"></td>
          </tr>
        </table>

        <!-- Countdown / Status Text -->
        <div style="text-align:center;font-size:13px;color:#d4d4d8;">
          ${
            isCompleted
              ? `<span style="color:#22c55e;font-weight:700;">&#10004; Target Goal Achieved! Batch manufacturing is entering production.</span>`
              : `Only <strong style="color:#ff5500;font-family:monospace;font-size:15px;">${remaining}</strong> ${remaining === 1 ? 'blank remains' : 'blanks remain'} before this batch locks.`
          }
        </div>
      </div>

      <!-- Your Reservation Callout -->
      <div style="background-color:#0c0a09;border:1px solid #1f1f23;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:12px;">
          <tr>
            <td style="color:#71717a;">Your Pre-Order Reference:</td>
            <td align="right" style="color:#ffffff;font-family:monospace;font-weight:700;">#${payload.backerOrderNumber}</td>
          </tr>
          <tr>
            <td style="color:#71717a;padding-top:4px;">Reservation Status:</td>
            <td align="right" style="color:#22c55e;font-weight:700;padding-top:4px;">Secured & Queued</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="${dropUrl}" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;display:inline-block;box-shadow:0 4px 14px rgba(255,85,0,0.35);">
          View Live Drop Room
        </a>
      </div>
    `;

    return this.send({
      to: payload.recipientEmail,
      subject: isCompleted
        ? `Drop 100% Complete! ${payload.productName} Factory Production Unlocked`
        : `Drop Update &bull; Another blank claimed in ${payload.productName} (${claimed}/${target})`,
      html: this.renderShell(content, `Drop update for ${payload.productName}: ${claimed}/${target} claimed (${pct}% complete).`),
      tags: [{ name: 'category', value: 'preorder_drop_milestone' }],
    });
  }

  /**
   * Dispatched when a pre-order drop batch fills, giving backers the direct link
   * to settle their reserved order (full payment or 50% deposit) via PayFast.
   */
  static async sendBatchUnlockedPaymentNotice(payload: BatchUnlockedPaymentPayload) {
    const content = `
      <div style="text-align:center;padding:10px 0 20px 0;">
        <span style="display:inline-block;padding:6px 16px;border-radius:999px;background-color:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#22c55e;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">
          &#10004; BATCH GOAL REACHED &bull; FACTORY UNLOCKED
        </span>
        <h2 style="font-size:24px;font-weight:900;color:#ffffff;margin:16px 0 8px 0;letter-spacing:-0.5px;">
          Your Pre-Order is Ready for Production!
        </h2>
        <p style="font-size:14px;color:#a1a1aa;margin:0 auto;max-width:440px;line-height:1.5;">
          Hey ${payload.customerName || 'there'}, incredible news! The drop for <strong style="color:#ffffff;">${payload.productName}</strong> has officially reached its goal of <strong style="color:#ff5500;">${payload.target} orders</strong>.
        </p>
      </div>

      <!-- Order Summary Card -->
      <div style="background-color:#18181b;border:1px solid #27272a;border-radius:10px;padding:20px;margin-bottom:24px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;">
          <tr>
            <td style="color:#71717a;padding-bottom:8px;">Order Reference:</td>
            <td align="right" style="color:#ffffff;font-family:monospace;font-weight:700;padding-bottom:8px;">#${payload.orderNumber}</td>
          </tr>
          <tr>
            <td style="color:#71717a;padding-bottom:8px;">Garment:</td>
            <td align="right" style="color:#ffffff;font-weight:600;padding-bottom:8px;">${payload.productName}</td>
          </tr>
          <tr>
            <td style="color:#71717a;padding-top:8px;border-top:1px solid #27272a;">Total Garment Value:</td>
            <td align="right" style="color:#ff5500;font-family:monospace;font-weight:900;font-size:16px;padding-top:8px;border-top:1px solid #27272a;">R ${Number(payload.totalAmount).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Payment Callout & Flexibility -->
      <div style="background-color:#0c0a09;border:1px solid #1f1f23;border-radius:8px;padding:16px 20px;margin-bottom:24px;font-size:12px;color:#d4d4d8;line-height:1.6;">
        <p style="margin:0 0 8px 0;">
          <strong style="color:#ffffff;">Flexible Settlement Options:</strong> You can pay the <strong>100% full balance</strong> upfront, or pay a <strong>50% production deposit</strong> (R ${(payload.totalAmount * 0.5).toFixed(2)}) with the rest payable on handover.
        </p>
        <p style="margin:0;color:#71717a;">
          Production begins immediately once batches are settled. To ensure priority queue placement for your garment, please complete your checkout using the link below.
        </p>
      </div>

      <!-- Action Button -->
      <div style="text-align:center;padding:10px 0 20px 0;">
        <a href="${payload.paymentUrl}" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:16px 36px;border-radius:8px;font-weight:900;font-size:14px;letter-spacing:1px;text-transform:uppercase;display:inline-block;box-shadow:0 6px 20px rgba(255,85,0,0.4);">
          Settle Order with PayFast &rarr;
        </a>
      </div>
    `;

    return this.send({
      to: payload.customerEmail,
      subject: `[ACTION REQUIRED] Batch Goal Unlocked! Complete your ${payload.productName} Order #${payload.orderNumber}`,
      html: this.renderShell(content, `Batch 01 for ${payload.productName} is ready! Settle your order #${payload.orderNumber} with PayFast.`),
      tags: [{ name: 'category', value: 'batch_unlocked_payment' }],
    });
  }
}
