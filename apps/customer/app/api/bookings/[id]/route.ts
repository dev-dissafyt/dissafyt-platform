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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
