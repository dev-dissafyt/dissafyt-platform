import { NextRequest, NextResponse } from 'next/server';
import { BatchBudgetService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/batches
 * Returns real-time working capital analytics, procurement matrices, and order breakdown.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId') || undefined;
    const analytics = await BatchBudgetService.getBatchAnalytics(batchId);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err: any) {
    console.error('[Admin Batch API] GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load batch data' }, { status: 500 });
  }
}

/**
 * PATCH /api/batches
 * Updates batch budget cap, status, or parameters.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'product:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const batchId = body.batchId;
    if (!batchId) {
      return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
    }

    const updated = await BatchBudgetService.updateBatchSettings(batchId, {
      capital_budget: body.capital_budget !== undefined ? Number(body.capital_budget) : undefined,
      batch_name: body.batch_name || undefined,
      status: body.status || undefined,
      contingency_buffer_pct: body.contingency_buffer_pct !== undefined ? Number(body.contingency_buffer_pct) : undefined,
    });

    const analytics = await BatchBudgetService.getBatchAnalytics(batchId);

    return NextResponse.json({
      success: true,
      batch: updated,
      analytics,
    });
  } catch (err: any) {
    console.error('[Admin Batch API] PATCH error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update batch' }, { status: 500 });
  }
}

/**
 * POST /api/batches
 * Handles batch actions:
 *  - action: 'notify_settlement' -> Dispatches 48h settlement links via email & WhatsApp
 *  - action: 'release_ghost' -> Cancels expired unconfirmed order and promotes waitlist
 *  - action: 'force_unlock' -> Marks batch as batch_filled to proceed with partial production
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'order:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const { action, batchId, orderId } = body;

    if (action === 'notify_settlement') {
      if (!batchId) return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
      const result = await BatchBudgetService.notifyBatchCustomers(batchId);
      return NextResponse.json(result);
    }

    if (action === 'release_ghost') {
      if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      const result = await BatchBudgetService.releaseGhostSpot(orderId);
      return NextResponse.json(result);
    }

    if (action === 'force_unlock') {
      if (!batchId) return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
      const updated = await BatchBudgetService.updateBatchSettings(batchId, {
        status: 'batch_filled',
      });
      return NextResponse.json({ success: true, batch: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Admin Batch API] POST error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
