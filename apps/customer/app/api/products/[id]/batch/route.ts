import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/products/[id]/batch
 * Returns batch reservation details, sizing matrix, and customer orders for admin review.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth(request, 'order:view');
  if (isAuthFailure(auth)) return auth;

  try {
    const data = await OrderService.getBatchOrdersForProduct(params.id);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load batch data' }, { status: 400 });
  }
}

/**
 * POST /api/products/[id]/batch
 * Dispatches batch unlock notification emails and returns direct WhatsApp links.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth(request, 'product:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const result = await OrderService.notifyBatchCustomers(params.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to notify batch customers' }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Notification dispatch failed' }, { status: 500 });
  }
}
