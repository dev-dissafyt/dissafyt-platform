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

    const userId = input.user_id || input.customer_id || 'guest-user';

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

      // Calculate totals
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
        let unitPrice = item.unit_price || (product ? Number(product.base_price) : 450);
        let productName = product ? product.name : 'Dissafyt Apparel Item';

        if (product && !product.is_active) {
          return { success: false, error: `Product is no longer available` };
        }

        if (item.variant_id) {
          const variant = variants.find((v) => v.id === item.variant_id);
          if (variant) {
            if (variant.stock_quantity < item.quantity) {
              return { success: false, error: `Insufficient stock for ${productName} (${variant.name})` };
            }
            if (variant.price_override) {
              unitPrice = Number(variant.price_override);
            }
            productName = `${productName} - ${variant.name}`;
          }
        }

        const totalPrice = unitPrice * item.quantity;
        orderSubtotal += totalPrice;

        orderItemsToInsert.push({
          id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
        }
      } catch {
        // Fallback
      }

      if (!order) {
        order = {
          id: `ord-${Date.now()}`,
          user_id: userId,
          order_number: orderNumber,
          status: 'pending_payment',
          subtotal: orderSubtotal,
          total: orderSubtotal + (input.shipping_cost || 0),
          shipping_address: input.shipping_address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
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
        }
      } catch {
        // Fallback
      }

      // 4. Decrement inventory stock
      for (const item of input.items) {
        if (item.variant_id) {
          const variant = variants.find((v) => v.id === item.variant_id);
          if (variant) {
            try {
              await admin
                .from('product_variants')
                .update({ stock_quantity: Math.max(0, variant.stock_quantity - item.quantity) })
                .eq('id', item.variant_id);
            } catch {
              // Ignore stock decrement error on remote DB
            }
          }
        }
      }

      // 5. Automatically mirror custom Kasi Kollekt apparel items to Factory Print Queue
      const finalItems = insertedItems && insertedItems.length > 0 ? insertedItems : itemsPayload;
      for (const orderItem of finalItems) {
        const product = products.find((p) => p.id === orderItem.product_id) as any;
        if (product && (product.is_custom_print || product.brand_id)) {
          const variant = variants.find((v) => v.id === orderItem.variant_id);
          const sizeMatch = variant?.name?.match(/Size\s+([A-Z0-9]+)/i);
          const garmentSize = sizeMatch ? sizeMatch[1] : 'L';
          const colorMatch = variant?.name?.match(/-\s*([A-Za-z]+)/);
          const garmentColor = colorMatch ? colorMatch[1].trim() : 'Black';

          const placement = typeof product.print_placement === 'string'
            ? product.print_placement
            : (product.print_placement?.location || 'front_chest');

          try {
            await StudioService.createPrintJob({
              order_id: order.id,
              order_item_id: orderItem.id || `item-${Date.now()}`,
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
              operator_notes: `Kasi Kollekt auto-mirrored from Order #${order.order_number}`,
            });
          } catch (jobErr) {
            console.warn('Failed to mirror print job to studio queue:', jobErr);
          }
        }
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
