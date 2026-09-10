import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/orders/lookup?orderNumber=DIS-2026-XXXX
 * Public order lookup endpoint for post-checkout confirmation
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('orderNumber');

  if (!orderNumber) {
    return NextResponse.json({ error: 'orderNumber parameter is required' }, { status: 400 });
  }

  const order = await OrderService.getOrderByNumber(orderNumber);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    subtotal: order.subtotal,
    total: order.total,
    created_at: order.created_at,
    shipping_address: order.shipping_address,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    order_items: (order as any).order_items || [],
  });
}
