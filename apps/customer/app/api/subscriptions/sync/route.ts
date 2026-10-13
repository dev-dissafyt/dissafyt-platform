import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { AuthService, BarbershopService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/subscriptions/sync
 * Self-healing subscription reconciliation endpoint.
 * Synchronizes the member's subscription period and payment status
 * against PayFast API or recent confirmed payment records.
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

    const admin = getSupabaseAdminClient();

    // 1. Fetch user's subscription record
    const { data: sub, error: subErr } = await admin
      .from('subscriptions')
      .select('*')
      .eq('user_id', authCtx.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subErr || !sub) {
      return NextResponse.json({
        success: false,
        message: 'No subscription found for your account to synchronize.',
      }, { status: 404 });
    }

    let synced = false;
    let syncSource = 'none';

    // 2. If payfast_token looks like a real UUID, attempt PayFast API fetch
    const isUuidToken = Boolean(
      sub.payfast_token &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sub.payfast_token)
    );

    const merchantId = process.env.PAYFAST_MERCHANT_ID || '17675995';
    const passphrase = process.env.PAYFAST_PASSPHRASE || 'Diss_fyt_Wat07081';
    const isSandbox = (process.env.PAYFAST_ENVIRONMENT || '').includes('sandbox');

    if (isUuidToken) {
      try {
        const timestamp = new Date().toISOString();
        const baseString = `merchant-id=${merchantId}&timestamp=${timestamp}&version=v1&passphrase=${passphrase}`;
        const signature = crypto.createHash('md5').update(baseString).digest('hex');

        const apiUrl = isSandbox
          ? `https://api.payfast.co.za/subscriptions/${sub.payfast_token}/fetch?testing=true`
          : `https://api.payfast.co.za/subscriptions/${sub.payfast_token}/fetch`;

        const pfRes = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'merchant-id': merchantId,
            version: 'v1',
            timestamp,
            signature,
          },
        });

        if (pfRes.ok) {
          const pfData = await pfRes.json();
          const pfStatus = pfData.data?.status_text?.toLowerCase() || pfData.status?.toLowerCase();

          if (pfStatus === 'active' || pfStatus === 'complete') {
            const nextRun = pfData.data?.next_run ? new Date(pfData.data.next_run) : new Date(Date.now() + 30 * 86400000);
            const periodStart = new Date(nextRun.getTime() - 30 * 86400000);

            await admin
              .from('subscriptions')
              .update({
                status: 'active',
                current_period_start: periodStart.toISOString(),
                current_period_end: nextRun.toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', sub.id);

            synced = true;
            syncSource = 'payfast_api';
          }
        }
      } catch (apiErr) {
        console.warn('PayFast REST API fetch error during sync:', apiErr);
      }
    }

    // 3. Fallback: Check payments table for recent confirmed subscription payments
    if (!synced) {
      const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 86400000).toISOString();
      const expectedMinPrice = Number(sub.price || 100);
      const { data: recentPayments } = await admin
        .from('payments')
        .select('*')
        .eq('user_id', authCtx.userId)
        .eq('status', 'paid')
        .eq('related_type', 'subscription')
        .gte('amount', expectedMinPrice)
        .gte('created_at', thirtyFiveDaysAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentPayments && recentPayments.length > 0) {
        const lastPay = recentPayments[0];
        const payDate = new Date(lastPay.created_at);
        const periodEnd = new Date(payDate.getTime() + 30 * 86400000);

        // If the 30-day period covers today, refresh the subscription
        if (periodEnd.getTime() > Date.now()) {
          await admin
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_start: payDate.toISOString(),
              current_period_end: periodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);

          synced = true;
          syncSource = 'payments_audit';
        }
      }
    }

    // 4. Return live refreshed quota
    const quota = await BarbershopService.getCustomerSubscriptionQuota(authCtx.userId);

    const { data: updatedSub } = await admin
      .from('subscriptions')
      .select('*')
      .eq('id', sub.id)
      .single();

    return NextResponse.json({
      success: true,
      synced,
      syncSource,
      subscription: updatedSub || sub,
      quota: quota.hasActiveSubscription ? {
        total_cuts: quota.totalCuts,
        used_cuts: quota.usedCuts,
        available_cuts: quota.availableCuts,
        plan_code: quota.planCode,
        plan_name: quota.planName,
        period_start: quota.periodStart,
        period_end: quota.periodEnd,
        can_book_covered: quota.canBookCovered,
      } : null,
      message: synced
        ? 'Subscription successfully synchronized with latest billing cycle!'
        : 'Subscription is already up-to-date.',
    });
  } catch (err: any) {
    console.error('Subscription sync handler error:', err);
    return NextResponse.json({ error: err.message || 'Failed to sync subscription' }, { status: 500 });
  }
}
