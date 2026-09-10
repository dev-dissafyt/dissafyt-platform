import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * PATCH /api/orders/[id]
 * Updates order fulfillment status (requires order:edit).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth(request, 'order:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const id = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const result = await OrderService.updateOrderStatus(id, status, {
      userId: auth.userId,
      email: auth.email,
      role: auth.role,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
