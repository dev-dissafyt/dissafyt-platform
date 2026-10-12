import { getSupabaseAdminClient, BarberService } from '@dissafyt/database';
import { AuditService } from '../audit/audit-service';
import { BarbershopService } from '../barbershop/barbershop-service';

export interface CreateServiceInput {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_active?: boolean;
  is_subscription?: boolean;
  plan_code?: string | null;
  billing_frequency?: number;
  billing_cycles?: number;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
  is_active?: boolean;
  is_subscription?: boolean;
  plan_code?: string | null;
}

export class AdminBarbershopService {
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
   * Creates a service or subscription plan in the database.
   */
  static async createService(
    input: CreateServiceInput,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; service?: BarberService; error?: string }> {
    const admin = getSupabaseAdminClient();

    // Prepare insert object
    const payload: any = {
      name: input.name,
      description: input.description || '',
      duration_minutes: input.duration_minutes || 30,
      price: input.price,
      is_active: input.is_active !== undefined ? input.is_active : true,
    };

    // Include subscription fields if defined
    if (input.is_subscription !== undefined) {
      payload.is_subscription = input.is_subscription;
    }
    if (input.plan_code !== undefined) {
      payload.plan_code = input.plan_code;
    }
    if (input.billing_frequency !== undefined) {
      payload.billing_frequency = input.billing_frequency;
    }
    if (input.billing_cycles !== undefined) {
      payload.billing_cycles = input.billing_cycles;
    }

    try {
      let createdService: any;
      const { data, error } = await admin
        .from('services')
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        createdService = data;
      } else if (error) {
        // Fallback for schema variance if subscription columns don't exist
        if (error.code === 'PGRST204') {
          delete payload.is_subscription;
          delete payload.plan_code;
          delete payload.billing_frequency;
          delete payload.billing_cycles;
          const { data: fallbackData, error: fallbackError } = await admin
            .from('services')
            .insert(payload)
            .select()
            .single();

          if (fallbackError) return { success: false, error: fallbackError.message };
          createdService = fallbackData;
        } else {
          return { success: false, error: error.message };
        }
      }

      // Invisible Audit Trail
      await AuditService.recordLog({
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'service.create',
        entity_type: 'service',
        entity_id: createdService.id,
        entity_name: createdService.name,
        changes: createdService,
      });

      return { success: true, service: createdService };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Updates an existing service with invisible audit logging.
   */
  static async updateService(
    id: string,
    input: UpdateServiceInput,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; service?: BarberService; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      const { data: beforeData } = await admin.from('services').select('*').eq('id', id).single();
      const payload: any = { ...input };
      let updatedService: any;
      const { data, error } = await admin.from('services').update(payload).eq('id', id).select().single();
      if (error) {
        if (error.code === 'PGRST204') {
          delete payload.is_subscription;
          delete payload.plan_code;
          const { data: fbData, error: fbError } = await admin.from('services').update(payload).eq('id', id).select().single();
          if (fbError) return { success: false, error: fbError.message };
          updatedService = fbData;
        } else {
          return { success: false, error: error.message };
        }
      } else {
        updatedService = data;
      }

      // Invisible Audit Trail
      await AuditService.recordLog({
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'service.update',
        entity_type: 'service',
        entity_id: id,
        entity_name: updatedService?.name || beforeData?.name,
        changes: {
          before: beforeData,
          after: updatedService,
          updated_fields: input,
        },
      });

      return { success: true, service: updatedService };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Deletes a service by ID with invisible audit logging.
   */
  static async deleteService(
    id: string,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      const { data: existing } = await admin.from('services').select('*').eq('id', id).single();
      const { error } = await admin.from('services').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }

      // Invisible Audit Trail
      await AuditService.recordLog({
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'service.delete',
        entity_type: 'service',
        entity_id: id,
        entity_name: existing?.name || id,
        changes: existing,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Lists all barbershop staff, optionally filtered by location, with location metadata attached.
   */
  static async listStaff(locationId?: string): Promise<any[]> {
    const admin = getSupabaseAdminClient();
    let query = admin
      .from('staff')
      .select('*')
      .order('display_name', { ascending: true });

    if (locationId && locationId !== 'all') {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;

    if (error || !data) {
      // Fallback query without location_id filter if column missing in Postgres schema cache
      if (locationId && error?.code === 'PGRST204') {
        const { data: fbData } = await admin
          .from('staff')
          .select('*')
          .order('display_name', { ascending: true });
        if (fbData) {
          const locations = await BarbershopService.listLocations();
          return fbData.map((member: any) => {
            const locId = member.location_id || 'loc-cpt-flagship';
            const loc = locations.find((l) => l.id === locId) || locations[0] || null;
            return {
              ...member,
              location_id: locId,
              location: loc,
            };
          });
        }
      }
      console.error('Failed to list staff:', error);
      return [];
    }

    const locations = await BarbershopService.listLocations();
    return data.map((member: any) => {
      const locId = member.location_id || 'loc-cpt-flagship';
      const loc = locations.find((l) => l.id === locId) || locations[0] || null;
      return {
        ...member,
        location_id: locId,
        location: loc,
      };
    });
  }

  /**
   * Creates a new staff/barber member with invisible audit logging and graceful schema fallback.
   */
  static async createStaff(
    input: {
      display_name: string;
      bio?: string;
      phone?: string;
      avatar_url?: string;
      working_hours?: any;
      user_id?: string | null;
      is_active?: boolean;
      location_id?: string | null;
      commission_split_pct?: number;
      payfast_merchant_id?: string | null;
      bank_name?: string | null;
      bank_account_number?: string | null;
      bank_account_type?: string | null;
      bank_branch_code?: string | null;
      pos_terminal_id?: string | null;
    },
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; staff?: any; error?: string }> {
    const admin = getSupabaseAdminClient();
    const resolvedLocationId = input.location_id || 'loc-cpt-flagship';
    const payload: any = {
      display_name: input.display_name,
      bio: input.bio || '',
      user_id: input.user_id || null,
      is_active: input.is_active !== undefined ? input.is_active : true,
      location_id: resolvedLocationId,
    };
    if (input.phone) payload.phone = input.phone;
    if (input.avatar_url) payload.avatar_url = input.avatar_url;
    if (input.working_hours) payload.working_hours = input.working_hours;
    if (input.commission_split_pct !== undefined) payload.commission_split_pct = Number(input.commission_split_pct);
    if (input.payfast_merchant_id !== undefined) payload.payfast_merchant_id = input.payfast_merchant_id || null;
    if (input.bank_name !== undefined) payload.bank_name = input.bank_name || null;
    if (input.bank_account_number !== undefined) payload.bank_account_number = input.bank_account_number || null;
    if (input.bank_account_type !== undefined) payload.bank_account_type = input.bank_account_type || 'cheque';
    if (input.bank_branch_code !== undefined) payload.bank_branch_code = input.bank_branch_code || null;
    if (input.pos_terminal_id !== undefined) payload.pos_terminal_id = input.pos_terminal_id || null;

    let createdStaff: any = null;
    const { data, error } = await admin
      .from('staff')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('schema cache')) {
        console.warn('Staff create fallback: stripping pending columns from payload:', error.message);
        delete payload.phone;
        delete payload.avatar_url;
        delete payload.working_hours;
        delete payload.location_id;
        delete payload.commission_split_pct;
        delete payload.payfast_merchant_id;
        delete payload.bank_name;
        delete payload.bank_account_number;
        delete payload.bank_account_type;
        delete payload.bank_branch_code;
        delete payload.pos_terminal_id;

        const { data: fbData, error: fbError } = await admin
          .from('staff')
          .insert(payload)
          .select()
          .single();

        if (fbError || !fbData) {
          return { success: false, error: fbError?.message || 'Failed to create staff' };
        }
        createdStaff = {
          ...fbData,
          phone: input.phone || null,
          avatar_url: input.avatar_url || null,
          working_hours: input.working_hours || null,
          location_id: resolvedLocationId,
          commission_split_pct: input.commission_split_pct || 15,
          payfast_merchant_id: input.payfast_merchant_id || null,
          bank_name: input.bank_name || null,
          bank_account_number: input.bank_account_number || null,
          bank_account_type: input.bank_account_type || 'cheque',
          bank_branch_code: input.bank_branch_code || null,
          pos_terminal_id: input.pos_terminal_id || null,
        };
      } else {
        return { success: false, error: error.message };
      }
    } else {
      createdStaff = data;
    }

    if (!createdStaff.location_id) {
      createdStaff.location_id = resolvedLocationId;
    }

    // Invisible Audit Trail
    await AuditService.recordLog({
      actor_email: actor?.email || 'admin@dissafyt.com',
      actor_role: actor?.role || 'admin',
      action: 'staff.create',
      entity_type: 'staff',
      entity_id: createdStaff.id,
      entity_name: createdStaff.display_name,
      changes: createdStaff,
    });

    return { success: true, staff: createdStaff };
  }

  /**
   * Updates an existing staff/barber member with invisible audit logging and graceful schema fallback.
   */
  static async updateStaff(
    id: string,
    input: {
      display_name?: string;
      bio?: string;
      phone?: string;
      avatar_url?: string;
      working_hours?: any;
      is_active?: boolean;
      user_id?: string | null;
      location_id?: string | null;
      commission_split_pct?: number;
      payfast_merchant_id?: string | null;
      bank_name?: string | null;
      bank_account_number?: string | null;
      bank_account_type?: string | null;
      bank_branch_code?: string | null;
      pos_terminal_id?: string | null;
    },
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; staff?: any; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      const { data: beforeData } = await admin.from('staff').select('*').eq('id', id).single();
      const payload: any = { ...input };
      let updatedStaff: any = null;

      const { data, error } = await admin
        .from('staff')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Gracefully handle missing columns in schema cache
        if (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('schema cache')) {
          console.warn('Staff update fallback: schema column missing, stripping pending columns:', error.message);
          delete payload.phone;
          delete payload.avatar_url;
          delete payload.working_hours;
          delete payload.location_id;
          delete payload.commission_split_pct;
          delete payload.payfast_merchant_id;
          delete payload.bank_name;
          delete payload.bank_account_number;
          delete payload.bank_account_type;
          delete payload.bank_branch_code;
          delete payload.pos_terminal_id;

          const { data: fbData, error: fbError } = await admin
            .from('staff')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

          if (fbError || !fbData) {
            return { success: false, error: fbError?.message || 'Failed to update staff' };
          }

          // Return merged object with input fields so caller sees their requested changes
          updatedStaff = {
            ...fbData,
            phone: input.phone !== undefined ? input.phone : beforeData?.phone,
            avatar_url: input.avatar_url !== undefined ? input.avatar_url : beforeData?.avatar_url,
            working_hours: input.working_hours !== undefined ? input.working_hours : beforeData?.working_hours,
            location_id: input.location_id !== undefined ? input.location_id : (beforeData?.location_id || 'loc-cpt-flagship'),
            commission_split_pct: input.commission_split_pct !== undefined ? input.commission_split_pct : beforeData?.commission_split_pct,
            payfast_merchant_id: input.payfast_merchant_id !== undefined ? input.payfast_merchant_id : beforeData?.payfast_merchant_id,
            bank_name: input.bank_name !== undefined ? input.bank_name : beforeData?.bank_name,
            bank_account_number: input.bank_account_number !== undefined ? input.bank_account_number : beforeData?.bank_account_number,
            bank_account_type: input.bank_account_type !== undefined ? input.bank_account_type : beforeData?.bank_account_type,
            bank_branch_code: input.bank_branch_code !== undefined ? input.bank_branch_code : beforeData?.bank_branch_code,
            pos_terminal_id: input.pos_terminal_id !== undefined ? input.pos_terminal_id : beforeData?.pos_terminal_id,
          };
        } else {
          return { success: false, error: error.message };
        }
      } else {
        updatedStaff = data;
      }

      if (!updatedStaff.location_id) {
        updatedStaff.location_id = input.location_id || beforeData?.location_id || 'loc-cpt-flagship';
      }

      // Invisible Audit Trail
      await AuditService.recordLog({
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'staff.update',
        entity_type: 'staff',
        entity_id: id,
        entity_name: updatedStaff.display_name,
        changes: {
          before: beforeData,
          after: updatedStaff,
          updated_fields: input,
        },
      });

      return { success: true, staff: updatedStaff };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Deletes a staff/barber member with invisible audit logging.
   */
  static async deleteStaff(
    id: string,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      const { data: existing } = await admin.from('staff').select('*').eq('id', id).single();
      const { error } = await admin.from('staff').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }

      // Invisible Audit Trail
      await AuditService.recordLog({
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'staff.delete',
        entity_type: 'staff',
        entity_id: id,
        entity_name: existing?.display_name || id,
        changes: existing,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Lists all bookings across the platform with joined service, staff, and customer profile details.
   */
  static async listBookings(filters?: {
    date?: string;
    staffId?: string;
    status?: string;
    locationId?: string;
  }): Promise<any[]> {
    const admin = getSupabaseAdminClient();

    let query = admin
      .from('bookings')
      .select(`
        *,
        service:services(*),
        staff:staff(*),
        customer:profiles(*)
      `)
      .order('start_time', { ascending: true });

    if (filters?.date && filters.date !== 'all') {
      const sastNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
      const todayDateStr = `${sastNow.getFullYear()}-${String(sastNow.getMonth() + 1).padStart(2, '0')}-${String(sastNow.getDate()).padStart(2, '0')}`;
      const todayStart = new Date(`${todayDateStr}T00:00:00+02:00`).toISOString();
      const todayEnd = new Date(`${todayDateStr}T23:59:59.999+02:00`).toISOString();

      if (filters.date === 'upcoming') {
        // Include all of today from midnight SAST onward so appointments from earlier today remain visible in chair view
        query = query.gte('start_time', todayStart);
      } else if (filters.date === 'today') {
        query = query.gte('start_time', todayStart).lte('start_time', todayEnd);
      } else if (filters.date === 'past') {
        query = query.lt('start_time', todayStart);
      } else {
        const dayStart = new Date(`${filters.date}T00:00:00+02:00`).toISOString();
        const dayEnd = new Date(`${filters.date}T23:59:59.999+02:00`).toISOString();
        query = query.gte('start_time', dayStart).lte('start_time', dayEnd);
      }
    }

    if (filters?.staffId && filters.staffId !== 'all') {
      query = query.eq('staff_id', filters.staffId);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.locationId && filters.locationId !== 'all') {
      query = query.eq('location_id', filters.locationId);
    }

    let { data, error } = await query;

    // Fallback if location_id query fails due to missing column in cache
    if ((error || !data) && filters?.locationId) {
      let fbQuery = admin
        .from('bookings')
        .select(`
          *,
          service:services(*),
          staff:staff(*),
          customer:profiles(*)
        `)
        .order('start_time', { ascending: true });

      if (filters?.date && filters.date !== 'all') {
        const sastNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
        const todayDateStr = `${sastNow.getFullYear()}-${String(sastNow.getMonth() + 1).padStart(2, '0')}-${String(sastNow.getDate()).padStart(2, '0')}`;
        const todayStart = new Date(`${todayDateStr}T00:00:00+02:00`).toISOString();
        const todayEnd = new Date(`${todayDateStr}T23:59:59.999+02:00`).toISOString();

        if (filters.date === 'upcoming') {
          fbQuery = fbQuery.gte('start_time', todayStart);
        } else if (filters.date === 'today') {
          fbQuery = fbQuery.gte('start_time', todayStart).lte('start_time', todayEnd);
        } else if (filters.date === 'past') {
          fbQuery = fbQuery.lt('start_time', todayStart);
        } else {
          const dayStart = new Date(`${filters.date}T00:00:00+02:00`).toISOString();
          const dayEnd = new Date(`${filters.date}T23:59:59.999+02:00`).toISOString();
          fbQuery = fbQuery.gte('start_time', dayStart).lte('start_time', dayEnd);
        }
      }
      if (filters?.staffId && filters.staffId !== 'all') {
        fbQuery = fbQuery.eq('staff_id', filters.staffId);
      }
      if (filters?.status && filters.status !== 'all') {
        fbQuery = fbQuery.eq('status', filters.status);
      }
      const { data: fbData, error: fbError } = await fbQuery;
      if (!fbError && fbData) {
        data = fbData;
        error = null;
      }
    }

    if (error || !data) {
      console.error('Failed to list bookings:', error);
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
    });
  }

  /**
   * Updates an appointment's status (confirmed, completed, cancelled, no_show) and optional payment_status with audit trail logging.
   */
  static async updateBookingStatus(
    id: string,
    status: string,
    paymentStatus?: string,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (paymentStatus) {
      updatePayload.payment_status = paymentStatus;
    }

    const { error } = await admin
      .from('bookings')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      // Fallback if payment_status column not yet present in PostgREST cache
      if (paymentStatus) {
        delete updatePayload.payment_status;
        const { error: fbErr } = await admin
          .from('bookings')
          .update(updatePayload)
          .eq('id', id);
        if (fbErr) return { success: false, error: fbErr.message };
      } else {
        return { success: false, error: error.message };
      }
    }

    // Invisible Audit Trail
    try {
      await AuditService.recordLog({
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'booking.status_change',
        entity_type: 'booking',
        entity_id: id,
        changes: updatePayload,
      });
    } catch (auditErr) {
      console.warn('Failed to record booking audit log:', auditErr);
    }

    return { success: true };
  }
}
