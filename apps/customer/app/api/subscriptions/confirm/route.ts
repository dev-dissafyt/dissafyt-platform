import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_PLANS: Record<string, { name: string; price: number }> = {
  solo: { name: 'The Solo Membership', price: 100.0 },
  twice: { name: 'The Regular Membership', price: 190.0 },
  executive: { name: 'The Executive', price: 350.0 },
  'father-son': { name: 'Father n Son Membership', price: 190.0 },
};

/**
 * POST /api/subscriptions/confirm
 * Auto-confirms subscription on return from PayFast checkout.
 * Ensures the member immediately has active booking access without waiting for webhook delivery.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authCtx = await AuthService.verifyToken(token);
    if (!authCtx) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const planCode = body.planCode || 'twice';

    const admin = getSupabaseAdminClient();

    // Query active service dynamically from CMS database
    const { data: dbService } = await admin
      .from('services')
      .select('*')
      .eq('is_subscription', true)
      .eq('is_active', true)
      .eq('plan_code', planCode)
      .maybeSingle();

    const plan = dbService
      ? { name: dbService.name, price: Number(dbService.price) }
      : FALLBACK_PLANS[planCode] || FALLBACK_PLANS.twice;
    const nowIso = new Date().toISOString();

    // 1. Check if user already has an active subscription in public.subscriptions
    let existingSub = null;
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
        existingSub = subs[0];
      }
    } catch (e) {
      console.warn('Subscriptions table query warning:', e);
    }

    if (existingSub) {
      return NextResponse.json({
        success: true,
        alreadyActive: true,
        subscription: existingSub,
      });
    }

    // 2. Verify that a legitimate paid subscription payment exists in public.payments
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: verifiedPayment } = await admin
      .from('payments')
      .select('*')
      .eq('user_id', authCtx.userId)
      .eq('status', 'paid')
      .eq('related_type', 'subscription')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      !verifiedPayment ||
      !verifiedPayment.provider_reference ||
      verifiedPayment.provider_reference.startsWith('PF_CONFIRM_') ||
      verifiedPayment.provider_reference.startsWith('sandbox_')
    ) {
      return NextResponse.json(
        {
          success: false,
          activated: false,
          pendingWebhook: true,
          message: 'Awaiting verified PayFast payment notification.',
        },
        { status: 202 }
      );
    }

    // 3. Reconcile active subscription only when backed by a verified PayFast payment
    const payDate = new Date(verifiedPayment.created_at);
    const endDate = new Date(payDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    let newSub = null;

    try {
      const { data: createdSub, error: createSubErr } = await admin
        .from('subscriptions')
        .insert({
          user_id: authCtx.userId,
          plan_code: planCode,
          plan_name: plan.name,
          price: Number(verifiedPayment.amount) || plan.price,
          status: 'active',
          current_period_start: payDate.toISOString(),
          current_period_end: endDate.toISOString(),
          payfast_token: verifiedPayment.provider_reference,
        })
        .select()
        .single();

      if (!createSubErr) {
        newSub = createdSub;
      } else {
        console.warn('Could not insert to subscriptions table:', createSubErr);
      }
    } catch (e) {
      console.warn('Subscriptions insert exception:', e);
    }

    return NextResponse.json({
      success: true,
      activated: Boolean(newSub),
      subscription: newSub,
    });
  } catch (err: any) {
    console.error('Subscription confirmation error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
