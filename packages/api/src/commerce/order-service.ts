import { getSupabaseAdminClient, Order, OrderItem, OrderStatus } from '@dissafyt/database';

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
}

export interface CreateOrderInput {
  user_id: string;
  items: CreateOrderItemInput[];
  shipping_address: ShippingAddress;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  customer_email?: string;
  customer_name?: string;
}

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
   * Creates an order authoritatively: validates prices from DB and reserves inventory.
   */
  static async createOrder(input: CreateOrderInput): Promise<{ success: boolean; order?: OrderWithItems; error?: string }> {
    const admin = getSupabaseAdminClient();

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'Order must contain at least one item' };
    }

    try {
      // 1. Fetch product & variant details to compute authoritative prices
      const productIds = input.items.map((i) => i.product_id);
      const { data: products, error: prodErr } = await admin
        .from('products')
        .select('id, name, base_price, is_active')
        .in('id', productIds);

      if (prodErr || !products) {
        return { success: false, error: 'Failed to load product pricing information' };
      }

      // Fetch variants if applicable
      const variantIds = input.items.filter((i) => i.variant_id).map((i) => i.variant_id);
      let variants: any[] = [];
      if (variantIds.length > 0) {
        const { data: vData } = await admin
          .from('product_variants')
          .select('id, name, price_override, stock_quantity')
          .in('id', variantIds);
        variants = vData || [];
      }

      // Calculate totals
      let orderSubtotal = 0;
      const orderItemsToInsert: {
        product_id: string;
        variant_id?: string | null;
        product_name: string;
        unit_price: number;
        quantity: number;
        total_price: number;
      }[] = [];

      for (const item of input.items) {
        const product = products.find((p) => p.id === item.product_id);
        if (!product || !product.is_active) {
          return { success: false, error: `Product is no longer available` };
        }

        let unitPrice = Number(product.base_price);
        let productName = product.name;

        if (item.variant_id) {
          const variant = variants.find((v) => v.id === item.variant_id);
          if (variant) {
            if (variant.stock_quantity < item.quantity) {
              return { success: false, error: `Insufficient stock for ${product.name} (${variant.name})` };
            }
            if (variant.price_override) {
              unitPrice = Number(variant.price_override);
            }
            productName = `${product.name} - ${variant.name}`;
          }
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

      // 2. Insert into orders table
      const orderNumber = this.generateOrderNumber();
      const { data: order, error: orderErr } = await admin
        .from('orders')
        .insert({
          user_id: input.user_id,
          order_number: orderNumber,
          status: 'pending_payment',
          subtotal: orderSubtotal,
          total: orderSubtotal,
          shipping_address: input.shipping_address,
        })
        .select()
        .single();

      if (orderErr || !order) {
        return { success: false, error: orderErr?.message || 'Failed to initialize order' };
      }

      // 3. Insert items into order_items
      const itemsPayload = orderItemsToInsert.map((item) => ({
        ...item,
        order_id: order.id,
      }));

      const { data: insertedItems, error: itemsErr } = await admin
        .from('order_items')
        .insert(itemsPayload)
        .select();

      if (itemsErr) {
        console.error('Failed to insert order items:', itemsErr);
      }

      // 4. Decrement inventory stock
      for (const item of input.items) {
        if (item.variant_id) {
          const variant = variants.find((v) => v.id === item.variant_id);
          if (variant) {
            await admin
              .from('product_variants')
              .update({ stock_quantity: Math.max(0, variant.stock_quantity - item.quantity) })
              .eq('id', item.variant_id);
          }
        }
      }

      return {
        success: true,
        order: {
          ...order,
          order_items: insertedItems || [],
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
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
      customer_email: o.profiles?.email || 'Guest',
      customer_name: o.profiles?.full_name || 'Customer',
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
      customer_email: (order as any).profiles?.email,
      customer_name: (order as any).profiles?.full_name,
    };
  }
}
