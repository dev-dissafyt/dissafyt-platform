import { NextRequest, NextResponse } from 'next/server';
import { AuthService, BarbershopService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/bookings/[id]
 * Cancels or updates a customer's appointment.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authCtx = await AuthService.verifyToken(token);
    if (!authCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'cancel') {
      const result = await BarbershopService.cancelBooking(params.id, authCtx.userId);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to cancel appointment' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Appointment cancelled successfully' });
    }

    if (action === 'reschedule') {
      const { newStartTime, newStaffId } = body;
      if (!newStartTime) {
        return NextResponse.json({ error: 'newStartTime is required to reschedule' }, { status: 400 });
      }
      const result = await BarbershopService.rescheduleBooking({
        bookingId: params.id,
        customerId: authCtx.userId,
        newStartTime,
        newStaffId,
      });
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Failed to reschedule appointment' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Appointment rescheduled successfully', booking: result.booking });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/bookings/[id]
 * Retrieves a single appointment for the authenticated customer or platform admin.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
      token = request.cookies.get('dissafyt_admin_token')?.value || null;
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authCtx = await AuthService.verifyToken(token);
    if (!authCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = (authCtx.email || '').toLowerCase();
    const isAdmin =
      userEmail === 'curtislee@dissafyt.com' ||
      userEmail === 'dissafyt@gmail.com' ||
      (authCtx.roles || []).includes('admin') ||
      (authCtx.roles || []).includes('staff');

    const adminClient = (await import('@dissafyt/database')).getSupabaseAdminClient();
    const { data: booking, error: bErr } = await adminClient
      .from('bookings')
      .select('*, service:services(*), staff:staff(*), customer:profiles(*), location:locations(*)')
      .eq('id', params.id)
      .maybeSingle();

    if (bErr || !booking) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Ensure regular customers can only view their own bookings
    if (!isAdmin && booking.customer_id !== authCtx.userId) {
      return NextResponse.json({ error: 'Unauthorized to view this appointment' }, { status: 403 });
    }

    // If client returns from PayFast with ?paid=1 and booking is still pending, confirm it immediately
    const { searchParams } = new URL(request.url);
    if (searchParams.get('paid') === '1' && booking.status === 'pending') {
      await adminClient
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid_online',
          notes: 'PayFast checkout completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      booking.status = 'confirmed';
      booking.payment_status = 'paid_online';
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Failed to get booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

