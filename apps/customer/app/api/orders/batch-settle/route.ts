import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { PayfastService, getCanonicalSiteUrl } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/orders/batch-settle?order=DIS-2026-XXXX&token=UUID
 * Authoritatively retrieves pre-order details for batch settlement page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('order');
  const token = searchParams.get('token');

  if (!orderNumber) {
    return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  let query = admin
    .from('orders')
    .select('id, order_number, status, subtotal, total, deposit_paid, balance_due, deposit_status, fulfillment_choice, customer_name, customer_email, customer_phone, payment_link_token, shipping_address, created_at, order_items(*)')
    .eq('order_number', orderNumber);

  if (token) {
    query = query.eq('payment_link_token', token);
  }

  const { data: order, error } = await query.maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found or invalid settlement link token' }, { status: 404 });
  }

  const total = Number(order.total);
  const depositAmount = Math.round(total * 0.5 * 100) / 100;

  return NextResponse.json({
    order,
    total,
    depositAmount,
    isAlreadyPaid: order.status === 'paid' || order.deposit_status === 'fully_settled',
    isDepositPaid: order.deposit_status === 'deposit_paid',
  });
}

/**
 * POST /api/orders/batch-settle
 * Generates PayFast checkout payload for full or 50% deposit payment.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, token, settlementOption } = body;

    if (!orderNumber) {
      return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    let query = admin
      .from('orders')
      .select('id, order_number, user_id, status, total, customer_name, customer_email, customer_phone, payment_link_token, shipping_address')
      .eq('order_number', orderNumber);

    if (token) {
      query = query.eq('payment_link_token', token);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found or invalid security token' }, { status: 404 });
    }

    const total = Number(order.total);
    const isHalfDeposit = settlementOption === 'deposit_50';
    const amountToPay = isHalfDeposit ? Math.round(total * 0.5 * 100) / 100 : total;

    const siteUrl = getCanonicalSiteUrl();
    const merchantId = process.env.PAYFAST_MERCHANT_ID || process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '17675995';

    const customerName = order.customer_name || (order.shipping_address as any)?.recipient_name || 'Customer';
    const nameParts = customerName.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';
    const email = order.customer_email || (order.shipping_address as any)?.recipient_email;
    const phone = order.customer_phone || (order.shipping_address as any)?.recipient_phone;

    const itemName = isHalfDeposit
      ? `Dissafyt Drop Batch 50% Deposit #${order.order_number}`
      : `Dissafyt Drop Order Settle #${order.order_number}`;

    const payfastData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY || 'c08hjtdezifi4',
      return_url: `${siteUrl}/checkout/success?order=${order.order_number}&settled=1`,
      cancel_url: `${siteUrl}/pay/preorder?order=${order.order_number}&token=${order.payment_link_token || ''}&cancelled=1`,
      notify_url: `${siteUrl}/api/payments/payfast-notify`,
      name_first: firstName,
      ...(lastName ? { name_last: lastName } : {}),
      ...(email ? { email_address: email } : {}),
      ...(phone ? { cell_number: phone } : {}),
      m_payment_id: order.id,
      amount: amountToPay.toFixed(2),
      item_name: itemName,
      custom_str1: order.id,
      custom_str2: order.user_id || '',
      custom_str3: isHalfDeposit ? 'deposit_50' : 'full',
    };

    const payfast = PayfastService.createTransactionPayload(payfastData);

    return NextResponse.json({
      success: true,
      amount: amountToPay,
      settlementOption: isHalfDeposit ? 'deposit_50' : 'full',
      payfast,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Settlement failed' }, { status: 500 });
  }
}
