import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { AuditService, GUEST_USER_ID } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

export interface PosItem {
  type: 'service' | 'product';
  id: string; // serviceId or productId
  variant_id?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PosCheckoutRequest {
  items: PosItem[];
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_id?: string | null;
  staff_id?: string | null;
  payment_method: 'card_machine' | 'cash' | 'qr';
  slip_reference?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const operatorEmail =
      request.cookies.get('dissafyt_pos_operator')?.value ||
      request.cookies.get('dissafyt_admin_email')?.value ||
      'pos-operator@dissafyt.com';

    const body: PosCheckoutRequest = await request.json();
    const {
      items,
      customer_name,
      customer_phone,
      customer_email,
      customer_id,
      staff_id,
      payment_method,
      slip_reference,
      notes,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty.' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const userId = customer_id || GUEST_USER_ID;

    // 1. Inventory Validation & Stock Decrement for Products
    const productItems = items.filter((i) => i.type === 'product');
    const serviceItems = items.filter((i) => i.type === 'service');

    for (const pItem of productItems) {
      if (!pItem.variant_id) {
        return NextResponse.json(
          { success: false, error: `Variant ID missing for ${pItem.name}` },
          { status: 400 }
        );
      }

      const { data: variant, error: vErr } = await admin
        .from('product_variants')
        .select('id, name, stock_quantity')
        .eq('id', pItem.variant_id)
        .single();

      if (vErr || !variant) {
        return NextResponse.json(
          { success: false, error: `Product variant not found: ${pItem.name}` },
          { status: 404 }
        );
      }

      if (variant.stock_quantity < pItem.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for ${pItem.name} (${variant.name}). Available: ${variant.stock_quantity}, Requested: ${pItem.quantity}`,
          },
          { status: 400 }
        );
      }

      // Decrement stock immediately
      const newStock = Math.max(0, variant.stock_quantity - pItem.quantity);
      const { error: updErr } = await admin
        .from('product_variants')
        .update({ stock_quantity: newStock })
        .eq('id', pItem.variant_id);

      if (updErr) {
        console.error('Failed to decrement stock for variant:', pItem.variant_id, updErr);
      }
    }

    // 2. Compute Totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal;
    const ticketNumber = `POS-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    // 3. Create Retail Order (if products sold)
    let createdOrder: any = null;
    if (productItems.length > 0) {
      const { data: order, error: oErr } = await admin
        .from('orders')
        .insert({
          user_id: userId,
          order_number: ticketNumber,
          status: 'completed',
          subtotal: productItems.reduce((s, i) => s + i.price * i.quantity, 0),
          total: productItems.reduce((s, i) => s + i.price * i.quantity, 0),
          shipping_address: {
            method: 'in_store_pos',
            studio: 'Dissafyt Studio, Cape Town',
            operator: operatorEmail,
            customer_name: customer_name || 'Walk-In Client',
            customer_phone: customer_phone || null,
          },
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select()
        .single();

      if (oErr) {
        console.error('Failed to create POS order:', oErr);
      } else {
        createdOrder = order;

        // Insert order items
        const orderItemsPayload = productItems.map((pi) => ({
          order_id: order.id,
          product_id: pi.id,
          variant_id: pi.variant_id,
          product_name: pi.name,
          unit_price: pi.price,
          quantity: pi.quantity,
          total_price: pi.price * pi.quantity,
        }));

        await admin.from('order_items').insert(orderItemsPayload);
      }
    }

    // 4. Create Service Appointment Booking (if services sold)
    const createdBookings: any[] = [];
    for (const sItem of serviceItems) {
      for (let i = 0; i < sItem.quantity; i++) {
        const { data: booking, error: bErr } = await admin
          .from('bookings')
          .insert({
            customer_id: userId,
            service_id: sItem.id,
            staff_id: staff_id || null,
            start_time: nowIso,
            end_time: new Date(Date.now() + 30 * 60000).toISOString(),
            status: 'completed',
            total_amount: sItem.price,
            payment_status: 'paid_in_chair',
            is_subscription_covered: false,
            notes: `Walk-in POS: ${ticketNumber} (Method: ${payment_method}, Operator: ${operatorEmail}${slip_reference ? `, Slip #${slip_reference}` : ''})`,
            created_at: nowIso,
            updated_at: nowIso,
          })
          .select()
          .single();

        if (!bErr && booking) {
          createdBookings.push(booking);
        } else {
          console.error('Failed to record POS booking:', bErr);
        }
      }
    }

    // 5. Insert Audited Payment Ledger Entry
    const slipAuth = slip_reference ? slip_reference.trim() : null;
    const providerRef = slipAuth ? `PF-POS-${slipAuth}` : `POS-${ticketNumber}`;

    const { data: paymentRecord, error: pErr } = await admin
      .from('payments')
      .insert({
        user_id: userId,
        provider: 'payfast',
        provider_reference: providerRef,
        amount: total,
        currency: 'ZAR',
        status: 'paid',
        related_type: productItems.length > 0 ? 'order' : 'booking',
        related_id: createdOrder?.id || createdBookings[0]?.id || ticketNumber,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single();

    if (pErr) {
      console.warn('POS payment record insert warning:', pErr.message);
    }

    // 6. Record Immutable Audit Log
    try {
      await AuditService.recordLog({
        actor_email: operatorEmail,
        actor_role: 'staff',
        action: 'pos.walk_in_sale',
        entity_type: 'pos_transaction',
        entity_id: ticketNumber,
        entity_name: `Walk-in Ticket ${ticketNumber}`,
        changes: {
          total,
          items_count: items.length,
          payment_method,
          slip_reference: slipAuth,
          barber_id: staff_id,
          order_id: createdOrder?.id,
          booking_ids: createdBookings.map((b) => b.id),
        },
      });
    } catch (auditErr) {
      console.warn('Failed to write POS audit log:', auditErr);
    }

    return NextResponse.json({
      success: true,
      ticket_number: ticketNumber,
      order_id: createdOrder?.id || null,
      booking_ids: createdBookings.map((b) => b.id),
      payment_reference: providerRef,
      total,
      operator: operatorEmail,
      timestamp: nowIso,
    });
  } catch (err: any) {
    console.error('POS Checkout Exception:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Checkout processing failed' },
      { status: 500 }
    );
  }
}
