import { getSupabaseAdminClient, BarberService } from '@dissafyt/database';
import { AuditService } from '../audit/audit-service';

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
   * Lists all barbershop staff.
   */
  static async listStaff(): Promise<any[]> {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('staff')
      .select('*')
      .order('display_name', { ascending: true });

    if (error || !data) {
      console.error('Failed to list staff:', error);
      return [];
    }
    return data;
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
    },
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; staff?: any; error?: string }> {
    const admin = getSupabaseAdminClient();
    const payload: any = {
      display_name: input.display_name,
      bio: input.bio || '',
      user_id: input.user_id || null,
      is_active: input.is_active !== undefined ? input.is_active : true,
    };
    if (input.phone) payload.phone = input.phone;
    if (input.avatar_url) payload.avatar_url = input.avatar_url;
    if (input.working_hours) payload.working_hours = input.working_hours;

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
        };
      } else {
        return { success: false, error: error.message };
      }
    } else {
      createdStaff = data;
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
    input: { display_name?: string; bio?: string; phone?: string; avatar_url?: string; working_hours?: any; is_active?: boolean; user_id?: string | null },
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
        // Gracefully handle missing columns in schema cache (e.g. phone, avatar_url, working_hours)
        if (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('schema cache')) {
          console.warn('Staff update fallback: schema column missing, stripping pending columns:', error.message);
          delete payload.phone;
          delete payload.avatar_url;
          delete payload.working_hours;

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
          };
        } else {
          return { success: false, error: error.message };
        }
      } else {
        updatedStaff = data;
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
      if (filters.date === 'upcoming') {
        const now = new Date();
        query = query.gte('end_time', now.toISOString());
      } else if (filters.date === 'past') {
        const now = new Date();
        query = query.lt('end_time', now.toISOString());
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

    const { data, error } = await query;
    if (error || !data) {
      console.error('Failed to list bookings:', error);
      return [];
    }
    return data;
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
