import { NextRequest, NextResponse } from 'next/server';
import { AuthService, BarbershopService } from '@dissafyt/api';

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
 * Creates a new barbershop appointment.
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
    const { service_id, staff_id, start_time, notes } = body;

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
    });

    if (!result.success || !result.booking) {
      return NextResponse.json({ error: result.error || 'Failed to confirm booking' }, { status: 400 });
    }

    return NextResponse.json({ success: true, booking: result.booking });
  } catch (error: any) {
    console.error('Failed to create booking:', error);
    return NextResponse.json({ error: error.message || 'Internal error creating booking' }, { status: 500 });
  }
}
