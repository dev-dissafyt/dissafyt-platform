import { getSupabaseAdminClient, PrintJob, PrintJobStatus } from '@dissafyt/database';
import { AuditService } from '../audit/audit-service';

// In-memory fallback buffer for print jobs
const RUNTIME_PRINT_JOBS: PrintJob[] = [
  {
    id: 'pj-demo-001',
    order_id: 'ord-demo-001',
    order_item_id: 'item-demo-001',
    product_id: 'prod-demo-001',
    brand_id: 'b0000000-0000-0000-0000-000000000001',
    garment_color: 'Black',
    garment_size: 'L',
    print_technique: 'dtf',
    status: 'pending',
    tracking_number: null,
    operator_notes: 'Heavyweight boxy tee - center chest 28cm',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: {
      id: 'prod-demo-001',
      name: 'Dissafyt Arch Logo Oversized Tee',
      slug: 'dissafyt-arch-logo-oversized-tee',
      base_price: 380,
      is_active: true,
      images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=60'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      design_file_url: 'https://placehold.co/1200x1200/png?text=Arch+Logo+Print+Asset',
      print_placement: { location: 'front_chest', width_cm: 28, offset_top_cm: 9.5 },
      is_custom_print: true,
    },
    brand: {
      id: 'b0000000-0000-0000-0000-000000000001',
      name: 'Dissafyt Originals',
      slug: 'dissafyt-originals',
      deal_type: 'stacked_returns',
      commission_rate: 0,
      created_at: new Date().toISOString(),
    },
  },
];

export class StudioService {
  /**
   * Lists factory print jobs with optional status/brand/order filtering.
   */
  static async listPrintJobs(filter?: { status?: PrintJobStatus; brandId?: string; orderId?: string }): Promise<PrintJob[]> {
    const admin = getSupabaseAdminClient();
    try {
      let query = admin
        .from('print_jobs')
        .select(`
          *,
          product:products(*),
          brand:brands(*)
        `)
        .order('created_at', { ascending: false });

      if (filter?.status) {
        query = query.eq('status', filter.status);
      }
      if (filter?.brandId) {
        query = query.eq('brand_id', filter.brandId);
      }
      if (filter?.orderId) {
        query = query.eq('order_id', filter.orderId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as PrintJob[];
      }
    } catch {
      // Fallback
    }

    let filtered = [...RUNTIME_PRINT_JOBS];
    if (filter?.status) {
      filtered = filtered.filter((j) => j.status === filter.status);
    }
    if (filter?.brandId) {
      filtered = filtered.filter((j) => j.brand_id === filter.brandId);
    }
    if (filter?.orderId) {
      filtered = filtered.filter((j) => j.order_id === filter.orderId);
    }
    return filtered;
  }

  /**
   * Retrieves a specific print job ticket by ID.
   */
  static async getJobTicket(id: string): Promise<PrintJob | null> {
    const admin = getSupabaseAdminClient();
    try {
      const { data, error } = await admin
        .from('print_jobs')
        .select(`
          *,
          product:products(*),
          brand:brands(*)
        `)
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as PrintJob;
      }
    } catch {
      // Fallback
    }

    return RUNTIME_PRINT_JOBS.find((j) => j.id === id) || null;
  }

  /**
   * Creates a new factory print job ticket.
   */
  static async createPrintJob(
    input: Partial<PrintJob> & { order_id: string },
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; printJob?: PrintJob; error?: string }> {
    const admin = getSupabaseAdminClient();
    const id = `pj-${Date.now()}`;
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = input.ticket_number || `PJ-${year}-${rand}`;

    const newJob: PrintJob = {
      order_item_id: `item-${Date.now()}`,
      garment_color: 'Black',
      garment_size: 'L',
      print_technique: 'dtf',
      status: 'pending',
      quantity: 1,
      ...input,
      id,
      ticket_number: ticketNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await admin.from('print_jobs').insert(newJob).select().single();
      if (!error && data) {
        RUNTIME_PRINT_JOBS.unshift(data as PrintJob);
        return { success: true, printJob: data as PrintJob };
      }
    } catch {
      // Fallback
    }

    RUNTIME_PRINT_JOBS.unshift(newJob);

    // Invisible Audit Trail
    await AuditService.recordLog({
      actor_email: actor?.email || 'factory@dissafyt.com',
      actor_role: actor?.role || 'staff',
      action: 'print_job.create',
      entity_type: 'print_job',
      entity_id: id,
      entity_name: `Print Job for Order ${newJob.order_id}`,
      changes: newJob,
    });

    return { success: true, printJob: newJob };
  }

  /**
   * Advances the print job through factory stages:
   * pending -> printing -> qc_passed -> ready_to_pack -> dispatched
   */
  static async updateJobStatus(
    id: string,
    status: PrintJobStatus,
    trackingNumber?: string,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; printJob?: PrintJob; error?: string }> {
    const admin = getSupabaseAdminClient();
    const existing = RUNTIME_PRINT_JOBS.find((j) => j.id === id);

    const payload: Partial<PrintJob> = {
      status,
      updated_at: new Date().toISOString(),
      ...(trackingNumber ? { 
        tracking_number: trackingNumber, 
        courier_tracking_number: trackingNumber 
      } : {}),
    };

    try {
      const { data, error } = await admin
        .from('print_jobs')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const idx = RUNTIME_PRINT_JOBS.findIndex((j) => j.id === id);
        if (idx !== -1) RUNTIME_PRINT_JOBS[idx] = { ...RUNTIME_PRINT_JOBS[idx], ...data };
        return { success: true, printJob: data as PrintJob };
      }
    } catch {
      // Fallback
    }

    const idx = RUNTIME_PRINT_JOBS.findIndex((j) => j.id === id);
    if (idx !== -1) {
      RUNTIME_PRINT_JOBS[idx] = { ...RUNTIME_PRINT_JOBS[idx], ...payload };
    }

    const updated = RUNTIME_PRINT_JOBS.find((j) => j.id === id) || { ...payload, id } as PrintJob;

    // Invisible Audit Trail
    await AuditService.recordLog({
      actor_email: actor?.email || 'factory@dissafyt.com',
      actor_role: actor?.role || 'staff',
      action: 'print_job.update_status',
      entity_type: 'print_job',
      entity_id: id,
      entity_name: `Print Job ${id} (${status})`,
      changes: {
        before: { status: existing?.status },
        after: { status, tracking_number: trackingNumber },
      },
    });

    return { success: true, printJob: updated };
  }
}
