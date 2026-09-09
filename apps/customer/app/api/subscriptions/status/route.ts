import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/subscriptions/status
 * Returns current authenticated user's active membership/subscription status.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ hasActiveSubscription: false, subscription: null });
    }

    const authCtx = await AuthService.verifyToken(token);
    if (!authCtx) {
      return NextResponse.json({ hasActiveSubscription: false, subscription: null });
    }

    const admin = getSupabaseAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Check public.subscriptions table
    try {
      const { data: subs, error: subErr } = await admin
        .from('subscriptions')
        .select('*')
        .eq('user_id', authCtx.userId)
        .eq('status', 'active')
        .gte('current_period_end', nowIso)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!subErr && subs && subs.length > 0) {
        return NextResponse.json({
          hasActiveSubscription: true,
          subscription: subs[0],
        });
      }
    } catch (e) {
      console.warn('Subscriptions table query failed, attempting payment fallback:', e);
    }

    // 2. Fallback check on public.payments for recent paid subscription
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: payments, error: payErr } = await admin
        .from('payments')
        .select('*')
        .eq('user_id', authCtx.userId)
        .eq('related_type', 'subscription')
        .eq('status', 'paid')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!payErr && payments && payments.length > 0) {
        const p = payments[0];
        return NextResponse.json({
          hasActiveSubscription: true,
          subscription: {
            id: p.id,
            user_id: p.user_id,
            plan_code: 'twice',
            plan_name: 'The Regular Membership',
            price: p.amount,
            status: 'active',
            current_period_start: p.created_at,
            current_period_end: new Date(new Date(p.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        });
      }
    } catch (e) {
      console.warn('Payments fallback query error:', e);
    }

    return NextResponse.json({
      hasActiveSubscription: false,
      subscription: null,
    });
  } catch (err: any) {
    console.error('Subscription status check error:', err);
    return NextResponse.json({ hasActiveSubscription: false, subscription: null, error: err.message }, { status: 500 });
  }
}
