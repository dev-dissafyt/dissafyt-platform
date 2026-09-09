import { NextRequest, NextResponse } from 'next/server';
import { AuthService, OrderService, PayfastService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/orders
 * Retrieves orders for the authenticated user
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
  }

  const authCtx = await AuthService.verifyToken(token);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized: invalid or expired session' }, { status: 401 });
  }

  const orders = await OrderService.getUserOrders(authCtx.userId);
  return NextResponse.json(orders);
}

/**
 * POST /api/orders
 * Creates an order in PostgreSQL and generates PayFast checkout payload
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let userId = '00000000-0000-0000-0000-000000000000';
    if (token) {
      const authCtx = await AuthService.verifyToken(token);
      if (authCtx) userId = authCtx.userId;
    }

    const body = await request.json();
    const { items, shippingAddress } = body;

    if (!items || !items.length || !shippingAddress) {
      return NextResponse.json({ error: 'Items and shippingAddress are required' }, { status: 400 });
    }

    const result = await OrderService.createOrder({
      user_id: userId,
      items,
      shipping_address: shippingAddress,
    });

    if (!result.success || !result.order) {
      return NextResponse.json({ error: result.error || 'Failed to create order' }, { status: 400 });
    }

    const order = result.order;

    // Generate PayFast payload with MD5 signature
    const isProd = process.env.NODE_ENV === 'production';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : isProd ? 'https://dissafyt.com' : 'http://localhost:3000');
    const merchantId = process.env.PAYFAST_MERCHANT_ID || process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '17675995';

    // Extract customer details from shippingAddress for PayFast prefill
    const recipientName = (shippingAddress.recipient_name || '').trim();
    const nameParts = recipientName ? recipientName.split(' ') : ['Customer'];
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';
    const recipientPhone = shippingAddress.recipient_phone || '';
    const recipientEmail = shippingAddress.recipient_email || '';

    const payfastData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY || 'c08hjtdezifi4',
      return_url: `${siteUrl}/account?order=${order.order_number}&status=success`,
      cancel_url: `${siteUrl}/checkout?cancelled=1`,
      notify_url: `${siteUrl}/api/payments/payfast-notify`,
      m_payment_id: order.id,
      amount: Number(order.total).toFixed(2),
      item_name: `Dissafyt Order ${order.order_number}`,
      name_first: firstName,
      ...(lastName ? { name_last: lastName } : {}),
      ...(recipientEmail ? { email_address: recipientEmail } : {}),
      ...(recipientPhone ? { cell_number: recipientPhone } : {}),
      custom_str1: order.id,
      custom_str2: userId,
    };

    const signature = PayfastService.generateSignature(payfastData);

    return NextResponse.json({
      order,
      payfast: {
        action: process.env.PAYFAST_ENVIRONMENT || 'https://payment.payfast.io/eng/process',
        fields: {
          ...payfastData,
          signature,
        },
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
