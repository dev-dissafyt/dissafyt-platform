import { NextRequest, NextResponse } from 'next/server';
import { AuthService, BarbershopService, PayfastService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings
 * Retrieves the appointments for the authenticated customer.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
    }

    const authCtx = await AuthService.verifyToken(token);
    if (!authCtx) {
      return NextResponse.json({ error: 'Unauthorized: invalid or expired session' }, { status: 401 });
    }

    const bookings = await BarbershopService.getCustomerBookings(authCtx.userId);
    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error('Failed to get customer bookings:', error);
    return NextResponse.json({ error: 'Failed to retrieve bookings' }, { status: 500 });
  }
}

/**
 * POST /api/bookings
 * Creates a new barbershop appointment with dual payment support (PayFast online vs Pay in Chair).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Please sign in or create an account to book an appointment.' },
        { status: 401 }
      );
    }

    const authCtx = await AuthService.verifyToken(token);
    if (!authCtx) {
      return NextResponse.json({ error: 'Unauthorized: invalid or expired session' }, { status: 401 });
    }

    const body = await request.json();
    const { service_id, staff_id, start_time, notes, payment_choice } = body;

    if (!service_id || !start_time) {
      return NextResponse.json(
        { error: 'Service ID and Start Time are required.' },
        { status: 400 }
      );
    }

    const result = await BarbershopService.createBooking({
      customer_id: authCtx.userId,
      service_id,
      staff_id: staff_id || null,
      start_time,
      notes,
      payment_choice: payment_choice || 'payfast',
    });

    if (!result.success || !result.booking) {
      return NextResponse.json({ error: result.error || 'Failed to confirm booking' }, { status: 400 });
    }

    // If customer selected PayFast and appointment requires upfront payment, generate PayFast form redirect
    let payfast: any = null;
    if (payment_choice === 'payfast' && result.booking.status === 'pending' && Number(result.booking.total_amount) > 0) {
      const isProd = process.env.NODE_ENV === 'production';
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : isProd ? 'https://dissafyt.com' : 'http://localhost:3000');
      const merchantId = process.env.PAYFAST_MERCHANT_ID || process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '17675995';

      const admin = getSupabaseAdminClient();
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', authCtx.userId)
        .maybeSingle();

      const { data: serviceData } = await admin
        .from('services')
        .select('name')
        .eq('id', service_id)
        .maybeSingle();

      const nameParts = (profile?.full_name || authCtx.email || 'Customer').trim().split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payfastData: Record<string, string> = {
        merchant_id: merchantId,
        merchant_key: process.env.PAYFAST_MERCHANT_KEY || 'c08hjtdezifi4',
        return_url: `${siteUrl}/book?confirmed_booking=${result.booking.id}&paid=1`,
        cancel_url: `${siteUrl}/book?cancelled_booking=${result.booking.id}`,
        notify_url: `${siteUrl}/api/payments/payfast-notify`,
        m_payment_id: result.booking.id,
        amount: Number(result.booking.total_amount).toFixed(2),
        item_name: `Dissafyt Cut: ${serviceData?.name || 'Haircut'}`,
        name_first: firstName,
        ...(lastName ? { name_last: lastName } : {}),
        email_address: profile?.email || authCtx.email || '',
        ...(profile?.phone ? { cell_number: profile.phone } : {}),
        custom_str1: result.booking.id,
        custom_str2: authCtx.userId,
        custom_str3: 'booking',
      };

      const signature = PayfastService.generateSignature(payfastData);

      payfast = {
        action: process.env.PAYFAST_ENVIRONMENT || 'https://payment.payfast.io/eng/process',
        fields: {
          ...payfastData,
          signature,
        },
      };
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      payfast,
    });
  } catch (error: any) {
    console.error('Failed to create booking:', error);
    return NextResponse.json({ error: error.message || 'Internal error creating booking' }, { status: 500 });
  }
}
