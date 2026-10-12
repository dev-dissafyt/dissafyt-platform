import { getSupabaseAdminClient, Order, OrderItem, OrderStatus } from '@dissafyt/database';
import { StudioService } from '../studio/studio-service';
import { BrandService } from '../studio/brand-service';
import { AuditService } from '../audit/audit-service';
import { EmailService } from '../notifications/email-service';
import { getCanonicalSiteUrl } from '../config/domains.config';

export interface ShippingAddress {
  recipient_name: string;
  recipient_phone: string;
  street_address: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  country?: string;
}

export interface CreateOrderItemInput {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price?: number;
}

export interface CreateOrderInput {
  user_id?: string;
  customer_id?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_name?: string;
  items: CreateOrderItemInput[];
  shipping_address: any;
  shipping_method?: string;
  shipping_cost?: number;
  payment_method?: string;
  fulfillment_choice?: 'courier' | 'studio_collection';
  collection_location_id?: string;
  promo_code?: string | null;
  discount_amount?: number | null;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  customer_email?: string;
  customer_name?: string;
}

export const GUEST_USER_ID = '5554892b-dd35-4778-81cc-98da343dfbae';

export class OrderService {
  /**
   * Generates a distinct human-readable order number, e.g. DIS-2026-8921
   */
  private static generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DIS-${year}-${random}`;
  }

  /**
   * Creates an order authoritatively: validates prices strictly from DB, verifies stock availability,
   * and persists order in pending_payment state without premature stock decrement.
   */
  static async createOrder(input: CreateOrderInput): Promise<{ success: boolean; order?: OrderWithItems; error?: string }> {
    const admin = getSupabaseAdminClient();

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Order must contain at least one item' };
    }

    // Resolve guest user ID to official guest account or existing customer profile
    let userId = input.user_id || input.customer_id;
    const recipientEmail = input.customer_email || input.shipping_address?.recipient_email;

    if (!userId || userId === '00000000-0000-0000-0000-000000000000' || userId === 'guest-user') {
      if (recipientEmail) {
        try {
          const { data: profile } = await admin
            .from('profiles')
            .select('id')
            .eq('email', recipientEmail)
            .maybeSingle();
          if (profile?.id) {
            userId = profile.id;
          }
        } catch {
          // Fallback to official guest account
        }
      }
    }

    if (!userId || userId === '00000000-0000-0000-0000-000000000000' || userId === 'guest-user') {
      userId = GUEST_USER_ID;
    }

    try {
      // 1. Fetch product & variant details to compute authoritative prices
      const productIds = input.items.map((i) => i.product_id);
      let products: any[] = [];
      try {
        const { data: pData, error: prodErr } = await admin
          .from('products')
          .select('id, name, base_price, is_active, brand_id, is_custom_print, print_placement, design_file_url, mockup_url, is_preorder, preorder_deposit_pct')
          .in('id', productIds);
        if (!prodErr && pData) {
          products = pData;
        }
      } catch {
        // Fallback
      }

      // Check runtime custom products for any missing items
      for (const pid of productIds) {
        if (!products.some((p) => p.id === pid)) {
          const custom = BrandService.findCustomProduct(pid);
          if (custom) {
            products.push(custom);
          }
        }
      }

      // Pre-orders strictly require an authenticated customer account
      const hasPreorder = products.some((p) => p.is_preorder);
      if (hasPreorder && (!userId || userId === GUEST_USER_ID)) {
        return {
          success: false,
          error: 'An authenticated customer account is required to reserve pre-order drop garments. Please log in or register to secure your piece.',
        };
      }

      // Fetch variants if applicable
      const variantIds = input.items.filter((i) => i.variant_id).map((i) => i.variant_id);
      let variants: any[] = [];
      if (variantIds.length > 0) {
        try {
          const { data: vData } = await admin
            .from('product_variants')
            .select('id, name, price_override, stock_quantity')
            .in('id', variantIds);
          variants = vData || [];
        } catch {
          // Fallback
        }
      }

      // Calculate totals with strictly authoritative pricing
      let orderSubtotal = 0;
      let orderDepositTotal = 0;
      let orderBalanceTotal = 0;
      const orderItemsToInsert: {
        id?: string;
        product_id: string;
        variant_id?: string | null;
        product_name: string;
        unit_price: number;
        quantity: number;
        total_price: number;
        is_preorder: boolean;
        deposit_amount: number;
        balance_amount: number;
      }[] = [];

      for (const item of input.items) {
        const product = products.find((p) => p.id === item.product_id);
        if (!product) {
          return { success: false, error: `Product not found: ${item.product_id}` };
        }
        if (!product.is_active) {
          return { success: false, error: `Product is no longer available: ${product.name}` };
        }

        // Strictly authoritative server pricing; client-sent unit_price is ignored
        let unitPrice = Number(product.base_price);
        let productName = product.name;

        if (item.variant_id) {
          const variant = variants.find((v) => v.id === item.variant_id);
          if (!variant) {
            return { success: false, error: `Product variant not found: ${item.variant_id}` };
          }
          // Pre-orders allow on-demand batch reservations even if physical warehouse stock is 0
          if (variant.stock_quantity < item.quantity && !product.is_preorder) {
            return { success: false, error: `Insufficient stock for ${productName} (${variant.name}). Available: ${variant.stock_quantity}` };
          }
          if (variant.price_override !== null && variant.price_override !== undefined && Number(variant.price_override) > 0) {
            unitPrice = Number(variant.price_override);
          }
          productName = `${productName} - ${variant.name}`;
        }

        const totalPrice = unitPrice * item.quantity;
        const isPreorder = Boolean(product.is_preorder);
        let depositAmount = totalPrice;
        let balanceAmount = 0;

        if (isPreorder) {
          // Zero upfront deposit for preorder accumulation
          depositAmount = 0.00;
          balanceAmount = totalPrice;
        }

        orderSubtotal += totalPrice;
        orderDepositTotal += depositAmount;
        orderBalanceTotal += balanceAmount;

        orderItemsToInsert.push({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          product_name: productName,
          unit_price: unitPrice,
          quantity: item.quantity,
          total_price: totalPrice,
          is_preorder: isPreorder,
          deposit_amount: depositAmount,
          balance_amount: balanceAmount,
        });
      }

      const fulfillmentChoice = input.fulfillment_choice === 'studio_collection' ? 'studio_collection' : 'courier';
      const shippingCost = fulfillmentChoice === 'studio_collection' ? 0 : (input.shipping_cost || 0);

      // Validate promo code authoritatively on the server (never trust client-sent discount_amount)
      let discountAmount = 0;
      const normalizedPromo = (input.promo_code || '').trim().toLowerCase();
      if (normalizedPromo === 'firstbuy26') {
        discountAmount = 20.00; // Survey completion voucher: R20.00 OFF
      }

      const grossTotal = orderSubtotal + shippingCost;
      const orderTotal = Math.max(0, grossTotal - discountAmount);

      const isPurePreorder = hasPreorder && orderDepositTotal === 0;
      const initialStatus = isPurePreorder ? 'preorder_reserved' : 'pending_payment';

      // 2. Insert into orders table with valid user_id
      const orderNumber = this.generateOrderNumber();
      let order: any = null;

      const enrichedShippingAddress = {
        ...input.shipping_address,
        ...(normalizedPromo ? { promo_code: normalizedPromo, discount_amount: discountAmount } : {}),
      };

      try {
        const { data: dbOrder, error: orderErr } = await admin
          .from('orders')
          .insert({
            user_id: userId,
            order_number: orderNumber,
            status: initialStatus,
            subtotal: orderSubtotal,
            total: orderTotal,
            deposit_paid: 0.00,
            balance_due: isPurePreorder ? orderTotal : Math.max(0, orderBalanceTotal - (orderDepositTotal === 0 ? discountAmount : 0)),
            deposit_status: 'none',
            fulfillment_choice: fulfillmentChoice,
            collection_location_id: input.collection_location_id || 'loc-cpt-flagship',
            customer_email: recipientEmail || null,
            customer_phone: input.customer_phone || input.shipping_address?.recipient_phone || null,
            customer_name: input.customer_name || input.shipping_address?.recipient_name || null,
            shipping_address: enrichedShippingAddress,
          })
          .select()
          .single();

        if (!orderErr && dbOrder) {
          order = dbOrder;
        } else if (orderErr) {
          console.error('Failed to insert order into DB:', orderErr);
        }
      } catch (insertErr) {
        console.error('Exception inserting order:', insertErr);
      }

      if (!order) {
        return { success: false, error: 'Database order persistence failed. Please try again.' };
      }

      // 3. Insert items into order_items
      const itemsPayload = orderItemsToInsert.map((item) => ({
        ...item,
        order_id: order.id,
      }));

      let insertedItems: any[] = itemsPayload;
      try {
        const { data: dbItems, error: itemsErr } = await admin
          .from('order_items')
          .insert(itemsPayload)
          .select();

        if (!itemsErr && dbItems && dbItems.length > 0) {
          insertedItems = dbItems;
        } else if (itemsErr) {
          console.error('Failed to insert order items:', itemsErr);
        }
      } catch (itemsEx) {
        console.error('Exception inserting order items:', itemsEx);
      }

      // Check if any preorder products have reached their batch goal
      if (hasPreorder) {
        for (const p of products) {
          if (p.is_preorder) {
            try {
              const counts = await this.getPreorderClaimedCounts([p.id]);
              const currentClaimed = counts[p.id] || 0;
              const target = Number(p.preorder_target) || 50;
              if (currentClaimed >= target) {
                await admin
                  .from('products')
                  .update({ batch_status: 'batch_filled' })
                  .eq('id', p.id);
              }
            } catch (batchErr) {
              console.error('[OrderService] Error checking/updating batch status:', batchErr);
            }
          }
        }
        this.notifyDropBackersOnNewPreorder(order.id, insertedItems).catch((err) =>
          console.warn('[OrderService] Warning notifying drop backers:', err)
        );
      }

      return {
        success: true,
        order: {
          ...order,
          order_items: insertedItems,
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Confirms payment for an order upon verified PayFast ITN notification.
   * Verifies paid amount >= order total, sets status to 'paid', decrements stock, and enqueues factory print jobs.
   */
  static async confirmOrderPayment(
    orderId: string,
    amountPaid: number,
    paymentRef?: string
  ): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();

    // Fetch order with items
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return { success: false, error: `Order not found: ${orderId}` };
    }

    if (order.status === 'paid' || order.deposit_status === 'fully_settled') {
      return { success: true };
    }

    // Authoritative payment amount verification
    const balanceDue = Number(order.balance_due || 0);

    // If order already has deposit paid, this incoming payment settles the outstanding balance online
    if (order.deposit_status === 'deposit_paid') {
      if (amountPaid >= balanceDue - 0.05) {
        return await this.settleOrderBalance({
          orderId,
          amountPaid,
          paymentMethod: 'payfast_online',
          notes: `Remaining balance settled online via PayFast (${paymentRef || 'PF_ONLINE'})`,
        });
      } else {
        return { success: false, error: `Balance underpaid: received R${amountPaid}, required R${balanceDue}` };
      }
    }

    // If order was a pre-order reservation awaiting batch settlement (supports 100% full or >=50% deposit)
    if (order.status === 'preorder_reserved' || order.status === 'batch_payment_requested') {
      const total = Number(order.total);
      const halfTotal = Math.round(total * 0.5 * 100) / 100;
      if (amountPaid >= total - 0.05) {
        await admin
          .from('orders')
          .update({
            status: 'paid',
            deposit_paid: amountPaid,
            balance_due: 0.00,
            deposit_status: 'fully_settled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        return { success: true };
      } else if (amountPaid >= halfTotal - 0.05) {
        await admin
          .from('orders')
          .update({
            status: 'deposit_paid',
            deposit_paid: amountPaid,
            balance_due: Math.max(0, total - amountPaid),
            deposit_status: 'deposit_paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        return { success: true };
      } else {
        return { success: false, error: `Underpaid batch settlement: received R${amountPaid}, minimum deposit required is R${halfTotal}` };
      }
    }

    const isMilestoneDeposit = balanceDue > 0;
    const expectedAmount = isMilestoneDeposit
      ? Number(order.total) - balanceDue
      : Number(order.total);

    // Must satisfy gross payment >= expected amount (with 0.05 margin for currency rounding)
    if (amountPaid < expectedAmount - 0.05) {
      console.warn(`Payment underpaid for order ${order.id}: received R${amountPaid}, expected R${expectedAmount}`);
      await admin
        .from('orders')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      return { success: false, error: `Payment underpaid: received R${amountPaid}, required R${expectedAmount}` };
    }

    // Update order status:
    // Pre-orders transition to 'processing' with deposit_status 'deposit_paid'
    // Standard full orders transition to 'paid' with deposit_status 'none'
    const nextStatus = isMilestoneDeposit ? 'processing' : 'paid';
    const nextDepositStatus = isMilestoneDeposit ? 'deposit_paid' : 'none';

    const { error: updateErr } = await admin
      .from('orders')
      .update({
        status: nextStatus,
        deposit_paid: amountPaid,
        deposit_status: nextDepositStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Decrement inventory stock on verified payment
    const orderItems = order.order_items || [];
    for (const item of orderItems) {
      if (item.variant_id) {
        try {
          const { data: variant } = await admin
            .from('product_variants')
            .select('stock_quantity')
            .eq('id', item.variant_id)
            .single();

          if (variant) {
            await admin
              .from('product_variants')
              .update({ stock_quantity: Math.max(0, variant.stock_quantity - item.quantity) })
              .eq('id', item.variant_id);
          }
        } catch (e) {
          console.error(`Failed to decrement stock for variant ${item.variant_id}:`, e);
        }
      }
    }

    // Mirror custom apparel items to Factory Print Queue
    for (const orderItem of orderItems) {
      try {
        const { data: product } = await admin
          .from('products')
          .select('id, name, is_custom_print, brand_id, print_placement, design_file_url, mockup_url')
          .eq('id', orderItem.product_id)
          .maybeSingle();

        if (product && (product.is_custom_print || product.brand_id)) {
          let garmentColor = 'Black';
          let garmentSize = 'L';

          if (orderItem.variant_id) {
            const { data: v } = await admin
              .from('product_variants')
              .select('name')
              .eq('id', orderItem.variant_id)
              .maybeSingle();
            if (v?.name) {
              const sizeMatch = v.name.match(/Size\s+([A-Z0-9]+)/i);
              if (sizeMatch) garmentSize = sizeMatch[1];
              const colorMatch = v.name.match(/-\s*([A-Za-z]+)/);
              if (colorMatch) garmentColor = colorMatch[1].trim();
            }
          }

          const placement = typeof product.print_placement === 'string'
            ? product.print_placement
            : (product.print_placement?.location || 'front_chest');

          await StudioService.createPrintJob({
            order_id: order.id,
            order_item_id: orderItem.id,
            product_id: product.id,
            product_name: product.name,
            variant_id: orderItem.variant_id || null,
            brand_id: product.brand_id || null,
            garment_color: garmentColor,
            garment_size: garmentSize,
            quantity: orderItem.quantity || 1,
            print_placement: placement,
            design_file_url: product.design_file_url || null,
            mockup_url: product.mockup_url || null,
            print_technique: 'dtf',
            status: 'pending',
            operator_notes: `Auto-mirrored from Paid Order #${order.order_number}`,
          });
        }
      } catch (jobErr) {
        console.warn('Failed to mirror print job to studio queue:', jobErr);
      }
    }

    // 4. Dispatch Sovereign Confirmation & Digital Receipt via EmailService
    try {
      let recipientEmail = order.customer_email || (order.shipping_address as any)?.recipient_email;
      let recipientName = order.customer_name || (order.shipping_address as any)?.recipient_name || 'Valued Collector';

      if (!recipientEmail && order.user_id && order.user_id !== '00000000-0000-0000-0000-000000000000' && order.user_id !== GUEST_USER_ID) {
        const { data: userProfile } = await admin
          .from('profiles')
          .select('email, full_name')
          .eq('id', order.user_id)
          .maybeSingle();
        if (userProfile?.email) {
          recipientEmail = userProfile.email;
          if (userProfile.full_name) recipientName = userProfile.full_name;
        }
      }

      if (recipientEmail) {
        const emailItems = (order.order_items || []).map((i: any) => ({
          name: i.product_name,
          quantity: i.quantity,
          price: Number(i.unit_price),
          total: Number(i.total_price),
        }));

        if (isMilestoneDeposit) {
          await EmailService.sendPreorderDepositReceipt({
            orderNumber: order.order_number,
            orderId: order.id,
            customerName: recipientName,
            customerEmail: recipientEmail,
            items: emailItems,
            depositPaid: amountPaid,
            balanceDue: balanceDue,
            total: Number(order.total),
            fulfillmentChoice: (order.fulfillment_choice as any) || 'courier',
            shippingAddress: order.shipping_address as any,
            trackingUrl: `https://dissafyt.com/account/orders?order_id=${order.id}`,
          });
        } else {
          await EmailService.sendOrderConfirmation({
            orderNumber: order.order_number,
            customerName: recipientName,
            customerEmail: recipientEmail,
            items: emailItems,
            subtotal: Number(order.subtotal || 0),
            shippingCost: Math.max(0, Number(order.total) - Number(order.subtotal || 0)),
            total: Number(order.total),
            shippingAddress: order.shipping_address as any,
            trackingUrl: `https://dissafyt.com/account/orders?order_id=${order.id}`,
          });
        }
      }
    } catch (mailErr) {
      console.warn('[OrderService] Warning: Failed to dispatch order confirmation email:', mailErr);
    }

    // 5. If this order contained pre-order garments, notify all previous backers of the drop update
    try {
      await this.notifyDropBackersOnNewPreorder(order.id, orderItems);
    } catch (dropNotifyErr) {
      console.warn('[OrderService] Warning: Failed to dispatch drop backer updates:', dropNotifyErr);
    }

    return { success: true };
  }

  /**
   * Settles the outstanding balance of a pre-order (e.g. collected in-person at POS counter or online).
   * Transitions deposit_status to 'fully_settled', updates financial ledgers, and dispatches the final receipt.
   */
  static async settleOrderBalance(params: {
    orderId: string;
    amountPaid: number;
    paymentMethod?: string;
    operatorEmail?: string;
    notes?: string;
  }): Promise<{ success: boolean; order?: OrderWithItems; error?: string }> {
    const admin = getSupabaseAdminClient();

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', params.orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return { success: false, error: `Order not found: ${params.orderId}` };
    }

    const balanceDue = Number(order.balance_due || 0);
    if (balanceDue <= 0 || order.deposit_status === 'fully_settled') {
      return { success: false, error: `Order ${order.order_number} has no outstanding balance due.` };
    }

    if (params.amountPaid < balanceDue - 0.05) {
      return {
        success: false,
        error: `Settlement amount underpaid: received R${params.amountPaid}, required R${balanceDue}`,
      };
    }

    const previousDepositPaid = Number(order.deposit_paid || 0);
    const newTotalPaid = previousDepositPaid + params.amountPaid;

    const { data: updatedOrder, error: updateErr } = await admin
      .from('orders')
      .update({
        deposit_paid: newTotalPaid,
        balance_due: 0.00,
        deposit_status: 'fully_settled',
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.orderId)
      .select('*, order_items(*)')
      .single();

    if (updateErr || !updatedOrder) {
      return { success: false, error: updateErr?.message || 'Failed to update order settlement status.' };
    }

    // 1. Record payment ledger entry
    try {
      await admin.from('payments').insert({
        user_id: order.user_id || GUEST_USER_ID,
        provider: params.paymentMethod || 'pos_card',
        amount: params.amountPaid,
        currency: 'ZAR',
        status: 'paid',
        related_type: 'order',
        related_id: order.id,
        is_test: false,
      });
    } catch (payErr) {
      console.warn('[OrderService] Warning: Failed to record payment ledger for balance settlement:', payErr);
    }

    // 2. Record audit log
    try {
      await AuditService.recordLog({
        actor_email: params.operatorEmail || 'pos-counter@dissafyt.com',
        actor_role: 'staff',
        action: 'order.balance_settled',
        entity_type: 'order',
        entity_id: order.id,
        entity_name: `Order ${order.order_number} Balance Settled`,
        changes: {
          balance_settled: params.amountPaid,
          deposit_status: 'fully_settled',
          payment_method: params.paymentMethod || 'pos_card',
          notes: params.notes,
        },
      });
    } catch (auditErr) {
      console.warn('[OrderService] Audit log warning:', auditErr);
    }

    // 3. Dispatch final settlement receipt email
    try {
      let recipientEmail = updatedOrder.customer_email || (updatedOrder.shipping_address as any)?.recipient_email;
      let recipientName = updatedOrder.customer_name || (updatedOrder.shipping_address as any)?.recipient_name || 'Valued Collector';

      if (!recipientEmail && updatedOrder.user_id && updatedOrder.user_id !== GUEST_USER_ID) {
        const { data: profile } = await admin
          .from('profiles')
          .select('email, full_name')
          .eq('id', updatedOrder.user_id)
          .maybeSingle();
        if (profile?.email) {
          recipientEmail = profile.email;
          if (profile.full_name) recipientName = profile.full_name;
        }
      }

      if (recipientEmail) {
        const emailItems = (updatedOrder.order_items || []).map((i: any) => ({
          name: i.product_name,
          quantity: i.quantity,
          price: Number(i.unit_price),
          total: Number(i.total_price),
        }));

        await EmailService.sendPreorderBalanceSettledReceipt({
          orderNumber: updatedOrder.order_number,
          orderId: updatedOrder.id,
          customerName: recipientName,
          customerEmail: recipientEmail,
          items: emailItems,
          depositPaid: previousDepositPaid,
          balanceSettled: params.amountPaid,
          totalPaid: newTotalPaid,
          paymentMethod: (params.paymentMethod || 'Card Machine').replace('_', ' ').toUpperCase(),
          fulfillmentChoice: (updatedOrder.fulfillment_choice as any) || 'studio_collection',
          collectionLocation: 'Dissafyt Studio - Bernie (1 Norwalk Way)',
          trackingUrl: `https://dissafyt.com/account/orders?order_id=${updatedOrder.id}`,
        });
      }
    } catch (mailErr) {
      console.warn('[OrderService] Warning: Failed to dispatch balance settled receipt email:', mailErr);
    }

    return {
      success: true,
      order: updatedOrder as OrderWithItems,
    };
  }

  /**
   * Authoritatively computes how many units have been claimed/pre-ordered for given product IDs.
   * Only counts orders with confirmed deposit ('deposit_paid', 'fully_settled') or paid/processing/completed status.
   */
  static async getPreorderClaimedCounts(productIds?: string[]): Promise<Record<string, number>> {
    const admin = getSupabaseAdminClient();
    try {
      // 1. Fetch confirmed/paid orders
      const { data: confirmedOrders, error: orderErr } = await admin
        .from('orders')
        .select('id')
        .or('deposit_status.in.(deposit_paid,fully_settled),status.in.(preorder_reserved,batch_payment_requested,processing,completed,shipped,paid,deposit_paid)');

      if (orderErr || !confirmedOrders || confirmedOrders.length === 0) {
        return {};
      }

      const orderIds = confirmedOrders.map((o) => o.id);

      // 2. Fetch order items for these orders
      let query = admin
        .from('order_items')
        .select('product_id, quantity')
        .in('order_id', orderIds);

      if (productIds && productIds.length > 0) {
        query = query.in('product_id', productIds);
      }

      const { data: items, error: itemsErr } = await query;
      if (itemsErr || !items) {
        return {};
      }

      const counts: Record<string, number> = {};
      for (const item of items) {
        if (!item.product_id) continue;
        counts[item.product_id] = (counts[item.product_id] || 0) + Number(item.quantity || 1);
      }

      return counts;
    } catch (e) {
      console.error('[OrderService] Error computing preorder claimed counts:', e);
      return {};
    }
  }

  /**
   * Notifies all existing drop backers each time a new pre-order item is placed into the drop.
   * Gives backers real-time transparency and excitement as their drop nears production lock.
   */
  static async notifyDropBackersOnNewPreorder(
    currentOrderId: string,
    orderItems: any[]
  ): Promise<void> {
    const admin = getSupabaseAdminClient();
    const productIds = Array.from(new Set(orderItems.map((i) => i.product_id).filter(Boolean)));
    if (productIds.length === 0) return;

    for (const productId of productIds) {
      try {
        const { data: product } = await admin
          .from('products')
          .select('id, name, slug, is_preorder, preorder_target, images')
          .eq('id', productId)
          .maybeSingle();

        if (!product || !product.is_preorder) continue;

        const targetUnits = Number(product.preorder_target) || 50;

        // Compute current claimed units across all confirmed orders
        const counts = await this.getPreorderClaimedCounts([productId]);
        const currentClaimed = counts[productId] || 0;

        // Fetch confirmed orders (excluding currentOrderId) that ordered this product
        const { data: confirmedOrders } = await admin
          .from('orders')
          .select('id, order_number, customer_email, customer_name, shipping_address')
          .neq('id', currentOrderId)
          .or('deposit_status.in.(deposit_paid,fully_settled),status.in.(preorder_reserved,batch_payment_requested,processing,completed,shipped,paid,deposit_paid)');

        if (!confirmedOrders || confirmedOrders.length === 0) continue;

        const confirmedOrderIds = confirmedOrders.map((o) => o.id);

        // Filter for orders that actually contain this productId
        const { data: matchingItems } = await admin
          .from('order_items')
          .select('order_id')
          .eq('product_id', productId)
          .in('order_id', confirmedOrderIds);

        if (!matchingItems || matchingItems.length === 0) continue;

        const matchingOrderIds = new Set(matchingItems.map((mi) => mi.order_id));
        const relevantOrders = confirmedOrders.filter((co) => matchingOrderIds.has(co.id));

        // Deduplicate backers by email
        const backerMap = new Map<string, { email: string; name: string; orderNumber: string }>();
        for (const bo of relevantOrders) {
          const email = (bo.customer_email || (bo.shipping_address as any)?.recipient_email || '').trim().toLowerCase();
          const name = bo.customer_name || (bo.shipping_address as any)?.recipient_name || 'Valued Collector';
          if (email && email.includes('@') && !backerMap.has(email)) {
            backerMap.set(email, {
              email,
              name,
              orderNumber: bo.order_number || bo.id.slice(0, 8),
            });
          }
        }

        const backerList = Array.from(backerMap.values());
        if (backerList.length === 0) continue;

        console.log(`[OrderService] Notifying ${backerList.length} previous backers for drop "${product.name}" (${currentClaimed}/${targetUnits} claimed)`);

        const productImage = product.images?.[0] || undefined;

        await Promise.allSettled(
          backerList.map((backer) =>
            EmailService.sendPreorderDropMilestoneNotification({
              recipientEmail: backer.email,
              recipientName: backer.name,
              productName: product.name,
              productSlug: product.slug,
              productImage,
              currentClaimed,
              targetUnits,
              backerOrderNumber: backer.orderNumber,
            })
          )
        );
      } catch (err) {
        console.warn(`[OrderService] Failed to notify backers for product ${productId}:`, err);
      }
    }
  }

  /**
   * Retrieves orders for a specific customer.
   */
  static async getUserOrders(userId: string): Promise<OrderWithItems[]> {
    const admin = getSupabaseAdminClient();
    const { data: orders, error } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !orders) {
      console.error('Failed to fetch user orders:', error);
      return [];
    }

    return orders as OrderWithItems[];
  }

  /**
   * Retrieves all platform orders for Admin operations.
   */
  static async listAdminOrders(): Promise<OrderWithItems[]> {
    const admin = getSupabaseAdminClient();
    const { data: orders, error } = await admin
      .from('orders')
      .select('*, order_items(*), profiles(email, full_name)')
      .order('created_at', { ascending: false });

    if (error || !orders) {
      console.error('Failed to fetch admin orders:', error);
      return [];
    }

    return orders.map((o: any) => ({
      ...o,
      customer_email: o.shipping_address?.recipient_email || o.profiles?.email || 'Guest',
      customer_name: o.shipping_address?.recipient_name || o.profiles?.full_name || 'Customer',
    }));
  }

  /**
   * Updates fulfillment state of an order with inventory restocking and audit logging.
   */
  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    operator?: { email?: string; role?: string; userId?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();

    // 1. Fetch current order to check previous status and items
    const { data: order, error: fetchErr } = await admin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr || !order) {
      return { success: false, error: fetchErr?.message || 'Order not found' };
    }

    const previousStatus = order.status;

    // 2. Update status
    const { error: updateErr } = await admin
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 3. If cancelling or refunding an order that was previously paid/processing/shipped/completed, restock inventory
    const shouldRestock =
      (status === 'cancelled' || status === 'refunded') &&
      ['paid', 'processing', 'shipped', 'fulfilled', 'completed'].includes(previousStatus);

    if (shouldRestock && order.order_items && order.order_items.length > 0) {
      for (const item of order.order_items) {
        if (item.variant_id) {
          try {
            const { data: variant } = await admin
              .from('product_variants')
              .select('stock_quantity')
              .eq('id', item.variant_id)
              .single();

            if (variant) {
              await admin
                .from('product_variants')
                .update({ stock_quantity: variant.stock_quantity + (item.quantity || 1) })
                .eq('id', item.variant_id);
            }
          } catch (restockErr) {
            console.error(`Failed to restock variant ${item.variant_id}:`, restockErr);
          }
        }
      }
    }

    // 4. Record audit log
    try {
      await AuditService.recordLog({
        actor_id: operator?.userId || null,
        actor_email: operator?.email || 'admin@dissafyt.com',
        actor_role: operator?.role || 'admin',
        action: 'order.status_change',
        entity_type: 'order',
        entity_id: orderId,
        entity_name: `Order #${order.order_number || orderId}`,
        changes: {
          previous_status: previousStatus,
          new_status: status,
          restocked: shouldRestock,
        },
      });
    } catch (auditErr) {
      console.warn('Failed to record order status audit log:', auditErr);
    }

    // 4. Dispatch shipping update notification if status transitioned to shipped
    if (status === 'shipped') {
      try {
        const recipientEmail = (order.shipping_address as any)?.recipient_email;
        const recipientName = (order.shipping_address as any)?.recipient_name || 'Customer';
        const trackingNum = (order as any).tracking_number || (order as any).waybill_number || `TCG-${order.order_number}`;

        if (recipientEmail) {
          await EmailService.sendShippingUpdate({
            orderNumber: order.order_number,
            customerName: recipientName,
            customerEmail: recipientEmail,
            courierName: 'The Courier Guy',
            trackingNumber: trackingNum,
            destinationCity: (order.shipping_address as any)?.city || 'your door',
          });
        }
      } catch (shipErr) {
        console.warn('[OrderService] Warning: Failed to send shipping update email:', shipErr);
      }
    }

    return { success: true };
  }

  /**
   * Gets a single order by ID.
   */
  static async getOrderById(orderId: string): Promise<OrderWithItems | null> {
    const admin = getSupabaseAdminClient();
    const { data: order, error } = await admin
      .from('orders')
      .select('*, order_items(*), profiles(email, full_name)')
      .eq('id', orderId)
      .single();

    if (error || !order) return null;

    return {
      ...order,
      customer_email: (order as any).shipping_address?.recipient_email || (order as any).profiles?.email,
      customer_name: (order as any).shipping_address?.recipient_name || (order as any).profiles?.full_name,
    };
  }

  /**
   * Gets a single order by public order_number (e.g. for guest checkout success page).
   */
  static async getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
    const admin = getSupabaseAdminClient();
    const { data: order, error } = await admin
      .from('orders')
      .select('*, order_items(*), profiles(email, full_name)')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error || !order) return null;

    return {
      ...order,
      customer_email: (order as any).shipping_address?.recipient_email || (order as any).profiles?.email,
      customer_name: (order as any).shipping_address?.recipient_name || (order as any).profiles?.full_name,
    };
  }

  /**
   * Generates a direct WhatsApp link pre-filled with the order reference,
   * product name, and secure payment link for customer outreach.
   */
  static generateWhatsAppLink(
    order: { customer_phone?: string | null; customer_name?: string | null; order_number: string },
    productName: string,
    paymentUrl: string
  ): string {
    const rawPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? `27${rawPhone.slice(1)}` : rawPhone;
    const customerFirstName = (order.customer_name || 'there').split(' ')[0];
    const message = `Hey ${customerFirstName}! Great news from Dissafyt: The batch drop for "${productName}" has reached its goal and is entering production! Settle your order #${order.order_number} here to lock in your priority dispatch: ${paymentUrl}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Fetches all batch pre-orders for a given product ID, complete with sizing matrix breakdown.
   */
  static async getBatchOrdersForProduct(productId: string): Promise<{
    product: any;
    orders: any[];
    sizeBreakdown: Record<string, number>;
    colorBreakdown: Record<string, number>;
    totalUnits: number;
    totalCommittedValue: number;
    target: number;
  }> {
    const admin = getSupabaseAdminClient();
    const { data: product } = await admin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) {
      throw new Error('Product not found');
    }

    // Get all order items for this product that belong to active/reserved/paid orders
    const { data: items } = await admin
      .from('order_items')
      .select('*, order:orders(*)')
      .eq('product_id', productId);

    const validItems = (items || []).filter((item: any) => {
      const status = item.order?.status;
      return [
        'preorder_reserved',
        'batch_payment_requested',
        'paid',
        'deposit_paid',
        'processing',
        'completed',
        'shipped',
      ].includes(status);
    });

    const sizeBreakdown: Record<string, number> = {};
    const colorBreakdown: Record<string, number> = {};
    const siteUrl = getCanonicalSiteUrl();

    let totalUnits = 0;
    let totalCommittedValue = 0;
    const ordersMap = new Map<string, any>();

    for (const item of validItems) {
      const qty = Number(item.quantity) || 1;
      totalUnits += qty;
      totalCommittedValue += Number(item.total_price) || 0;

      // Extract size & color from product_name (e.g. "Hoodie - Black / L" or "Hoodie - L")
      const nameParts = (item.product_name || '').split(' - ');
      const variantDesc = nameParts[1] || '';
      if (variantDesc.includes('/')) {
        const [color, size] = variantDesc.split('/').map((s: string) => s.trim());
        if (size) sizeBreakdown[size] = (sizeBreakdown[size] || 0) + qty;
        if (color) colorBreakdown[color] = (colorBreakdown[color] || 0) + qty;
      } else if (variantDesc) {
        sizeBreakdown[variantDesc] = (sizeBreakdown[variantDesc] || 0) + qty;
      } else {
        sizeBreakdown['Standard'] = (sizeBreakdown['Standard'] || 0) + qty;
      }

      if (item.order && !ordersMap.has(item.order.id)) {
        const paymentUrl = `${siteUrl}/pay/preorder?order=${item.order.order_number}&token=${item.order.payment_link_token || item.order.id}`;
        const whatsappLink = this.generateWhatsAppLink(item.order, product.name, paymentUrl);

        ordersMap.set(item.order.id, {
          ...item.order,
          paymentUrl,
          whatsappLink,
          items: [item],
        });
      } else if (item.order) {
        ordersMap.get(item.order.id).items.push(item);
      }
    }

    return {
      product,
      orders: Array.from(ordersMap.values()),
      sizeBreakdown,
      colorBreakdown,
      totalUnits,
      totalCommittedValue,
      target: Number(product.preorder_target) || 50,
    };
  }

  /**
   * Notifies all customers in a batch that the batch target has been reached,
   * sending branded emails with their personal payment links and returning WhatsApp links.
   */
  static async notifyBatchCustomers(productId: string): Promise<{
    success: boolean;
    notifiedCount: number;
    orders: any[];
    error?: string;
  }> {
    const admin = getSupabaseAdminClient();
    try {
      const { product, orders, target } = await this.getBatchOrdersForProduct(productId);

      let notifiedCount = 0;
      const results: any[] = [];

      for (const order of orders) {
        // Skip already fully paid orders
        if (order.status === 'paid' || order.deposit_status === 'fully_settled') {
          results.push({ orderId: order.id, status: 'already_paid' });
          continue;
        }

        const paymentUrl = order.paymentUrl;
        const customerEmail = order.customer_email || (order.shipping_address as any)?.recipient_email;
        const customerName = order.customer_name || (order.shipping_address as any)?.recipient_name || 'Collector';

        if (customerEmail) {
          try {
            await EmailService.sendBatchUnlockedPaymentNotice({
              orderNumber: order.order_number,
              customerName,
              customerEmail,
              productName: product.name,
              target,
              totalAmount: Number(order.total),
              paymentUrl,
            });
            notifiedCount++;
          } catch (mailErr) {
            console.error(`Failed to send batch email to ${customerEmail}:`, mailErr);
          }
        }

        // Mark order as batch_payment_requested with notification timestamp
        await admin
          .from('orders')
          .update({
            status: 'batch_payment_requested',
            batch_notified_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        results.push({
          orderId: order.id,
          orderNumber: order.order_number,
          customerName,
          customerEmail,
          whatsappLink: order.whatsappLink,
          status: 'notified',
        });
      }

      // Update product batch_status to batch_filled
      await admin
        .from('products')
        .update({ batch_status: 'batch_filled' })
        .eq('id', productId);

      return {
        success: true,
        notifiedCount,
        orders: results,
      };
    } catch (err: any) {
      console.error('Error in notifyBatchCustomers:', err);
      return { success: false, notifiedCount: 0, orders: [], error: err.message };
    }
  }
}
