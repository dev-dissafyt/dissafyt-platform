import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings
 * Filters bookings by date, staffId, or status (requires booking:view).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'booking:view');
  if (isAuthFailure(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const staffId = searchParams.get('staffId') || undefined;
    const status = searchParams.get('status') || undefined;
    const locationParam = searchParams.get('locationId') || undefined;
    let targetLocationId = locationParam;
    if (auth.role === 'barbershop_manager' || auth.role === 'barber') {
      targetLocationId = auth.locationId || undefined;
    }

    const bookings = await AdminBarbershopService.listBookings({
      date,
      staffId,
      status,
      locationId: targetLocationId,
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error('Failed to list admin bookings:', error);
    return NextResponse.json({ error: error.message || 'Failed to list bookings' }, { status: 500 });
  }
}

/**
 * PATCH /api/bookings
 * Updates booking status (confirmed, completed, cancelled, no_show) with audit logging (requires booking:edit).
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'booking:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const { id, status, payment_status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // If branch manager, ensure the booking belongs to their assigned location
    if (auth.role === 'barbershop_manager' && auth.locationId) {
      const admin = getSupabaseAdminClient();
      const { data: existing } = await admin
        .from('bookings')
        .select('location_id')
        .eq('id', id)
        .maybeSingle();

      if (existing && existing.location_id && existing.location_id !== auth.locationId) {
        return NextResponse.json(
          { error: 'Forbidden: You cannot modify appointments for other branch locations.' },
          { status: 403 }
        );
      }
    }

    const result = await AdminBarbershopService.updateBookingStatus(
      id,
      status,
      payment_status,
      { email: auth.email, role: auth.role }
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update booking status' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

