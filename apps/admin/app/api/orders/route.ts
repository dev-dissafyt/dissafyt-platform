import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/orders
 * Returns all platform orders (requires order:view).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'order:view');
  if (isAuthFailure(auth)) return auth;

  const orders = await OrderService.listAdminOrders();
  return NextResponse.json(orders);
}
