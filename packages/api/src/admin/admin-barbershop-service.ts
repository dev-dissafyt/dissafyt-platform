import { getSupabaseAdminClient, BarberService } from '@dissafyt/database';

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
  static async createService(input: CreateServiceInput): Promise<{ success: boolean; service?: BarberService; error?: string }> {
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
      const { data, error } = await admin.from('services').insert(payload).select().single();
      if (error) {
        // Fall back without subscription fields if schema hasn't run migration 0002 yet
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
          return { success: true, service: fallbackData };
        }
        return { success: false, error: error.message };
      }
      return { success: true, service: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Updates an existing service.
   */
  static async updateService(id: string, input: UpdateServiceInput): Promise<{ success: boolean; service?: BarberService; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      const payload: any = { ...input };
      const { data, error } = await admin.from('services').update(payload).eq('id', id).select().single();
      if (error) {
        if (error.code === 'PGRST204') {
          delete payload.is_subscription;
          delete payload.plan_code;
          const { data: fbData, error: fbError } = await admin.from('services').update(payload).eq('id', id).select().single();
          if (fbError) return { success: false, error: fbError.message };
          return { success: true, service: fbData };
        }
        return { success: false, error: error.message };
      }
      return { success: true, service: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Deletes a service by ID.
   */
  static async deleteService(id: string): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    const { error } = await admin.from('services').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }
}
