import { AppointmentBookingAggregate } from './appointment-booking.aggregate';

export interface WhatsAppReminderMessage {
  to: string; // phone in E.164 format, e.g. "+27818082570"
  body: string;
}

export interface EmailReminderPayload {
  to: string;
  subject: string;
  html: string;
  icsAttachment: string;
}

export class BarbershopReminderService {
  /**
   * Builds an instant WhatsApp appointment confirmation message formatted for South Africa.
   */
  static buildWhatsAppConfirmation(booking: AppointmentBookingAggregate): WhatsAppReminderMessage {
    const customerPhone = booking.customer.phone || '';
    const dateFormatted = booking.startTime.toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Johannesburg',
    });
    const timeFormatted = booking.startTime.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Africa/Johannesburg',
    });

    const googleCalUrl = booking.generateGoogleCalendarUrl();

    const body = [
      `*ACE OF FYT BARBERSHOP // BOOKING CONFIRMED* ✂️`,
      ``,
      `Hi *${booking.customer.getDisplayName()}*, your chair reservation is locked in:`,
      ``,
      `💈 *Service:* ${booking.service.name}`,
      `👤 *Barber:* ${booking.barber?.displayName || 'Master Barber'}`,
      `📅 *Date:* ${dateFormatted}`,
      `⏰ *Time:* ${timeFormatted} (SAST)`,
      `📍 *Location:* ${booking.location?.name || 'Dissafyt Studio, Cape Town'}`,
      `🗺️ *Address:* ${booking.location?.address || 'Ace of Fyt Flagship Studio, Cape Town'}`,
      `💰 *Amount:* R${booking.totalAmount.toFixed(2)} (${booking.paymentStatus.replace(/_/g, ' ')})`,
      ``,
      `📅 *Add to Google Calendar:* ${googleCalUrl}`,
      ``,
      `Need to reschedule? Reply directly to this WhatsApp or manage your booking at https://dissafyt.com/account`,
    ].join('\n');

    return {
      to: customerPhone,
      body,
    };
  }

  /**
   * Builds an automated 2-hour appointment reminder for WhatsApp.
   */
  static buildWhatsApp2HourReminder(booking: AppointmentBookingAggregate): WhatsAppReminderMessage {
    const timeFormatted = booking.startTime.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Africa/Johannesburg',
    });

    return {
      to: booking.customer.phone || '',
      body: [
        `*REMINDER: Chair Reservation in 2 Hours* 💈`,
        ``,
        `Hi *${booking.customer.getDisplayName()}*, your appointment with *${booking.barber?.displayName || 'Ace of Fyt'}* is at *${timeFormatted}* today.`,
        `📍 ${booking.location?.address || 'Ace of Fyt Flagship Studio, Cape Town'}`,
        ``,
        `See you soon in the lounge!`,
      ].join('\n'),
    };
  }

  /**
   * Builds an email confirmation with direct .ics calendar attachment.
   */
  static buildEmailConfirmation(booking: AppointmentBookingAggregate): EmailReminderPayload {
    const dateFormatted = booking.startTime.toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Johannesburg',
    });
    const timeFormatted = booking.startTime.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Africa/Johannesburg',
    });

    const googleCalUrl = booking.generateGoogleCalendarUrl();

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 24px; max-width: 600px; margin: auto; border-radius: 12px; border: 1px solid #27272a;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #27272a;">
          <h2 style="color: #f59e0b; margin: 0; font-size: 24px; text-transform: uppercase;">Ace of Fyt Barbershop</h2>
          <p style="color: #a1a1aa; font-size: 12px; margin-top: 4px; font-family: monospace;">CAPE TOWN FLAGSHIP // CHAIR CONFIRMED</p>
        </div>

        <div style="padding: 24px 0;">
          <p style="font-size: 15px;">Hi <strong>${booking.customer.getDisplayName()}</strong>,</p>
          <p style="font-size: 14px; color: #d4d4d8;">Your master grooming reservation has been successfully confirmed:</p>
          
          <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 6px 0; font-size: 14px;"><strong>Service:</strong> ${booking.service.name}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Master Barber:</strong> ${booking.barber?.displayName || 'Lead Barber'}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Date & Time:</strong> ${dateFormatted} at ${timeFormatted} (SAST)</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Location:</strong> ${booking.location?.name || 'Dissafyt Studio, Cape Town'}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Address:</strong> ${booking.location?.address || 'Ace of Fyt Flagship Studio, Cape Town'}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Total Amount:</strong> R${booking.totalAmount.toFixed(2)}</p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${googleCalUrl}" style="background-color: #f59e0b; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 13px; display: inline-block; text-transform: uppercase;">
              Add to Google Calendar
            </a>
          </div>
        </div>

        <div style="border-top: 1px solid #27272a; padding-top: 16px; text-align: center; font-size: 11px; color: #71717a;">
          <p>© 2026 Dissafyt Platform • Western Cape, South Africa</p>
        </div>
      </div>
    `;

    return {
      to: booking.customer.email,
      subject: `Booking Confirmed: ${booking.service.name} at Ace of Fyt (${dateFormatted})`,
      html,
      icsAttachment: booking.generateICalendarContent(),
    };
  }
}
