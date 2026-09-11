import { NextRequest, NextResponse } from 'next/server';
import { PayfastService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/payfast-payload
 * Generates canonically signed PayFast transaction payload for instant WhatsApp Pay-Me links.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, order_id, amount, item_name, customer_name, customer_email, customer_phone } = body;

    const isProd = process.env.NODE_ENV === 'production';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (isProd ? 'https://dissafyt.com' : 'http://localhost:3000');
    const merchantId = process.env.PAYFAST_MERCHANT_ID || process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '17675995';

    let resolvedAmount = Number(amount || 0);
    let resolvedItemName = item_name || 'Dissafyt Studio Payment';
    let relatedId = booking_id || order_id || `pm-${Date.now()}`;
    let relatedType = booking_id ? 'booking' : 'order';

    // If booking_id provided, fetch exact details from database
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

      if (booking) {
        resolvedAmount = Number(booking.total_amount || booking.service?.price || resolvedAmount);
        resolvedItemName = `Ace of Fyt: ${booking.service?.name || 'Haircut'}`;
      }
    }

    if (resolvedAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    const nameParts = (customer_name || 'Customer').trim().split(' ');
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
      email_address: customer_email || 'client@dissafyt.com',
      ...(customer_phone ? { cell_number: customer_phone } : {}),
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
