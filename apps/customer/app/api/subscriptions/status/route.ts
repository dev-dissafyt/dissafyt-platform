import { NextRequest, NextResponse } from 'next/server';
import { AuthService, BarbershopService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/subscriptions/status
 * Returns current authenticated user's active membership/subscription status and live quota.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ hasActiveSubscription: false, subscription: null, quota: null });
    }

    const authCtx = await AuthService.verifyToken(token);
    if (!authCtx) {
      return NextResponse.json({ hasActiveSubscription: false, subscription: null, quota: null });
    }

    const quota = await BarbershopService.getCustomerSubscriptionQuota(authCtx.userId);

    if (!quota.hasActiveSubscription || !quota.subscription) {
      return NextResponse.json({
        hasActiveSubscription: false,
        subscription: null,
        quota: null,
      });
    }

    return NextResponse.json({
      hasActiveSubscription: true,
      subscription: quota.subscription,
      quota: {
        total_cuts: quota.totalCuts,
        used_cuts: quota.usedCuts,
        available_cuts: quota.availableCuts,
        plan_code: quota.planCode,
        plan_name: quota.planName,
        period_start: quota.periodStart,
        period_end: quota.periodEnd,
        can_book_covered: quota.canBookCovered,
      },
    });
  } catch (err: any) {
    console.error('Subscription status check error:', err);
    return NextResponse.json(
      { hasActiveSubscription: false, subscription: null, quota: null, error: err.message },
      { status: 500 }
    );
  }
}
