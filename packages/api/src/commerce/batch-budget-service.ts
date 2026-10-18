import { getSupabaseAdminClient, Batch, Order } from '@dissafyt/database';
import { EmailService } from '../notifications/email-service';
import { getCanonicalSiteUrl } from '../config/domains.config';

export interface BatchReservationResult {
  success: boolean;
  reason?: 'CAPACITY_EXCEEDED' | 'BATCH_INACTIVE' | string;
  remainingBudget?: number;
  currentCogs?: number;
  status?: string;
}

export interface SkuProcurementSummary {
  productName: string;
  supplierName?: string | null;
  supplierSku?: string | null;
  sizes: Record<string, number>;
  totalUnits: number;
  unitCogs: number;
  totalCogs: number;
  totalRetail: number;
}

export interface BatchAnalytics {
  batch: Batch;
  budgetCap: number;
  remainingBudget: number;
  allocatedCogs: number;
  projectedRetail: number;
  projectedNetProfit: number;
  totalUnits: number;
  totalOrders: number;
  settledOrdersCount: number;
  awaitingSettlementCount: number;
  expiredOrdersCount: number;
  waitlistCount: number;
  sizeMatrix: Record<string, number>;
  skuMatrix: Record<string, SkuProcurementSummary>;
  orders: any[];
}

export class BatchBudgetService {
  /**
   * Retrieves the current active pre-order batch.
   * Defaults to 'batch-01' or creates one if none exists.
   */
  static async getActiveBatch(): Promise<Batch> {
    const admin = getSupabaseAdminClient();
    const { data: batch, error } = await admin
      .from('batches')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[BatchBudgetService] Failed to load active batch:', error);
      throw error;
    }

    if (batch) return batch as Batch;

    // Fallback: Create initial Batch 01
    const { data: newBatch, error: createErr } = await admin
      .from('batches')
      .insert({
        batch_name: 'Batch 01 - Cape Town Streetwear Drop',
        batch_code: 'batch-01',
        capital_budget: 10000.0,
        remaining_budget: 10000.0,
        current_cogs_allocated: 0.0,
        current_retail_value: 0.0,
        total_units_reserved: 0,
        status: 'accumulating',
        is_active: true,
      })
      .select('*')
      .single();

