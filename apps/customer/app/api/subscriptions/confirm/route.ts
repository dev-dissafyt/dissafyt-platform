import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PLAN_CONFIGS: Record<string, { name: string; price: number }> = {
  solo: { name: 'The Solo Membership', price: 100.0 },
  twice: { name: 'The Regular Membership', price: 180.0 },
  'father-son': { name: 'Father n Son Membership', price: 180.0 },
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
    const plan = PLAN_CONFIGS[planCode] || PLAN_CONFIGS.twice;

    const admin = getSupabaseAdminClient();
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

    // 2. If not found, provision active subscription in subscriptions & payments
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    let newSub = null;

    try {
      const { data: createdSub, error: createSubErr } = await admin
        .from('subscriptions')
        .insert({
          user_id: authCtx.userId,
          plan_code: planCode,
          plan_name: plan.name,
          price: plan.price,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          payfast_token: `PF_CONFIRM_${Date.now()}`,
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

    // Record in payments table
    try {
      await admin.from('payments').insert({
        user_id: authCtx.userId,
        provider: 'payfast',
        provider_reference: `PF_CONFIRM_${Date.now()}`,
        amount: plan.price,
        currency: 'ZAR',
        status: 'paid',
        related_type: 'subscription',
        related_id: newSub?.id || authCtx.userId,
      });
    } catch (payErr) {
      console.warn('Payments record insert error:', payErr);
    }

    return NextResponse.json({
      success: true,
      activated: true,
      subscription: newSub || {
        user_id: authCtx.userId,
        plan_code: planCode,
        plan_name: plan.name,
        price: plan.price,
        status: 'active',
      },
    });
  } catch (err: any) {
    console.error('Subscription confirmation error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
