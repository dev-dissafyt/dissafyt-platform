import { getSupabaseAdminClient, BarberService, Booking, BookingWithDetails, Staff, BookingStatus } from '@dissafyt/database';

export interface AvailableSlot {
  time: string; // e.g. "09:00"
  startTime: string; // ISO 8601 string
  endTime: string; // ISO 8601 string
  availableStaff: { id: string; display_name: string }[];
}

export interface CreateBookingInput {
  customer_id: string;
  service_id: string;
  staff_id?: string | null;
  start_time: string; // ISO string
  notes?: string;
}

export class BarbershopService {
  /**
   * Retrieves all active barbershop staff.
   */
  static async listActiveStaff(): Promise<Staff[]> {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('display_name', { ascending: true });

    if (error || !data) {
      console.error('Error fetching active staff:', error);
      return [];
    }
    return data as Staff[];
  }

  /**
   * Calculates real-time available time slots for a specific date and service.
   * Accounts for shop operating hours, service duration, and existing bookings.
   */
  static async getAvailableSlots(params: {
    date: string; // "YYYY-MM-DD"
    serviceId: string;
    staffId?: string | null;
  }): Promise<{ slots: AvailableSlot[]; service?: BarberService; error?: string }> {
    const admin = getSupabaseAdminClient();

    // 1. Fetch the service to know its duration
    const { data: service, error: sErr } = await admin
      .from('services')
      .select('*')
      .eq('id', params.serviceId)
      .eq('is_active', true)
      .single();

    if (sErr || !service) {
      return { slots: [], error: 'Selected service was not found or is inactive.' };
    }

    // 2. Fetch active staff
    let staffQuery = admin.from('staff').select('*').eq('is_active', true);
    if (params.staffId && params.staffId !== 'any') {
      staffQuery = staffQuery.eq('id', params.staffId);
    }
    const { data: activeStaff, error: stErr } = await staffQuery;

    if (stErr || !activeStaff || activeStaff.length === 0) {
      return { slots: [], service, error: 'No active barbers available for this request.' };
    }

    // 3. Determine shop operating hours for the given day
    const [year, month, day] = params.date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

    if (dayOfWeek === 0) {
      // Barbershop closed on Sundays
      return { slots: [], service };
    }

    const openHour = 9; // 09:00
    const closeHour = dayOfWeek === 6 ? 17 : 18; // Saturday closes at 17:00, Mon-Fri at 18:00
    const slotStepMinutes = 30; // 30-minute schedule increments

    // 4. Fetch existing bookings for the day (not cancelled)
    const dayStartISO = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)).toISOString();
    const dayEndISO = new Date(Date.UTC(year, month - 1, day, 23, 59, 59)).toISOString();

    const { data: bookings, error: bErr } = await admin
      .from('bookings')
      .select('id, staff_id, start_time, end_time, status')
      .gte('start_time', dayStartISO)
      .lte('start_time', dayEndISO)
      .neq('status', 'cancelled');

    if (bErr) {
      console.error('Error fetching bookings:', bErr);
    }
    const existingBookings = bookings || [];

    // 5. Generate candidate slots and test collisions
    const slots: AvailableSlot[] = [];
    const now = new Date();

    for (let hour = openHour; hour < closeHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotStepMinutes) {
        // Build start & end timestamp in UTC
        const slotStart = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
        const slotEnd = new Date(slotStart.getTime() + service.duration_minutes * 60000);

        // Do not allow slots that exceed closing time
        const closingTime = new Date(Date.UTC(year, month - 1, day, closeHour, 0, 0));
        if (slotEnd > closingTime) {
          continue;
        }

        // Do not allow past slots if date is today
        if (slotStart <= now) {
          continue;
        }

        // Find which barbers are free during [slotStart, slotEnd)
        const freeStaff = activeStaff.filter((barber) => {
          // Check collision with existing bookings for this barber
          const hasCollision = existingBookings.some((b) => {
            if (b.staff_id && b.staff_id !== barber.id) {
              return false; // Booking belongs to another barber
            }
            const bStart = new Date(b.start_time);
            const bEnd = new Date(b.end_time);

            // Overlap condition: start < bEnd AND end > bStart
            return slotStart < bEnd && slotEnd > bStart;
          });

          return !hasCollision;
        });

        if (freeStaff.length > 0) {
          const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          slots.push({
            time: timeLabel,
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            availableStaff: freeStaff.map((s) => ({ id: s.id, display_name: s.display_name })),
          });
        }
      }
    }

    return { slots, service };
  }

  /**
   * Authoritatively creates an appointment with concurrency and anti-collision checks.
   */
  static async createBooking(input: CreateBookingInput): Promise<{
    success: boolean;
    booking?: Booking;
    error?: string;
  }> {
    const admin = getSupabaseAdminClient();

    if (!input.customer_id || !input.service_id || !input.start_time) {
      return { success: false, error: 'Customer ID, Service ID, and Start Time are required.' };
    }

    // 1. Fetch and validate service
    const { data: service, error: sErr } = await admin
      .from('services')
      .select('*')
      .eq('id', input.service_id)
      .eq('is_active', true)
      .single();

    if (sErr || !service) {
      return { success: false, error: 'Service not found or is currently inactive.' };
    }

    const startTime = new Date(input.start_time);
    if (isNaN(startTime.getTime())) {
      return { success: false, error: 'Invalid start time format.' };
    }

    if (startTime <= new Date()) {
      return { success: false, error: 'Appointments cannot be booked in the past.' };
    }

    const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000);

    // 2. Resolve and assign barber
    let assignedStaffId = input.staff_id || null;

    // Fetch active staff
    const { data: activeStaff } = await admin.from('staff').select('*').eq('is_active', true);
    if (!activeStaff || activeStaff.length === 0) {
      return { success: false, error: 'No active barbers available to take appointments.' };
    }

    if (assignedStaffId && assignedStaffId !== 'any') {
      const barber = activeStaff.find((s) => s.id === assignedStaffId);
      if (!barber) {
        return { success: false, error: 'Requested barber is not active or does not exist.' };
      }

      // Check collision for this barber
      const { data: collisions } = await admin
        .from('bookings')
        .select('id')
        .eq('staff_id', assignedStaffId)
        .neq('status', 'cancelled')
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString());

      if (collisions && collisions.length > 0) {
        return {
          success: false,
          error: 'This barber is already booked for the selected time slot. Please choose another slot.',
        };
      }
    } else {
      // "Any barber" selected: find first free barber
      let freeBarber: Staff | null = null;

      for (const barber of activeStaff) {
        const { data: collisions } = await admin
          .from('bookings')
          .select('id')
          .eq('staff_id', barber.id)
          .neq('status', 'cancelled')
          .lt('start_time', endTime.toISOString())
          .gt('end_time', startTime.toISOString());

        if (!collisions || collisions.length === 0) {
          freeBarber = barber;
          break;
        }
      }

      if (!freeBarber) {
        return { success: false, error: 'All barbers are booked for this slot. Please select another time.' };
      }
      assignedStaffId = freeBarber.id;
    }

    // 3. Create booking record
    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .insert({
        customer_id: input.customer_id,
        service_id: input.service_id,
        staff_id: assignedStaffId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'confirmed',
        total_amount: service.price,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (bErr || !booking) {
      console.error('Error inserting booking:', bErr);
      return { success: false, error: bErr?.message || 'Failed to create booking' };
    }

    return { success: true, booking };
  }

  /**
   * Retrieves all bookings for a customer with service and staff details.
   */
  static async getCustomerBookings(customerId: string): Promise<BookingWithDetails[]> {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('bookings')
      .select(`
        *,
        service:services(*),
        staff:staff(*)
      `)
      .eq('customer_id', customerId)
      .order('start_time', { ascending: false });

    if (error || !data) {
      console.error('Error fetching customer bookings:', error);
      return [];
    }

    return data as BookingWithDetails[];
  }

  /**
   * Cancels a booking, verifying ownership or admin authorization.
   */
  static async cancelBooking(
    bookingId: string,
    customerId: string,
    isAdmin = false
  ): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();

    let query = admin.from('bookings').update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    }).eq('id', bookingId);

    if (!isAdmin) {
      query = query.eq('customer_id', customerId);
    }

    const { error } = await query;
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }
}
