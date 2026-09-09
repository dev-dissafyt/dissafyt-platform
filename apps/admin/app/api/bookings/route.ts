import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings
 * Filters bookings by date, staffId, or status.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const staffId = searchParams.get('staffId') || undefined;
    const status = searchParams.get('status') || undefined;

    const bookings = await AdminBarbershopService.listBookings({
      date,
      staffId,
      status,
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error('Failed to list admin bookings:', error);
    return NextResponse.json({ error: error.message || 'Failed to list bookings' }, { status: 500 });
  }
}

/**
 * PATCH /api/bookings
 * Updates booking status (confirmed, completed, cancelled, no_show).
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, payment_status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const result = await AdminBarbershopService.updateBookingStatus(id, status, payment_status);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update booking status' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
