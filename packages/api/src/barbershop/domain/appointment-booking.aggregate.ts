import { Booking, BookingStatus, BookingPaymentStatus } from '@dissafyt/database';
import { CustomerAccountEntity } from './customer-account.entity';
import { BarberEntity } from './barber.entity';
import { GroomingServiceEntity } from './grooming-service.entity';
import { BarbershopLocationEntity } from './barbershop-location.entity';

export class AppointmentBookingAggregate {
  constructor(
    public readonly id: string,
    public customer: CustomerAccountEntity,
    public service: GroomingServiceEntity,
    public barber: BarberEntity | null,
    public location: BarbershopLocationEntity | null,
    public startTime: Date,
    public endTime: Date,
    public status: BookingStatus,
    public totalAmount: number,
    public paymentStatus: BookingPaymentStatus,
    public isSubscriptionCovered: boolean = false,
    public notes: string | null = null,
    public createdAt: Date = new Date()
  ) {}

  confirm(): void {
    if (this.status === 'cancelled') {
      throw new Error('Cannot confirm a cancelled appointment.');
    }
    this.status = 'confirmed';
  }

  complete(): void {
    if (this.status === 'cancelled') {
      throw new Error('Cannot complete a cancelled appointment.');
    }
    this.status = 'completed';
  }

  cancel(reason?: string): void {
    this.status = 'cancelled';
    if (reason) {
      this.notes = this.notes ? `${this.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`;
    }
  }

  markNoShow(): void {
    this.status = 'no_show';
  }

  markPaidOnline(paymentId?: string): void {
    this.paymentStatus = 'paid_online';
    if (this.status === 'pending') {
      this.status = 'confirmed';
    }
  }

  markPaidInChair(): void {
    this.paymentStatus = 'paid_in_chair';
    if (this.status === 'pending') {
      this.status = 'confirmed';
    }
  }

  markMembershipCovered(): void {
    this.isSubscriptionCovered = true;
    this.paymentStatus = 'membership_covered';
    this.totalAmount = 0;
    this.status = 'confirmed';
  }

  /**
   * Generates formatted Google Calendar URL for one-click add.
   */
  generateGoogleCalendarUrl(): string {
    const title = encodeURIComponent(`Ace of Fyt Barber: ${this.service.name}`);
    const details = encodeURIComponent(
      `Appointment with ${this.barber?.displayName || 'Master Barber'}.\nService: ${this.service.name} (R${this.totalAmount.toFixed(2)})\nLocation: ${this.location?.name || 'Dissafyt Studio Cape Town'}\nNotes: ${this.notes || 'None'}`
    );
    const loc = encodeURIComponent(this.location?.getFullAddress() || 'Dissafyt Studio, Cape Town, South Africa');

    // ISO format: YYYYMMDDTHHmmssZ
    const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const dates = `${formatTime(this.startTime)}/${formatTime(this.endTime)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${loc}`;
  }

  /**
   * Generates RFC 5545 iCalendar (.ics) content for email attachments or Apple/Outlook calendar import.
   */
  generateICalendarContent(): string {
    const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const uid = `booking-${this.id}@dissafyt.com`;
    const now = formatTime(new Date());

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Dissafyt Platform//Ace of Fyt Barbershop//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatTime(this.startTime)}`,
      `DTEND:${formatTime(this.endTime)}`,
      `SUMMARY:Ace of Fyt: ${this.service.name}`,
      `DESCRIPTION:Barber: ${this.barber?.displayName || 'Master Barber'}\\nService: ${this.service.name}\\nLocation: ${this.location?.name || 'Cape Town Flagship'}`,
      `LOCATION:${this.location?.getFullAddress() || 'Dissafyt Studio, Cape Town'}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Haircut appointment in 2 hours at Ace of Fyt',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  toDTO(): Booking {
    return {
      id: this.id,
      customer_id: this.customer.id,
      service_id: this.service.id,
      staff_id: this.barber ? this.barber.id : null,
      location_id: this.location ? this.location.id : null,
      start_time: this.startTime.toISOString(),
      end_time: this.endTime.toISOString(),
      status: this.status,
      total_amount: this.totalAmount,
      payment_status: this.paymentStatus,
      is_subscription_covered: this.isSubscriptionCovered,
      notes: this.notes,
      created_at: this.createdAt.toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}
