import { getSupabaseAdminClient, BarberService, Booking, BookingWithDetails, Staff, BookingStatus, BarbershopLocation } from '@dissafyt/database';
import { AuditService } from '../audit/audit-service';
import { EmailService } from '../notifications/email-service';
import { StaffVaultService } from '../security/staff-vault';

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
    name: 'Dissafyt Studio - Bernie',
    slug: 'dissafyt-studio-cpt',
    address: '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570',
    city: 'Cape Town',
    province: 'Western Cape',
    country: 'South Africa',
    phone: '+27 818082570',
    is_flagship: true,
    is_active: true,
    capacity_chairs: 4,
    operating_hours_display: 'Tue-Sat: 09:00 - 19:00 | Sun: 10:00 - 16:00 | Mon: By Appointment',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=1+Norwalk+Way+Bernadino+Heights+Kraaifontein+7570',
    google_maps_embed_url: 'https://maps.google.com/maps?q=1%20Norwalk%20Way%20Bernadino%20Heights%20Kraaifontein%207570&t=&z=15&ie=UTF8&iwloc=&output=embed',
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
   * Lists all barbershop services and subscription plans.
   */
  static async listServices(): Promise<BarberService[]> {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('services')
      .select('*')
      .order('price', { ascending: true });

    if (error || !data) {
      console.error('Failed to list services:', error);
      return [];
    }
    return data as BarberService[];
  }

  /**
   * Registers a new studio location with invisible audit logging and maps generation.
   */
  static async createLocation(
    input: Omit<BarbershopLocation, 'id'>,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; location?: BarbershopLocation; error?: string }> {
    const admin = getSupabaseAdminClient();
    const id = `loc-${input.slug || Date.now()}`;

    // Auto-generate Google Maps URL and embed URL if omitted
    const queryAddress = `${input.address}, ${input.city || 'Cape Town'}, ${input.province || 'Western Cape'}, South Africa`;
    const google_maps_url = input.google_maps_url?.trim() || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryAddress)}`;
    const google_maps_embed_url = input.google_maps_embed_url?.trim() || `https://maps.google.com/maps?q=${encodeURIComponent(queryAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    const newLoc: BarbershopLocation = {
      ...input,
      id,
      google_maps_url,
      google_maps_embed_url,
    };

    try {
      const { data, error } = await admin
        .from('locations')
        .insert(newLoc)
        .select('*')
        .single();

      if (error) {
        console.error('[BarbershopService.createLocation] DB insert error:', error);
        return { success: false, error: error.message };
      }

      if (data) {
        newLoc.created_at = data.created_at;
        newLoc.updated_at = data.updated_at;
      }
    } catch (err: any) {
      console.error('[BarbershopService.createLocation] Exception during insert:', err);
      return { success: false, error: err?.message || 'Failed to create location' };
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

    // Ensure runtime locations is loaded from DB if not already populated
    if (RUNTIME_LOCATIONS.length <= 1) {
      await BarbershopService.listLocations().catch(() => {});
    }

    const existing = RUNTIME_LOCATIONS.find((l) => l.id === id);

    let dbUpdated: BarbershopLocation | null = null;
    try {
      const { data, error } = await admin
        .from('locations')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('[BarbershopService.updateLocation] Database update failed:', error);
        return { success: false, error: error.message };
      }
      dbUpdated = data as BarbershopLocation;
    } catch (err: any) {
      console.error('[BarbershopService.updateLocation] Exception:', err);
      return { success: false, error: err?.message || 'Database update failed' };
    }

    const updated = dbUpdated || ({ ...existing, ...input, id } as BarbershopLocation);

    // Update runtime store
    const idx = RUNTIME_LOCATIONS.findIndex((l) => l.id === id);
    if (idx !== -1) {
      RUNTIME_LOCATIONS[idx] = updated;
    } else {
      RUNTIME_LOCATIONS.push(updated);
    }

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
   * Retrieves all active barbershop staff, optionally filtered by location, with location metadata attached.
   */
  static async listActiveStaff(locationId?: string): Promise<Staff[]> {
    const admin = getSupabaseAdminClient();
    let query = admin
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('display_name', { ascending: true });

    if (locationId && locationId !== 'all') {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;

    if (error || !data) {
      // Fallback query without location_id filter if column missing
      if (locationId && error?.code === 'PGRST204') {
        const { data: fbData } = await admin
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .order('display_name', { ascending: true });
        if (fbData) {
          const locations = await BarbershopService.listLocations();
          return fbData.map((member: any) =>
            StaffVaultService.sanitizePublicStaff({
              ...member,
              location_id: member.location_id || 'loc-cpt-flagship',
              location: locations.find((l) => l.id === (member.location_id || 'loc-cpt-flagship')) || locations[0],
            })
          ) as Staff[];
        }
      }
      console.error('Error fetching active staff:', error);
      return [];
    }

    const locations = await BarbershopService.listLocations();
    return data.map((member: any) =>
      StaffVaultService.sanitizePublicStaff({
        ...member,
        location_id: member.location_id || 'loc-cpt-flagship',
        location: locations.find((l) => l.id === (member.location_id || 'loc-cpt-flagship')) || locations[0],
      })
    ) as Staff[];
  }

  /**
   * Resolves the required specialist category ('barber' | 'nail_tech' | 'beautician') for a service.
   */
  static resolveServiceSpecialty(service: { specialty?: string | null; name?: string | null }): string {
    if (service.specialty && ['barber', 'nail_tech', 'beautician'].includes(service.specialty)) {
      return service.specialty;
    }
    const lowerName = (service.name || '').toLowerCase();
    if (
      lowerName.includes('nail') ||
      lowerName.includes('manicure') ||
      lowerName.includes('pedicure') ||
      lowerName.includes('acrylic') ||
      lowerName.includes('gel')
    ) {
      return 'nail_tech';
    }
    if (
      lowerName.includes('facial') ||
      lowerName.includes('wax') ||
      lowerName.includes('lash') ||
      lowerName.includes('brow') ||
      lowerName.includes('makeup') ||
      lowerName.includes('massage') ||
      lowerName.includes('beauty')
    ) {
      return 'beautician';
    }
    return 'barber';
  }

  /**
   * Verifies if an individual specialist is scheduled to work on a given SAST date/time slot
   * and has not marked the date as a blocked day off.
   */
  static isSpecialistWorkingAtSlot(
    staff: any,
    dateLabel: string,
    weekday: string,
    weekdayKey: string,
    slotStartDecimal: number,
    slotEndDecimal: number
  ): boolean {
    // 1. Check blocked dates (sick days / time off)
    if (Array.isArray(staff.blocked_dates) && staff.blocked_dates.includes(dateLabel)) {
      return false;
    }

    // 2. Check working_days array (e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
    if (Array.isArray(staff.working_days) && staff.working_days.length > 0) {
      if (!staff.working_days.includes(weekday)) {
        return false;
      }
    }

    // 3. Check custom shift start / end hours
    const startHr = typeof staff.work_start_hour === 'number' ? staff.work_start_hour : 9;
    const endHr =
      typeof staff.work_end_hour === 'number'
        ? staff.work_end_hour
        : weekday === 'Sat'
        ? 17
        : 18;

    if (slotStartDecimal < startHr || slotEndDecimal > endHr) {
      return false;
    }

    // 4. Preserve legacy working_hours JSON object support if populated
    if (staff.working_hours && typeof staff.working_hours === 'object') {
      const shift = (staff.working_hours as any)[weekdayKey];
      if (shift) {
        if (shift.active === false) {
          return false;
        }
        if (shift.start && shift.end) {
          const [sH, sM] = shift.start.split(':').map((n: string) => parseInt(n, 10));
          const [eH, eM] = shift.end.split(':').map((n: string) => parseInt(n, 10));
          const shiftStartDecimal = sH + (sM || 0) / 60;
          const shiftEndDecimal = eH + (eM || 0) / 60;
          if (slotStartDecimal < shiftStartDecimal || slotEndDecimal > shiftEndDecimal) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Calculates real-time available time slots for a specific date and service.
   * Accounts for shop operating hours, service duration (rounded to slot increments),
   * cross-specialty matching (Barber vs Nail Tech vs Beautician), individual specialist schedules,
   * South Africa Standard Time (SAST, UTC+2), and existing bookings.
   */
  static async getAvailableSlots(params: {
    date: string; // "YYYY-MM-DD"
    serviceId: string;
    staffId?: string | null;
    locationId?: string | null;
  }): Promise<{ slots: AvailableSlot[]; service?: BarberService; error?: string }> {
    const admin = getSupabaseAdminClient();

    // 1. Fetch the service to know its duration and specialty
    const { data: service, error: sErr } = await admin
      .from('services')
      .select('*')
      .eq('id', params.serviceId)
      .eq('is_active', true)
      .single();

    if (sErr || !service) {
      return { slots: [], error: 'Selected service was not found or is inactive.' };
    }

    const requiredSpecialty = BarbershopService.resolveServiceSpecialty(service);

    // 2. Fetch active staff
    let staffQuery = admin.from('staff').select('*').eq('is_active', true);
    if (params.staffId && params.staffId !== 'any') {
      staffQuery = staffQuery.eq('id', params.staffId);
    }
    if (params.locationId && params.locationId !== 'all') {
      staffQuery = staffQuery.eq('location_id', params.locationId);
    }
    let { data: activeStaff, error: stErr } = await staffQuery;

    // Fallback if location_id column does not exist yet in Postgres schema cache
    if ((stErr || !activeStaff || activeStaff.length === 0) && params.locationId) {
      let fbQuery = admin.from('staff').select('*').eq('is_active', true);
      if (params.staffId && params.staffId !== 'any') {
        fbQuery = fbQuery.eq('id', params.staffId);
      }
      const { data: fbStaff } = await fbQuery;
      if (fbStaff && fbStaff.length > 0) {
        activeStaff = fbStaff;
        stErr = null;
      }
    }

    // Filter staff to only those matching the service's specialty
    const matchingStaff = (activeStaff || []).filter(
      (s: any) => (s.specialty || 'barber') === requiredSpecialty
    );

    if (stErr || matchingStaff.length === 0) {
      return {
        slots: [],
        service,
        error: 'No active specialists in this category are available for this request.',
      };
    }

    // 3. Determine shop operating hours for the given day in SAST
    const midday = new Date(`${params.date}T12:00:00${SAST_OFFSET}`);
    const { weekday, dateLabel } = getSASTComponents(midday);
    const weekdayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][midday.getDay()];

    if (weekday === 'Sun') {
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

        const slotStartDecimal = hour + minute / 60;
        const slotEndDecimal = slotStartDecimal + effectiveDurationMinutes / 60;

        // Find which matching specialists are free during [slotStart, slotEnd)
        const freeStaff = matchingStaff.filter((barber) => {
          // 1. Verify specialist's working days, shift hours, and blocked off-dates
          if (
            !BarbershopService.isSpecialistWorkingAtSlot(
              barber,
              dateLabel,
              weekday,
              weekdayKey,
              slotStartDecimal,
              slotEndDecimal
            )
          ) {
            return false;
          }

          // 2. Check collision against existing non-cancelled bookings
          const hasCollision = existingBookings.some((b) => {
            if (b.staff_id && b.staff_id !== barber.id) {
              return false; // Booking belongs to another specialist
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
   * Only Barber services are eligible for haircut memberships (excludes Nail Tech & Beautician services).
   * - 'solo': 1 standard haircut (<= 30 min, excluding combos/beards/executive)
   * - 'twice': 2 standard haircuts (<= 30 min, excluding combos/beards/executive)
   * - 'executive': 2 combo cuts (all barber grooming services included)
   */
  static isServiceEligibleForPlan(
    planCode: string | null | undefined,
    service: { name?: string; duration_minutes?: number; specialty?: string | null }
  ): boolean {
    if (!service) return false;
    if (BarbershopService.resolveServiceSpecialty(service) !== 'barber') {
      return false;
    }

    const plan = (planCode || '').toLowerCase();
    if (plan === 'executive' || plan === 'founder_pass_12cuts') return true;

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
      // 0. Check public.founder_passes for active 12-cut entitlement
      const { data: founderPasses } = await admin
        .from('founder_passes')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', nowIso)
        .order('created_at', { ascending: false })
        .limit(1);

      if (founderPasses && founderPasses.length > 0) {
        const fp = founderPasses[0];
        const totalCuts = fp.total_cuts || 12;
        const usedCuts = fp.cuts_used || 0;
        const availableCuts = Math.max(0, totalCuts - usedCuts);

        return {
          hasActiveSubscription: true,
          subscription: {
            id: fp.id,
            user_id: fp.user_id,
            plan_code: 'founder_pass_12cuts',
            plan_name: "Founder's Circle Pass (12 Master Cuts)",
            price: Number(fp.amount_paid || 1200),
            status: fp.status,
            current_period_start: fp.created_at,
            current_period_end: fp.expires_at,
          },
          planCode: 'founder_pass_12cuts',
          planName: "Founder's Circle Pass (12 Master Cuts)",
          totalCuts,
          usedCuts,
          availableCuts,
          periodStart: fp.created_at,
          periodEnd: fp.expires_at,
          canBookCovered: availableCuts > 0,
        };
      }

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
   * Authoritatively creates an appointment with concurrency, cross-specialty matching,
   * specialist shift/day-off validation, and anti-hoarding/no-show checks.
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

    const requiredSpecialty = BarbershopService.resolveServiceSpecialty(service);

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
    const weekdayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][startTime.getDay()];

    if (sastStart.weekday === 'Sun') {
      return { success: false, error: 'Studio is closed on Sundays.' };
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

    // 2. Resolve and assign specialist (enforcing specialty match & specialist working schedule)
    let assignedStaffId = input.staff_id || null;

    // Fetch active staff
    const { data: activeStaff } = await admin.from('staff').select('*').eq('is_active', true);
    if (!activeStaff || activeStaff.length === 0) {
      return { success: false, error: 'No active specialists available to take appointments.' };
    }

    if (assignedStaffId && assignedStaffId !== 'any') {
      const barber = activeStaff.find((s) => s.id === assignedStaffId);
      if (!barber) {
        return { success: false, error: 'Requested specialist is not active or does not exist.' };
      }

      const staffSpecialty = barber.specialty || 'barber';
      if (staffSpecialty !== requiredSpecialty) {
        return {
          success: false,
          error: `Selected specialist does not perform this service category. Please select an available specialist for ${service.name}.`,
        };
      }

      if (
        !BarbershopService.isSpecialistWorkingAtSlot(
          barber,
          sastStart.dateLabel,
          sastStart.weekday,
          weekdayKey,
          startDecimalHour,
          endDecimalHour
        )
      ) {
        return {
          success: false,
          error: `${barber.display_name} is off-duty or unavailable during this time slot. Please choose another time or specialist.`,
        };
      }

      // Check collision for this specialist
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
          error: 'This specialist is already booked for the selected time slot. Please choose another slot.',
        };
      }
    } else {
      // "Any specialist" selected: find first free specialist matching the service's specialty & schedule
      let freeBarber: Staff | null = null;
      const matchingSpecialists = activeStaff.filter(
        (s: any) =>
          (s.specialty || 'barber') === requiredSpecialty &&
          BarbershopService.isSpecialistWorkingAtSlot(
            s,
            sastStart.dateLabel,
            sastStart.weekday,
            weekdayKey,
            startDecimalHour,
            endDecimalHour
          )
      );

      for (const barber of matchingSpecialists) {
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
        return {
          success: false,
          error: 'All specialists for this service are booked or off-duty for this slot. Please select another time.',
        };
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

    // 3b. Anti-Hoarding & No-Show Protection when customer selects "Pay in Chair"
    if (!isCoveredBySubscription && input.payment_choice !== 'payfast') {
      // Rule 1: High-duration services (60+ mins, e.g. Nail sets, Beauty treatments, Executive packages) require online payment
      if (effectiveDurationMinutes >= 60) {
        return {
          success: false,
          error: 'Appointments of 60 minutes or longer require upfront online payment via PayFast to secure your specialist slot.',
        };
      }

      // Rule 2: Customers with any past no_show must pay online via PayFast
      const { data: pastNoShows } = await admin
        .from('bookings')
        .select('id')
        .eq('customer_id', input.customer_id)
        .eq('status', 'no_show')
        .limit(1);

      if (pastNoShows && pastNoShows.length > 0) {
        return {
          success: false,
          error: 'Pay in Chair is unavailable due to a previous No-Show on your account. Please select PayFast online payment to book.',
        };
      }

      // Rule 3: Cap active unpaid "Pay in Chair" bookings to max 2 per customer to prevent slot hoarding
      const { data: activeUnpaid } = await admin
        .from('bookings')
        .select('id')
        .eq('customer_id', input.customer_id)
        .in('status', ['confirmed', 'pending'])
        .eq('payment_status', 'unpaid')
        .gte('start_time', new Date().toISOString());

      if (activeUnpaid && activeUnpaid.length >= 2) {
        return {
          success: false,
          error: 'You already have 2 active unpaid appointments scheduled. Please use PayFast online payment or complete your existing bookings first.',
        };
      }
    }

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

    const resolvedLocationId = input.location_id || 'loc-cpt-flagship';

    // 4. Create booking record with audit attributes and location
    let bookingResult: any = null;
    try {
      const { data: bk, error: bErr } = await admin
        .from('bookings')
        .insert({
          customer_id: input.customer_id,
          service_id: input.service_id,
          staff_id: assignedStaffId,
          location_id: resolvedLocationId,
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
      // Fallback if migration 0007 / 0011 columns are not yet applied on Supabase PostgREST schema cache
      console.warn('Booking insert with audit/location columns fallback:', insertErr?.message);
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
      bookingResult = {
        ...fallbackBk,
        location_id: resolvedLocationId,
      };
    }

    if (!bookingResult.location_id) {
      bookingResult.location_id = resolvedLocationId;
    }

    // If booking was covered by Founder Pass, decrement cut balance
    if (isCoveredBySubscription && activeSubId) {
      try {
        const { data: fpCheck } = await admin
          .from('founder_passes')
          .select('id')
          .eq('id', activeSubId)
          .maybeSingle();

        if (fpCheck) {
          const { FounderPassService } = await import('./founder-pass-service');
          await FounderPassService.redeemCut({
            passId: activeSubId,
            bookingId: bookingResult.id,
            serviceName: service.name || 'Master Haircut',
            notes: `Redeemed via online booking #${bookingResult.id}`,
          });
        }
      } catch (fpErr) {
        console.warn('Founder pass cut decrement hook warning:', fpErr);
      }
    }

    // 4. Dispatch Studio Booking Confirmation email
    try {
      const { data: customerProfile } = await admin
        .from('profiles')
        .select('email, full_name')
        .eq('id', input.customer_id)
        .maybeSingle();

      const { data: serviceItem } = await admin
        .from('services')
        .select('name')
        .eq('id', input.service_id)
        .maybeSingle();

      let staffName = 'Bernie';
      if (assignedStaffId) {
        const { data: staffMember } = await admin
          .from('staff')
          .select('display_name')
          .eq('id', assignedStaffId)
          .maybeSingle();
        if (staffMember?.display_name) {
          staffName = staffMember.display_name;
        }
      }

      let locName = 'Dissafyt Studio - Bernie';
      let locAddress = '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570';
      let locMapsUrl = 'https://www.google.com/maps/search/?api=1&query=1+Norwalk+Way+Bernadino+Heights+Kraaifontein+7570';

      try {
        const locations = await BarbershopService.listLocations();
        const matchedLoc = locations.find((l) => l.id === resolvedLocationId) || locations[0];
        if (matchedLoc) {
          locName = matchedLoc.name;
          locAddress = `${matchedLoc.address}, ${matchedLoc.city || ''}`;
          locMapsUrl = matchedLoc.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locAddress)}`;
        }
      } catch {
        // Fallback to default studio address
      }

      if (customerProfile?.email) {
        await EmailService.sendBookingConfirmation({
          bookingId: bookingResult.id,
          customerName: customerProfile.full_name || 'Client',
          customerEmail: customerProfile.email,
          serviceName: serviceItem?.name || 'Studio Haircut',
          staffName,
          startTime: bookingResult.start_time,
          locationName: locName,
          locationAddress: locAddress,
          googleMapsUrl: locMapsUrl,
          directionsUrl: locMapsUrl,
          totalAmount: Number(bookingResult.total_amount || 0),
          paymentStatus: bookingResult.payment_status || 'pending',
          bookingUrl: `https://dissafyt.com/account/bookings?id=${bookingResult.id}`,
        });
      }
    } catch (mailErr) {
      console.warn('[BarbershopService] Warning: Failed to send booking confirmation email:', mailErr);
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

    const locations = await BarbershopService.listLocations();
    return data.map((b: any) => {
      const locId = b.location_id || b.staff?.location_id || 'loc-cpt-flagship';
      const loc = locations.find((l) => l.id === locId) || locations[0] || null;
      return {
        ...b,
        location_id: locId,
        location: loc,
      };
    }) as BookingWithDetails[];
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
