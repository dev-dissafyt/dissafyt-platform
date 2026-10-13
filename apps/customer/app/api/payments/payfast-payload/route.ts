import { NextRequest, NextResponse } from 'next/server';
import { PayfastService, getCanonicalSiteUrl } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/payfast-payload
 * Generates canonically signed PayFast transaction payload for instant WhatsApp Pay-Me links.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, order_id, amount, item_name, customer_name, customer_email, customer_phone } = body;

    const siteUrl = getCanonicalSiteUrl();
    const merchantId = process.env.PAYFAST_MERCHANT_ID || process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '17675995';

    let resolvedAmount = 0;
    let resolvedItemName = item_name || 'Dissafyt Studio Payment';
    let relatedId = booking_id || order_id || `pm-${Date.now()}`;
    let relatedType = booking_id ? 'booking' : order_id ? 'order' : 'custom';
    let resolvedCustomerName = customer_name;
    let resolvedCustomerEmail = customer_email;
    let resolvedCustomerPhone = customer_phone;

    // If booking_id provided, fetch exact details authoritatively from database
    if (booking_id) {
      const admin = getSupabaseAdminClient();
      const { data: booking } = await admin
        .from('bookings')
        .select(`
          *,
          service:services(name, price)
        `)
        .eq('id', booking_id)
        .maybeSingle();

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      resolvedAmount = Number(booking.total_amount || booking.service?.price || 0);
      resolvedItemName = `Ace of Fyt: ${booking.service?.name || 'Haircut'}`;
      relatedId = booking.id;
    } else if (order_id) {
      const admin = getSupabaseAdminClient();
      const { data: order } = await admin
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .maybeSingle();

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      const balanceDue = Number(order.balance_due || 0);
      if (order.deposit_status === 'deposit_paid' && balanceDue > 0) {
        resolvedAmount = balanceDue;
        resolvedItemName = `Dissafyt Pre-Order Balance #${order.order_number}`;
      } else {
        resolvedAmount = Number(order.total || 0);
        resolvedItemName = `Dissafyt Order #${order.order_number}`;
      }
      if (order.customer_name) resolvedCustomerName = order.customer_name;
      if (order.customer_email) resolvedCustomerEmail = order.customer_email;
      if (order.customer_phone) resolvedCustomerPhone = order.customer_phone;
      relatedId = order.id;
    } else {
      // Ad-hoc custom Pay-Me amount requires staff/admin authorization
      const auth = await requireAdminAuth(request, 'order:edit');
      if (isAuthFailure(auth)) return auth;
      resolvedAmount = Number(amount || 0);
      relatedId = `pm-${Date.now()}`;
    }

    if (resolvedAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    const nameParts = (resolvedCustomerName || 'Customer').trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payfastData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY || 'c08hjtdezifi4',
      return_url: booking_id
        ? `${siteUrl}/book?confirmed_booking=${booking_id}&paid=1`
        : `${siteUrl}/checkout/success?order_id=${relatedId}`,
      cancel_url: `${siteUrl}/pay?cancelled=1`,
      notify_url: `${siteUrl}/api/payments/payfast-notify`,
      name_first: firstName,
      ...(lastName ? { name_last: lastName } : {}),
      email_address: resolvedCustomerEmail || 'client@dissafyt.com',
      ...(resolvedCustomerPhone ? { cell_number: resolvedCustomerPhone } : {}),
      m_payment_id: relatedId,
      amount: resolvedAmount.toFixed(2),
      item_name: resolvedItemName,
      custom_str1: relatedId,
      custom_str3: relatedType,
    };

    const transaction = PayfastService.createTransactionPayload(payfastData);

    return NextResponse.json({
      success: true,
      amount: resolvedAmount,
      itemName: resolvedItemName,
      payfast: transaction,
    });
  } catch (err: any) {
    console.error('Failed to generate PayFast pay-me payload:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
