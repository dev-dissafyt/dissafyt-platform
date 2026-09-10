import { getSupabaseAdminClient, Order, OrderItem, OrderStatus } from '@dissafyt/database';
import { StudioService } from '../studio/studio-service';
import { BrandService } from '../studio/brand-service';

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
  items: CreateOrderItemInput[];
  shipping_address: any;
  shipping_method?: string;
  shipping_cost?: number;
  payment_method?: string;
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
          .select('id, name, base_price, is_active, brand_id, is_custom_print, print_placement, design_file_url, mockup_url')
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
      const orderItemsToInsert: {
        id?: string;
        product_id: string;
        variant_id?: string | null;
        product_name: string;
        unit_price: number;
        quantity: number;
        total_price: number;
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
          if (variant.stock_quantity < item.quantity) {
            return { success: false, error: `Insufficient stock for ${productName} (${variant.name}). Available: ${variant.stock_quantity}` };
          }
          if (variant.price_override !== null && variant.price_override !== undefined && Number(variant.price_override) > 0) {
            unitPrice = Number(variant.price_override);
          }
          productName = `${productName} - ${variant.name}`;
        }

        const totalPrice = unitPrice * item.quantity;
        orderSubtotal += totalPrice;

        orderItemsToInsert.push({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          product_name: productName,
          unit_price: unitPrice,
          quantity: item.quantity,
          total_price: totalPrice,
        });
      }

      // 2. Insert into orders table with valid user_id
      const orderNumber = this.generateOrderNumber();
      let order: any = null;

      try {
        const { data: dbOrder, error: orderErr } = await admin
          .from('orders')
          .insert({
            user_id: userId,
            order_number: orderNumber,
            status: 'pending_payment',
            subtotal: orderSubtotal,
            total: orderSubtotal + (input.shipping_cost || 0),
            shipping_address: input.shipping_address,
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

    if (order.status === 'paid') {
      return { success: true };
    }

    // Authoritative payment amount verification
    // Must satisfy gross payment >= order total (with 0.05 margin for currency rounding)
    if (amountPaid < Number(order.total) - 0.05) {
      console.warn(`Payment underpaid for order ${order.id}: received R${amountPaid}, expected R${order.total}`);
      await admin
        .from('orders')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      return { success: false, error: `Payment underpaid: received R${amountPaid}, required R${order.total}` };
    }

    // Mark order as paid
    const { error: updateErr } = await admin
      .from('orders')
      .update({
        status: 'paid',
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

    return { success: true };
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
   * Updates fulfillment state of an order.
   */
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
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
}
