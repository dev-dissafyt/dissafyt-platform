import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/subscriptions/cancel
 * Customer self-service cancellation of active barbershop membership.
 * Retains quota until current_period_end per billing best practices.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const authCtx = await AuthService.verifyToken(token);
    if (!authCtx) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdminClient();

    // 1. Find the active subscription
    const { data: sub, error: fetchErr } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', authCtx.userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !sub) {
      return NextResponse.json(
        { error: 'No active membership found to cancel.' },
        { status: 404 }
      );
    }

    // 2. Mark subscription as cancelled
    const { data: updatedSub, error: updateErr } = await admin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Failed to update subscription status:', updateErr);
      return NextResponse.json(
        { error: 'Failed to cancel subscription. Please try again or contact concierge.' },
        { status: 500 }
      );
    }

    // 3. Record audit trail
    try {
      await admin.from('audit_logs').insert({
        actor_id: authCtx.userId,
        actor_email: authCtx.email || 'customer@dissafyt.com',
        actor_role: 'customer',
        action: 'subscription.cancel',
        entity_type: 'subscription',
        entity_id: sub.id,
        entity_name: sub.plan_name,
        changes: {
          previous_status: 'active',
          new_status: 'cancelled',
          current_period_end: sub.current_period_end,
          initiated_by: 'customer_self_service',
        },
      });
    } catch (auditErr) {
      console.warn('Subscription cancel audit log error:', auditErr);
    }

    const periodEndStr = sub.current_period_end
      ? new Date(sub.current_period_end).toLocaleDateString('en-ZA', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'cycle end';

    return NextResponse.json({
      success: true,
      message: `Your membership has been cancelled. You keep access to your remaining haircut quota until ${periodEndStr}.`,
      subscription: updatedSub,
    });
  } catch (err: any) {
    console.error('Subscription cancellation error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
