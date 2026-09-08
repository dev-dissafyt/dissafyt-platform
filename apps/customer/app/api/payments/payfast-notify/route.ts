import { NextRequest, NextResponse } from 'next/server';
import { PayfastService, PayfastNotifyPayload } from '@dissafyt/api';

/**
 * POST /api/payments/payfast-notify
 * PayFast Instant Transaction Notification (ITN) webhook handler.
 */
export async function POST(request: NextRequest) {
  try {
    let payload: PayfastNotifyPayload = {};

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    } else {
      payload = await request.json();
    }

    console.log('Received PayFast ITN webhook for order:', payload.custom_str1 || payload.m_payment_id);

    const result = await PayfastService.handleWebhook(payload);
    if (!result.success) {
      console.warn('PayFast ITN validation failed:', result.message);
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    console.log('PayFast ITN successfully processed:', result.message);
    return new NextResponse('OK', { status: 200 });
  } catch (err: any) {
    console.error('PayFast ITN Handler error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
