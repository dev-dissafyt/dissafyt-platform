import { getSupabaseAdminClient, BarberService, Booking, BookingWithDetails, Staff, BookingStatus, BarbershopLocation } from '@dissafyt/database';
import { AuditService } from '../audit/audit-service';

export const SAST_TIMEZONE = 'Africa/Johannesburg';
export const SAST_OFFSET = '+02:00';
export const SLOT_STEP_MINUTES = 30;

/**
 * Returns the date and time components formatted in SAST (Africa/Johannesburg).
 */
export function getSASTComponents(dateInput: Date | string): {
  weekday: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timeLabel: string;
  dateLabel: string;
} {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const hour = parseInt(partMap.hour || '0', 10);
  const minute = parseInt(partMap.minute || '0', 10);
  const year = parseInt(partMap.year || '0', 10);
  const month = parseInt(partMap.month || '0', 10);
  const day = parseInt(partMap.day || '0', 10);
  const weekday = partMap.weekday || 'Mon';

  return {
    weekday,
    year,
    month,
    day,
    hour,
    minute,
    timeLabel: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    dateLabel: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

/**
 * Rounds duration up to nearest slot step (e.g. 50m -> 60m).
 */
export function getEffectiveDurationMinutes(durationMinutes: number): number {
  return Math.ceil(Math.max(1, durationMinutes) / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
}

export const DEFAULT_LOCATIONS: BarbershopLocation[] = [
  {
    id: 'loc-cpt-flagship',
    name: 'Dissafyt Studio, Cape Town',
    slug: 'dissafyt-studio-cpt',
    address: 'Ace of Fyt Flagship Studio, Cape Town',
    city: 'Cape Town',
    province: 'Western Cape',
    country: 'South Africa',
    phone: '+27 82 123 4567',
    is_flagship: true,
    is_active: true,
    capacity_chairs: 2,
    operating_hours_display: 'Mon-Fri: 09:00 - 18:00 | Sat: 09:00 - 17:00 | Sun: Closed',
  },
];

// Runtime store for real-time location mutations
let RUNTIME_LOCATIONS: BarbershopLocation[] = [...DEFAULT_LOCATIONS];

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
  location_id?: string | null;
  payment_choice?: 'membership_covered' | 'payfast' | 'pay_in_chair';
}

export interface SubscriptionQuota {
  hasActiveSubscription: boolean;
  subscription: any | null;
  planCode: string | null;
  planName: string | null;
  totalCuts: number;
  usedCuts: number;
  availableCuts: number;
  periodStart: string | null;
  periodEnd: string | null;
  canBookCovered: boolean;
}

export class BarbershopService {
  /**
   * Lists all barbershop physical locations / studios from DB or runtime fallback.
   */
  static async listLocations(): Promise<BarbershopLocation[]> {
    const admin = getSupabaseAdminClient();
    try {
      const { data, error } = await admin
        .from('locations')
        .select('*')
        .order('is_flagship', { ascending: false });

      if (!error && data && data.length > 0) {
        // Sync runtime locations
        RUNTIME_LOCATIONS = data;
        return data;
      }
    } catch {
      // Fallback
    }

    return RUNTIME_LOCATIONS;
  }

  /**
   * Registers a new studio location with invisible audit logging.
   */
  static async createLocation(
    input: Omit<BarbershopLocation, 'id'>,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; location?: BarbershopLocation; error?: string }> {
    const admin = getSupabaseAdminClient();
    const id = `loc-${input.slug || Date.now()}`;
    const newLoc: BarbershopLocation = {
      ...input,
      id,
    };

    try {
      await admin.from('locations').insert(newLoc);
    } catch {
      // Fallback
    }

    // Update in-memory runtime store
    RUNTIME_LOCATIONS.push(newLoc);

    // Invisible Audit Trail
    await AuditService.recordLog({
      actor_email: actor?.email || 'admin@dissafyt.com',
      actor_role: actor?.role || 'admin',
      action: 'location.create',
      entity_type: 'location',
      entity_id: id,
      entity_name: newLoc.name,
      changes: newLoc,
    });

    return { success: true, location: newLoc };
  }

  /**
   * Updates an existing studio location with invisible audit logging.
   */
  static async updateLocation(
    id: string,
    input: Partial<BarbershopLocation>,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; location?: BarbershopLocation; error?: string }> {
    const admin = getSupabaseAdminClient();
    const existing = RUNTIME_LOCATIONS.find((l) => l.id === id);

    try {
      await admin.from('locations').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id);
    } catch {
      // Fallback
    }

    // Update runtime store
    const idx = RUNTIME_LOCATIONS.findIndex((l) => l.id === id);
    if (idx !== -1) {
      RUNTIME_LOCATIONS[idx] = { ...RUNTIME_LOCATIONS[idx], ...input };
    }

    const updated = RUNTIME_LOCATIONS.find((l) => l.id === id) || { ...input, id } as BarbershopLocation;

    // Invisible Audit Trail
    await AuditService.recordLog({
      actor_email: actor?.email || 'admin@dissafyt.com',
      actor_role: actor?.role || 'admin',
      action: 'location.update',
      entity_type: 'location',
      entity_id: id,
      entity_name: updated.name,
      changes: {
        before: existing,
        after: updated,
      },
    });

    return { success: true, location: updated };
  }

  /**
   * Deletes a studio location with invisible audit logging.
   */
  static async deleteLocation(
    id: string,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    const existing = RUNTIME_LOCATIONS.find((l) => l.id === id);

    if (existing?.is_flagship) {
      return { success: false, error: 'Cannot delete primary flagship studio location' };
    }

    try {
      await admin.from('locations').delete().eq('id', id);
    } catch {
      // Fallback
    }

    RUNTIME_LOCATIONS = RUNTIME_LOCATIONS.filter((l) => l.id !== id);

    // Invisible Audit Trail
    await AuditService.recordLog({
      actor_email: actor?.email || 'admin@dissafyt.com',
      actor_role: actor?.role || 'admin',
      action: 'location.delete',
      entity_type: 'location',
      entity_id: id,
      entity_name: existing?.name || id,
      changes: existing,
    });

    return { success: true };
  }

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
   * Accounts for shop operating hours, service duration (rounded to slot increments),
   * South Africa Standard Time (SAST, UTC+2), and existing bookings.
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

    // 3. Determine shop operating hours for the given day in SAST
    const midday = new Date(`${params.date}T12:00:00${SAST_OFFSET}`);
    const { weekday } = getSASTComponents(midday);
    const weekdayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][midday.getDay()];

    if (weekday === 'Sun') {
      // Barbershop closed on Sundays
      return { slots: [], service };
    }

    const openHour = 9; // 09:00 SAST
    const closeHour = weekday === 'Sat' ? 17 : 18; // Sat closes at 17:00, Mon-Fri at 18:00
    const effectiveDurationMinutes = getEffectiveDurationMinutes(service.duration_minutes);

    // 4. Fetch existing bookings for the day in SAST (not cancelled)
    const dayStartISO = new Date(`${params.date}T00:00:00${SAST_OFFSET}`).toISOString();
    const dayEndISO = new Date(`${params.date}T23:59:59.999${SAST_OFFSET}`).toISOString();

    const { data: bookings, error: bErr } = await admin
      .from('bookings')
      .select('id, staff_id, start_time, end_time, status')
      .gte('end_time', dayStartISO)
      .lte('start_time', dayEndISO)
      .neq('status', 'cancelled');

    if (bErr) {
      console.error('Error fetching bookings:', bErr);
    }
    const existingBookings = bookings || [];

    // 5. Generate candidate slots and test collisions
    const slots: AvailableSlot[] = [];
    const now = new Date();
    const closingTime = new Date(`${params.date}T${String(closeHour).padStart(2, '0')}:00:00${SAST_OFFSET}`);

    for (let hour = openHour; hour < closeHour; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_STEP_MINUTES) {
        const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        // Construct candidate slot start explicitly in SAST
        const slotStart = new Date(`${params.date}T${timeLabel}:00${SAST_OFFSET}`);
        const slotEnd = new Date(slotStart.getTime() + effectiveDurationMinutes * 60000);

        // Do not allow slots where appointment duration exceeds closing time
        if (slotEnd > closingTime) {
          continue;
        }

        // Do not allow past slots if date is today
        if (slotStart <= now) {
          continue;
        }

        // Find which barbers are free during [slotStart, slotEnd)
        const freeStaff = activeStaff.filter((barber) => {
          // 1. Verify barber's personal working hours on this weekday if configured
          if (barber.working_hours && typeof barber.working_hours === 'object') {
            const shift = (barber.working_hours as any)[weekdayKey];
            if (shift) {
              if (shift.active === false) {
                return false; // Barber is off on this day
              }
              if (shift.start && shift.end) {
                const [sH, sM] = shift.start.split(':').map((n: string) => parseInt(n, 10));
                const [eH, eM] = shift.end.split(':').map((n: string) => parseInt(n, 10));
                const shiftStartDecimal = sH + (sM || 0) / 60;
                const shiftEndDecimal = eH + (eM || 0) / 60;
                const slotStartDecimal = hour + minute / 60;
                const slotEndDecimal = slotStartDecimal + effectiveDurationMinutes / 60;

                if (slotStartDecimal < shiftStartDecimal || slotEndDecimal > shiftEndDecimal) {
                  return false; // Slot falls outside this barber's working shift
                }
              }
            }
          }

          // 2. Check collision against existing non-cancelled bookings
          const hasCollision = existingBookings.some((b) => {
            if (b.staff_id && b.staff_id !== barber.id) {
              return false; // Booking belongs to another barber
            }
            const bStart = new Date(b.start_time);
            const bEnd = new Date(b.end_time);

            // Existing booking's duration is also protected to its 30-min block
            const bDurationMins = Math.round((bEnd.getTime() - bStart.getTime()) / 60000);
            const effectiveBDuration = getEffectiveDurationMinutes(bDurationMins);
            const effectiveBEnd = new Date(bStart.getTime() + effectiveBDuration * 60000);

            // Overlap condition: slotStart < bEnd AND slotEnd > bStart
            return slotStart < effectiveBEnd && slotEnd > bStart;
          });

          return !hasCollision;
        });

        if (freeStaff.length > 0) {
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
   * Evaluates if a given service is covered by the subscriber's membership tier.
   * - 'solo': 1 standard haircut (<= 30 min, excluding combos/beards/executive)
   * - 'twice': 2 standard haircuts (<= 30 min, excluding combos/beards/executive)
   * - 'executive': 2 combo cuts (all grooming services included)
   */
  static isServiceEligibleForPlan(
    planCode: string | null | undefined,
    service: { name?: string; duration_minutes?: number }
  ): boolean {
    if (!service) return false;
    const plan = (planCode || '').toLowerCase();
    if (plan === 'executive') return true;

    // Solo and Regular (twice) only cover standard 30-min haircuts (e.g. Classic Haircut)
    // Excludes combos, beard packages, and executive services
    const serviceName = (service.name || '').toLowerCase();
    const isHigherTier =
      serviceName.includes('combo') ||
      serviceName.includes('beard') ||
      serviceName.includes('executive');

    return (service.duration_minutes || 0) <= 30 && !isHigherTier;
  }

  /**
   * Computes authoritative subscription quota and remaining cut balance for a customer.
   * Decrements available cuts on 'confirmed' bookings.
   * Restores available cuts (+1) when bookings are 'cancelled' or 'no_show'.
   */
  static async getCustomerSubscriptionQuota(userId: string): Promise<SubscriptionQuota> {
    const admin = getSupabaseAdminClient();
    const nowIso = new Date().toISOString();

    const emptyResult: SubscriptionQuota = {
      hasActiveSubscription: false,
      subscription: null,
      planCode: null,
      planName: null,
      totalCuts: 0,
      usedCuts: 0,
      availableCuts: 0,
      periodStart: null,
      periodEnd: null,
      canBookCovered: false,
    };

    if (!userId) return emptyResult;

    try {
      // 1. Query public.subscriptions for active membership
      let activeSub: any = null;
      const { data: subs, error: subErr } = await admin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('current_period_end', nowIso)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!subErr && subs && subs.length > 0) {
        activeSub = subs[0];
      } else {
        // Fallback: Check payments table for recent subscription payment (within 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data: payments } = await admin
          .from('payments')
          .select('*')
          .eq('user_id', userId)
          .eq('related_type', 'subscription')
          .eq('status', 'paid')
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false })
          .limit(1);

        if (payments && payments.length > 0) {
          const p = payments[0];
          activeSub = {
            id: p.id,
            user_id: p.user_id,
            plan_code: 'solo',
            plan_name: 'The Solo Membership',
            price: p.amount,
            status: 'active',
            current_period_start: p.created_at,
            current_period_end: new Date(new Date(p.created_at).getTime() + 30 * 86400000).toISOString(),
          };
        }
      }

      if (!activeSub) return emptyResult;

      const planCode = activeSub.plan_code || 'solo';
      const planName =
        activeSub.plan_name ||
        (planCode === 'twice'
          ? 'The Regular Membership'
          : planCode === 'executive'
          ? 'The Executive'
          : 'The Solo Membership');

      const totalCuts = (planCode === 'twice' || planCode === 'executive') ? 2 : 1;
      const periodStart = activeSub.current_period_start || new Date(Date.now() - 30 * 86400000).toISOString();
      const periodEnd = activeSub.current_period_end || new Date(Date.now() + 30 * 86400000).toISOString();

      // 2. Fetch all bookings for this customer within the active billing cycle
      const { data: bookings, error: bErr } = await admin
        .from('bookings')
        .select('id, status, is_subscription_covered, payment_status, total_amount, start_time')
        .eq('customer_id', userId)
        .gte('start_time', periodStart)
        .lte('start_time', periodEnd);

      if (bErr) {
        console.warn('Error fetching bookings for quota calculation:', bErr.message);
      }

      // 3. Count used quota:
      // Exclude 'cancelled' and 'no_show'.
      // Count if marked as subscription covered, membership covered, or total_amount is 0.
      const memberBookings = (bookings || []).filter((b) => {
        const st = (b.status || '').toLowerCase();
        if (st === 'cancelled' || st === 'no_show') {
          return false;
        }
        const isCovered =
          b.is_subscription_covered === true ||
          b.payment_status === 'membership_covered' ||
          Number(b.total_amount) === 0;

        return isCovered;
      });

      const usedCuts = memberBookings.length;
      const availableCuts = Math.max(0, totalCuts - usedCuts);

      return {
        hasActiveSubscription: true,
        subscription: activeSub,
        planCode,
        planName,
        totalCuts,
        usedCuts,
        availableCuts,
        periodStart,
        periodEnd,
        canBookCovered: availableCuts > 0,
      };
    } catch (err: any) {
      console.error('Failed to compute subscription quota:', err);
      return emptyResult;
    }
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

    const effectiveDurationMinutes = getEffectiveDurationMinutes(service.duration_minutes);
    const endTime = new Date(startTime.getTime() + effectiveDurationMinutes * 60000);

    // Validate shop operating hours in SAST
    const sastStart = getSASTComponents(startTime);
    const sastEnd = getSASTComponents(endTime);

    if (sastStart.weekday === 'Sun') {
      return { success: false, error: 'Ace of Fyt is closed on Sundays.' };
    }

    const openHour = 9;
    const closeHour = sastStart.weekday === 'Sat' ? 17 : 18;
    const startDecimalHour = sastStart.hour + sastStart.minute / 60;
    const endDecimalHour = sastEnd.hour + sastEnd.minute / 60;

    if (startDecimalHour < openHour || endDecimalHour > closeHour || sastStart.dateLabel !== sastEnd.dateLabel) {
      return {
        success: false,
        error: `Appointments must fall within operating hours (09:00 - ${closeHour}:00 SAST).`,
      };
    }

    // 0. Clean up stale pending bookings older than 15 minutes to release slots
    try {
      const staleThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      await admin
        .from('bookings')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('status', 'pending')
        .lt('created_at', staleThreshold);
    } catch {
      // Non-blocking cleanup
    }

    // Anti-collision: verify customer doesn't already have an active appointment during this window
    const { data: customerCollisions } = await admin
      .from('bookings')
      .select('id')
      .eq('customer_id', input.customer_id)
      .neq('status', 'cancelled')
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTime.toISOString());

    if (customerCollisions && customerCollisions.length > 0) {
      return {
        success: false,
        error: 'You already have an appointment booked during this time window. Please select another slot or reschedule your existing booking.',
      };
    }

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

    // 3. Determine if customer has active membership subscription with quota and tier verification
    let isCoveredBySubscription = false;
    let activeSubId: string | null = null;
    let coverageNote: string | null = null;

    try {
      const quota = await BarbershopService.getCustomerSubscriptionQuota(input.customer_id);

      if (quota.hasActiveSubscription && quota.subscription) {
        activeSubId = quota.subscription.id;
        const isEligibleTier = BarbershopService.isServiceEligibleForPlan(quota.planCode, service);

        if (!isEligibleTier) {
          coverageNote = `Service not covered by ${quota.planName} tier; billed at standard rate.`;
        } else if (quota.availableCuts <= 0) {
          coverageNote = `Monthly quota (${quota.totalCuts}/${quota.totalCuts}) exhausted for this billing cycle; billed at standard rate.`;
        } else {
          isCoveredBySubscription = true;
          coverageNote = `Included in ${quota.planName} (${quota.usedCuts + 1}/${quota.totalCuts} cuts used)`;
        }
      }
    } catch (subErr: any) {
      console.warn('Subscription quota verification fallback:', subErr?.message);
    }

    const totalAmount = isCoveredBySubscription ? 0.00 : Number(service.price || 0);
    const paymentStatus: 'membership_covered' | 'unpaid' = isCoveredBySubscription ? 'membership_covered' : 'unpaid';
    
    // Determine booking status and audit note based on payment choice
    let bookingStatus: 'confirmed' | 'pending' = 'confirmed';
    let statusNote = coverageNote;

    if (!isCoveredBySubscription) {
      if (input.payment_choice === 'payfast') {
        bookingStatus = 'pending';
        statusNote = coverageNote
          ? `${coverageNote} [PayFast payment pending]`
          : 'PayFast payment pending';
      } else {
        // 'pay_in_chair' or unspecified
        bookingStatus = 'confirmed';
        statusNote = coverageNote
          ? `${coverageNote} [Pay in chair: R ${totalAmount.toFixed(2)} due on arrival]`
          : `Pay in chair: R ${totalAmount.toFixed(2)} due on arrival`;
      }
    }

    const bookingNote = input.notes
      ? (statusNote ? `${input.notes} (${statusNote})` : input.notes)
      : (statusNote || (isCoveredBySubscription ? 'Included in Member Subscription' : null));

    // 4. Create booking record with audit attributes
    let bookingResult: any = null;
    try {
      const { data: bk, error: bErr } = await admin
        .from('bookings')
        .insert({
          customer_id: input.customer_id,
          service_id: input.service_id,
          staff_id: assignedStaffId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: bookingStatus,
          total_amount: totalAmount,
          payment_status: paymentStatus,
          is_subscription_covered: isCoveredBySubscription,
          subscription_id: activeSubId,
          notes: bookingNote,
        })
        .select()
        .single();

      if (bErr) throw bErr;
      bookingResult = bk;
    } catch (insertErr: any) {
      // Fallback if migration 0007 columns are not yet applied on Supabase PostgREST schema cache
      console.warn('Booking insert with audit columns fallback:', insertErr?.message);
      const { data: fallbackBk, error: fallbackErr } = await admin
        .from('bookings')
        .insert({
          customer_id: input.customer_id,
          service_id: input.service_id,
          staff_id: assignedStaffId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: bookingStatus,
          total_amount: totalAmount,
          notes: bookingNote,
        })
        .select()
        .single();

      if (fallbackErr || !fallbackBk) {
        return { success: false, error: fallbackErr?.message || 'Failed to create booking' };
      }
      bookingResult = fallbackBk;
    }

    return { success: true, booking: bookingResult };
  }

  /**
   * Updates the payment status for an appointment (e.g. paid cash/card at chair).
   */
  static async markBookingPaid(
    bookingId: string,
    paymentStatus: 'paid_in_chair' | 'paid_online' | 'waived',
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      const { error } = await admin
        .from('bookings')
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) {
        console.warn('markBookingPaid update error (may need migration 0007):', error.message);
      }

      await AuditService.recordLog({
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'booking.payment_update',
        entity_type: 'booking',
        entity_id: bookingId,
        changes: { payment_status: paymentStatus },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
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

  /**
   * Reschedules an existing appointment to a new date/time slot.
   * Enforces shop operating hours and anti-collision double-booking checks.
   */
  static async rescheduleBooking(params: {
    bookingId: string;
    customerId?: string;
    newStartTime: string; // ISO string
    newStaffId?: string | null;
    isAdmin?: boolean;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const admin = getSupabaseAdminClient();

    // 1. Fetch the existing booking
    const { data: existing, error: eErr } = await admin
      .from('bookings')
      .select('*, service:services(*)')
      .eq('id', params.bookingId)
      .single();

    if (eErr || !existing) {
      return { success: false, error: 'Appointment not found.' };
    }

    if (existing.status === 'cancelled') {
      return { success: false, error: 'Cancelled appointments cannot be rescheduled. Please make a new booking.' };
    }

    if (!params.isAdmin && params.customerId && existing.customer_id !== params.customerId) {
      return { success: false, error: 'Unauthorized to reschedule this appointment.' };
    }

    const rawDuration = existing.service?.duration_minutes || 30;
    const effectiveDuration = getEffectiveDurationMinutes(rawDuration);
    const startTime = new Date(params.newStartTime);
    if (isNaN(startTime.getTime())) {
      return { success: false, error: 'Invalid reschedule start time format.' };
    }
    const endTime = new Date(startTime.getTime() + effectiveDuration * 60 * 1000);

    // Validate shop operating hours in SAST
    const sastStart = getSASTComponents(startTime);
    const sastEnd = getSASTComponents(endTime);

    if (sastStart.weekday === 'Sun') {
      return { success: false, error: 'Ace of Fyt is closed on Sundays.' };
    }

    const openHour = 9;
    const closeHour = sastStart.weekday === 'Sat' ? 17 : 18;
    const startDecimalHour = sastStart.hour + sastStart.minute / 60;
    const endDecimalHour = sastEnd.hour + sastEnd.minute / 60;

    if (startDecimalHour < openHour || endDecimalHour > closeHour || sastStart.dateLabel !== sastEnd.dateLabel) {
      return {
        success: false,
        error: `Appointments must fall within operating hours (09:00 - ${closeHour}:00 SAST).`,
      };
    }

    // Check collision for customer, excluding current booking
    const customerId = params.customerId || existing.customer_id;
    if (customerId) {
      const { data: customerCollisions } = await admin
        .from('bookings')
        .select('id')
        .eq('customer_id', customerId)
        .neq('id', params.bookingId)
        .neq('status', 'cancelled')
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString());

      if (customerCollisions && customerCollisions.length > 0) {
        return {
          success: false,
          error: 'You already have another appointment booked during this time window. Please select another slot.',
        };
      }
    }

    const targetStaffId = params.newStaffId || existing.staff_id;

    // Check collision for target barber, excluding current booking
    if (targetStaffId) {
      const { data: collisions } = await admin
        .from('bookings')
        .select('id')
        .eq('staff_id', targetStaffId)
        .neq('id', params.bookingId)
        .neq('status', 'cancelled')
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString());

      if (collisions && collisions.length > 0) {
        return {
          success: false,
          error: 'The barber is already booked for this selected time slot. Please choose another time.',
        };
      }
    }

    // Update the booking
    const { data: updated, error: uErr } = await admin
      .from('bookings')
      .update({
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        staff_id: targetStaffId,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.bookingId)
      .select()
      .single();

    if (uErr || !updated) {
      return { success: false, error: uErr?.message || 'Failed to reschedule appointment.' };
    }

    return { success: true, booking: updated as Booking };
  }
}
