import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/orders/[id]/settle
 * Settles the outstanding balance of a pre-order (in-person POS or online balance clearance).
 * Requires staff or admin role.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth(request, 'order:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const orderId = params.id;
    const body = await request.json();
    const { amountPaid, paymentMethod, notes } = body;

    if (!amountPaid || Number(amountPaid) <= 0) {
      return NextResponse.json({ error: 'Valid amountPaid is required' }, { status: 400 });
    }

    const result = await OrderService.settleOrderBalance({
      orderId,
      amountPaid: Number(amountPaid),
      paymentMethod: paymentMethod || 'pos_card',
      operatorEmail: auth.email || 'pos-operator@dissafyt.com',
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      message: 'Order balance successfully settled and completed.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Settlement failed' }, { status: 500 });
  }
}
