import { NextRequest, NextResponse } from 'next/server';
import { AuthService, PayfastService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/subscriptions/change-plan
 * Customer self-service upgrade/downgrade between membership tiers.
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

    const body = await request.json().catch(() => ({}));
    const { targetPlanCode, isSandboxDemo = false } = body;

    if (!targetPlanCode || typeof targetPlanCode !== 'string') {
      return NextResponse.json(
        { error: 'Target plan code is required.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();

    // 1. Fetch live service definition from database
    const { data: targetService, error: serviceErr } = await admin
      .from('services')
      .select('*')
      .eq('is_subscription', true)
      .eq('is_active', true)
      .eq('plan_code', targetPlanCode)
      .maybeSingle();

    if (serviceErr || !targetService) {
      return NextResponse.json(
        { error: `Selected membership plan (${targetPlanCode}) is not available in our CMS.` },
        { status: 400 }
      );
    }

    // 2. Fetch existing subscription
    const { data: currentSub } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', authCtx.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentSub && currentSub.plan_code === targetPlanCode && currentSub.status === 'active') {
      return NextResponse.json(
        { error: `You are already subscribed to ${targetService.name}.` },
        { status: 400 }
      );
    }

    // If sandbox demo mode, or activating directly
    if (isSandboxDemo || !currentSub?.payfast_token || currentSub.payfast_token.startsWith('sandbox_') || currentSub.payfast_token.startsWith('PF_CONFIRM_')) {
      let updatedSub = null;

      if (currentSub) {
        const { data, error: updateErr } = await admin
          .from('subscriptions')
          .update({
            plan_code: targetPlanCode,
            plan_name: targetService.name,
            price: Number(targetService.price),
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentSub.id)
          .select()
          .single();

        if (updateErr) throw updateErr;
        updatedSub = data;
      } else {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const { data, error: createErr } = await admin
          .from('subscriptions')
          .insert({
            user_id: authCtx.userId,
            plan_code: targetPlanCode,
            plan_name: targetService.name,
            price: Number(targetService.price),
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            payfast_token: `sandbox_switch_${Date.now()}`,
          })
          .select()
          .single();

        if (createErr) throw createErr;
        updatedSub = data;
      }

      // Record audit log
      try {
        await admin.from('audit_logs').insert({
          actor_id: authCtx.userId,
          actor_email: authCtx.email || 'customer@dissafyt.com',
          actor_role: 'customer',
          action: 'subscription.change_plan',
          entity_type: 'subscription',
          entity_id: updatedSub.id,
          entity_name: targetService.name,
          changes: {
            previous_plan: currentSub?.plan_code || 'none',
            new_plan: targetPlanCode,
            new_price: targetService.price,
            mode: 'sandbox_or_direct',
          },
        });
      } catch (auditErr) {
        console.warn('Subscription change audit log error:', auditErr);
      }

      return NextResponse.json({
        success: true,
        switchedImmediately: true,
        subscription: updatedSub,
        message: `Your membership has been updated to ${targetService.name}!`,
      });
    }

    // Live PayFast recurring checkout flow for new plan
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', authCtx.userId)
      .single();

    const email = authCtx.email || profile?.email || '';
    const fullName = profile?.full_name || (email ? email.split('@')[0] : 'Member');
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || 'Member';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';
    const cellNumber = profile?.phone || '';

    const isProd = process.env.NODE_ENV === 'production';
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : isProd ? 'https://dissafyt.com' : 'http://localhost:3000');
    const merchantId =
      process.env.PAYFAST_MERCHANT_ID || process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '17675995';
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || 'c08hjtdezifi4';

    const payfastData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${siteUrl}/account?updated_plan=${targetPlanCode}`,
      cancel_url: `${siteUrl}/account?cancelled_switch=true`,
      notify_url: `${siteUrl}/api/payments/payfast-notify`,
      name_first: firstName,
      name_last: lastName,
      email_address: email,
      ...(cellNumber ? { cell_number: cellNumber } : {}),
      m_payment_id: `switch_${authCtx.userId.slice(0, 8)}_${Date.now()}`,
      amount: Number(targetService.price).toFixed(2),
      item_name: `Ace of Fyt - ${targetService.name}`,
      item_description: targetService.description || `Ace of Fyt Barbershop Recurring Membership`,
      custom_str1: targetPlanCode,
      custom_str2: authCtx.userId,
      subscription_type: '1',
      recurring_amount: Number(targetService.price).toFixed(2),
      frequency: '3', // Monthly
      cycles: '0',    // Indefinite
    };

    const payfast = PayfastService.createTransactionPayload(payfastData);

    return NextResponse.json({
      success: true,
      switchedImmediately: false,
      payfast,
    });
  } catch (err: any) {
    console.error('Subscription change plan error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