    if (createErr) throw createErr;
    return newBatch as Batch;
  }

  /**
   * Retrieves a batch by its UUID.
   */
  static async getBatchById(batchId: string): Promise<Batch | null> {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .maybeSingle();

    if (error) throw error;
    return data as Batch | null;
  }

  /**
   * Lists all batches in descending order of creation.
   */
  static async listBatches(): Promise<Batch[]> {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[BatchBudgetService] listBatches error:', error);
      throw error;
    }
    return (data || []) as Batch[];
  }

  /**
   * Creates a new pre-order batch.
   */
  static async createBatch(params: {
    batch_name: string;
    batch_code: string;
    capital_budget?: number;
    contingency_buffer_pct?: number;
    is_active?: boolean;
  }): Promise<Batch> {
    const admin = getSupabaseAdminClient();
    const budget = Number(params.capital_budget) || 10000;
    const shouldActivate = params.is_active ?? false;

    if (shouldActivate) {
      await admin.from('batches').update({ is_active: false }).eq('is_active', true);
    }

    const cleanCode = params.batch_code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    const { data, error } = await admin
      .from('batches')
      .insert({
        batch_name: params.batch_name.trim(),
        batch_code: cleanCode,
        capital_budget: budget,
        remaining_budget: budget,
        current_cogs_allocated: 0,
        current_retail_value: 0,
        total_units_reserved: 0,
        status: 'accumulating',
        contingency_buffer_pct: Number(params.contingency_buffer_pct) || 5,
        is_active: shouldActivate,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as Batch;
  }

  /**
   * Sets a specific batch as the primary active batch for incoming pre-orders.
   */
  static async setActiveBatch(batchId: string): Promise<Batch> {
    const admin = getSupabaseAdminClient();
    // 1. Deactivate all existing batches
    await admin.from('batches').update({ is_active: false }).eq('is_active', true);
    // 2. Activate target batch
    const { data, error } = await admin
      .from('batches')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', batchId)
      .select('*')
      .single();

    if (error) throw error;
    return data as Batch;
  }

  /**
   * Deletes an empty batch (only permitted if no customer orders are attached).
   */
  static async deleteBatch(batchId: string): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    const { count, error: countErr } = await admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id', batchId);

    if (countErr) throw countErr;
    if ((count || 0) > 0) {
      return {
        success: false,
        error: `Cannot delete batch with ${count} linked order(s). Deactivate or mark status as cancelled instead.`,
      };
    }

    const { error } = await admin.from('batches').delete().eq('id', batchId);
    if (error) throw error;
    return { success: true };
  }

  /**
   * Updates batch parameters (budget, status, name, etc.).
   */
  static async updateBatchSettings(
    batchId: string,
    updates: Partial<Batch>
  ): Promise<Batch> {
    const admin = getSupabaseAdminClient();

    let payload = { ...updates };
    if (updates.capital_budget !== undefined) {
      const current = await this.getBatchById(batchId);
      if (current) {
        const cogsAllocated = Number(current.current_cogs_allocated) || 0;
        payload.remaining_budget = Math.max(0, Number(updates.capital_budget) - cogsAllocated);
      }
    }

    const { data, error } = await admin
      .from('batches')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)
      .select('*')
      .single();

    if (error) throw error;
    return data as Batch;
  }

  /**
   * High-concurrency atomic reservation using PostgreSQL stored procedure claim_batch_spot.
   * Guarantees that split-second collisions are rejected atomically at the database engine level.
   */
  static async reserveSpot(params: {
    batchId: string;
    cogsAmount: number;
    retailAmount: number;
    quantity: number;
  }): Promise<BatchReservationResult> {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin.rpc('claim_batch_spot', {
      p_batch_id: params.batchId,
      p_cogs_amount: params.cogsAmount,
      p_retail_amount: params.retailAmount,
      p_quantity: params.quantity,
    });

    if (error) {
      console.error('[BatchBudgetService] RPC claim_batch_spot error:', error);
      return { success: false, reason: error.message };
    }

    if (!data || !data.success) {
      return {
        success: false,
        reason: data?.reason || 'CAPACITY_EXCEEDED',
      };
    }

    return {
      success: true,
      remainingBudget: Number(data.remaining_budget),
      currentCogs: Number(data.current_cogs),
      status: data.status,
    };
  }

  /**
   * Releases allocated capital back to the batch pool (for ghost orders or customer cancellations).
   */
  static async releaseSpot(params: {
    batchId: string;
    cogsAmount: number;
    retailAmount: number;
    quantity: number;
  }): Promise<boolean> {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin.rpc('release_batch_spot', {
      p_batch_id: params.batchId,
      p_cogs_amount: params.cogsAmount,
      p_retail_amount: params.retailAmount,
      p_quantity: params.quantity,
    });

    if (error) {
      console.error('[BatchBudgetService] RPC release_batch_spot error:', error);
      return false;
    }

    return Boolean(data?.success);
  }

  /**
   * Aggregates live telemetry, sizing matrices, and procurement breakdowns for a batch.
   */
  static async getBatchAnalytics(batchId?: string): Promise<BatchAnalytics> {
    const admin = getSupabaseAdminClient();
    const targetBatch = batchId
      ? await this.getBatchById(batchId)
      : await this.getActiveBatch();

    if (!targetBatch) {
      throw new Error('Batch not found');
    }

    // Retrieve all active orders linked to this batch
    const { data: orders, error: ordersErr } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('batch_id', targetBatch.id)
      .order('created_at', { ascending: true });

    if (ordersErr) throw ordersErr;

    const sizeMatrix: Record<string, number> = {};
    const skuMatrix: Record<string, SkuProcurementSummary> = {};
    const siteUrl = getCanonicalSiteUrl();

    let totalUnits = 0;
    let settledOrdersCount = 0;
    let awaitingSettlementCount = 0;
    let expiredOrdersCount = 0;
    let waitlistCount = 0;

    const enrichedOrders = (orders || []).map((order) => {
      const isSettled =
        order.status === 'paid' ||
        order.status === 'processing' ||
        order.status === 'shipped' ||
        order.deposit_status === 'fully_settled';

      if (isSettled) {
        settledOrdersCount++;
      } else if (order.reservation_tier === 'waitlist') {
        waitlistCount++;
      } else if (order.status === 'batch_payment_requested') {
        awaitingSettlementCount++;
      }

      const paymentUrl = `${siteUrl}/pay/preorder?order=${order.order_number}&token=${order.payment_link_token || order.id}`;
      const customerName = order.customer_name || 'Collector';
      const whatsappMsg = encodeURIComponent(
        `Hey ${customerName}! Your pre-order #${order.order_number} for Dissafyt Batch 01 is now confirmed for production. Complete your chair/shipping settlement here: ${paymentUrl}`
      );
      const cleanPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
      const whatsappLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${whatsappMsg}` : null;

      for (const item of order.order_items || []) {
        const qty = Number(item.quantity) || 1;
        totalUnits += qty;

        // Parse Size
        const nameParts = (item.product_name || '').split(' - ');
        const variantDesc = nameParts[1] || '';
        let size = 'Standard';
        if (variantDesc.includes('/')) {
          const parts = variantDesc.split('/').map((s: string) => s.trim());
          size = parts[1] || parts[0];
        } else if (variantDesc) {
          size = variantDesc;
        }

        sizeMatrix[size] = (sizeMatrix[size] || 0) + qty;

        // Sku Matrix grouping
        const skuKey = nameParts[0] || item.product_name || 'Streetwear Garment';
        if (!skuMatrix[skuKey]) {
          skuMatrix[skuKey] = {
            productName: skuKey,
            sizes: {},
            totalUnits: 0,
            unitCogs: 180, // Default estimate if cost_price unset
            totalCogs: 0,
            totalRetail: 0,
          };
        }
        skuMatrix[skuKey].sizes[size] = (skuMatrix[skuKey].sizes[size] || 0) + qty;
        skuMatrix[skuKey].totalUnits += qty;
        skuMatrix[skuKey].totalRetail += Number(item.total_price) || 0;
        skuMatrix[skuKey].totalCogs += qty * 180;
      }

      return {
        ...order,
        paymentUrl,
        whatsappLink,
      };
    });

    const budgetCap = Number(targetBatch.capital_budget) || 10000;
    const remainingBudget = Number(targetBatch.remaining_budget) || 0;
    const allocatedCogs = Number(targetBatch.current_cogs_allocated) || 0;
    const projectedRetail = Number(targetBatch.current_retail_value) || 0;
    const projectedNetProfit = projectedRetail - allocatedCogs;

    return {
      batch: targetBatch,
      budgetCap,
      remainingBudget,
      allocatedCogs,
      projectedRetail,
      projectedNetProfit,
      totalUnits,
      totalOrders: orders?.length || 0,
      settledOrdersCount,
      awaitingSettlementCount,
      expiredOrdersCount,
      waitlistCount,
      sizeMatrix,
      skuMatrix,
      orders: enrichedOrders,
    };
  }

  /**
   * Broadcasts PayFast balance settlement notices to customers in a batch.
   */
  static async notifyBatchCustomers(batchId: string): Promise<{
    success: boolean;
    notifiedCount: number;
    error?: string;
  }> {
    const admin = getSupabaseAdminClient();
    try {
      const analytics = await this.getBatchAnalytics(batchId);
      let notifiedCount = 0;

      for (const order of analytics.orders) {
        if (order.status === 'paid' || order.reservation_tier === 'waitlist') continue;

        const customerEmail = order.customer_email || (order.shipping_address as any)?.recipient_email;
        const customerName = order.customer_name || 'Collector';

        if (customerEmail) {
          try {
            await EmailService.sendBatchUnlockedPaymentNotice({
              orderNumber: order.order_number,
              customerName,
              customerEmail,
              productName: analytics.batch.batch_name,
              target: analytics.batch.total_units_reserved || 50,
              totalAmount: Number(order.total),
              paymentUrl: order.paymentUrl,
            });
            notifiedCount++;
          } catch (e) {
            console.warn(`[BatchBudgetService] Failed email for ${customerEmail}:`, e);
          }
        }

        // Mark as batch_payment_requested with notification timestamp
        await admin
          .from('orders')
          .update({
            status: 'batch_payment_requested',
            batch_notified_at: new Date().toISOString(),
            batch_settlement_requested_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      }

      // Mark batch status as batch_filled
      await admin
        .from('batches')
        .update({ status: 'batch_filled', updated_at: new Date().toISOString() })
        .eq('id', batchId);

      return { success: true, notifiedCount };
    } catch (err: any) {
      console.error('[BatchBudgetService] notifyBatchCustomers error:', err);
      return { success: false, notifiedCount: 0, error: err.message };
    }
  }

  /**
   * Releases an unconfirmed/ghost reservation and promotes the oldest waitlist order.
   */
  static async releaseGhostSpot(orderId: string): Promise<{
    success: boolean;
    promotedOrderId?: string;
    error?: string;
  }> {
    const admin = getSupabaseAdminClient();
    try {
      // 1. Fetch order with items
      const { data: order, error: orderErr } = await admin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (orderErr || !order) throw new Error('Order not found');
      if (!order.batch_id) throw new Error('Order not linked to a batch');

      const totalQty = (order.order_items || []).reduce((acc: number, i: any) => acc + (i.quantity || 1), 0);
      const retailVal = Number(order.total) || 0;
      const cogsVal = totalQty * 180; // Standard blank COGS estimate

      // 2. Mark order as cancelled / ghost_released
      await admin
        .from('orders')
        .update({
          status: 'cancelled',
          reservation_tier: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // 3. Atomically release budget back to batch pool
      await this.releaseSpot({
        batchId: order.batch_id,
        cogsAmount: cogsVal,
        retailAmount: retailVal,
        quantity: totalQty,
      });

      // 4. Look for oldest waitlisted order in same batch to promote
      const { data: waitlistOrder } = await admin
        .from('orders')
        .select('*, order_items(*)')
        .eq('batch_id', order.batch_id)
        .eq('reservation_tier', 'waitlist')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      let promotedOrderId: string | undefined;

      if (waitlistOrder) {
        const waitlistQty = (waitlistOrder.order_items || []).reduce(
          (acc: number, i: any) => acc + (i.quantity || 1),
          0
        );
        const waitlistRetail = Number(waitlistOrder.total) || 0;
        const waitlistCogs = waitlistQty * 180;

        // Atomically re-claim for waitlist order
        const reserveRes = await this.reserveSpot({
          batchId: order.batch_id,
          cogsAmount: waitlistCogs,
          retailAmount: waitlistRetail,
          quantity: waitlistQty,
        });

        if (reserveRes.success) {
          await admin
            .from('orders')
            .update({
              reservation_tier: 'subsidized_free',
              status: 'preorder_reserved',
              updated_at: new Date().toISOString(),
            })
            .eq('id', waitlistOrder.id);

          promotedOrderId = waitlistOrder.id;
        }
      }

      return { success: true, promotedOrderId };
    } catch (err: any) {
      console.error('[BatchBudgetService] releaseGhostSpot error:', err);
      return { success: false, error: err.message };
    }
  }
}
