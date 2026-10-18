import { NextRequest, NextResponse } from 'next/server';
import { BatchBudgetService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/batches
 * Returns real-time working capital analytics, procurement matrices, order breakdown,
 * and the directory list of all pre-order batches.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId') || undefined;
    const analytics = await BatchBudgetService.getBatchAnalytics(batchId);
    const batches = await BatchBudgetService.listBatches();

    return NextResponse.json({
      success: true,
      analytics,
      batches,
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
      batch_code: body.batch_code || undefined,
      status: body.status || undefined,
      contingency_buffer_pct: body.contingency_buffer_pct !== undefined ? Number(body.contingency_buffer_pct) : undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
    });

    const analytics = await BatchBudgetService.getBatchAnalytics(batchId);
    const batches = await BatchBudgetService.listBatches();

    return NextResponse.json({
      success: true,
      batch: updated,
      analytics,
      batches,
    });
  } catch (err: any) {
    console.error('[Admin Batch API] PATCH error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update batch' }, { status: 500 });
  }
}

/**
 * POST /api/batches
 * Handles batch actions & CRUD operations:
 *  - action: 'create_batch' -> Creates a new pre-order batch
 *  - action: 'set_active' -> Activates a specific batch as the primary pre-order pool
 *  - action: 'delete_batch' -> Deletes an empty batch
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

    // 1. Create a new pre-order batch
    if (action === 'create_batch') {
      const { batch_name, batch_code, capital_budget, contingency_buffer_pct, is_active } = body;
      if (!batch_name || !batch_code) {
        return NextResponse.json({ error: 'batch_name and batch_code are required' }, { status: 400 });
      }

      const created = await BatchBudgetService.createBatch({
        batch_name,
        batch_code,
        capital_budget: capital_budget ? Number(capital_budget) : 10000,
        contingency_buffer_pct: contingency_buffer_pct ? Number(contingency_buffer_pct) : 5,
        is_active: Boolean(is_active),
      });

      const analytics = await BatchBudgetService.getBatchAnalytics(created.id);
      const batches = await BatchBudgetService.listBatches();

      return NextResponse.json({
        success: true,
        batch: created,
        analytics,
        batches,
      });
    }

    // 2. Set an existing batch as active
    if (action === 'set_active') {
      if (!batchId) return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
      const updated = await BatchBudgetService.setActiveBatch(batchId);
      const analytics = await BatchBudgetService.getBatchAnalytics(batchId);
      const batches = await BatchBudgetService.listBatches();
      return NextResponse.json({ success: true, batch: updated, analytics, batches });
    }

    // 3. Delete an empty batch
    if (action === 'delete_batch') {
      if (!batchId) return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
      const delRes = await BatchBudgetService.deleteBatch(batchId);
      if (!delRes.success) {
        return NextResponse.json({ error: delRes.error }, { status: 400 });
      }
      const activeBatch = await BatchBudgetService.getActiveBatch();
      const analytics = await BatchBudgetService.getBatchAnalytics(activeBatch.id);
      const batches = await BatchBudgetService.listBatches();
      return NextResponse.json({ success: true, analytics, batches });
    }

    // 4. Dispatch 48h settlement notifications
    if (action === 'notify_settlement') {
      if (!batchId) return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
      const result = await BatchBudgetService.notifyBatchCustomers(batchId);
      return NextResponse.json(result);
    }

    // 5. Release ghost spot and promote waitlist
    if (action === 'release_ghost') {
      if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
      const result = await BatchBudgetService.releaseGhostSpot(orderId);
      return NextResponse.json(result);
    }

    // 6. Force unlock batch for production
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

/**
 * DELETE /api/batches
 * Direct deletion of an empty batch by batchId query param.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'product:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    if (!batchId) return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });

    const delRes = await BatchBudgetService.deleteBatch(batchId);
    if (!delRes.success) {
      return NextResponse.json({ error: delRes.error }, { status: 400 });
    }

    const batches = await BatchBudgetService.listBatches();
    return NextResponse.json({ success: true, batches });
  } catch (err: any) {
    console.error('[Admin Batch API] DELETE error:', err);
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 });
  }
}
