import { NextRequest, NextResponse } from 'next/server';
import { AuthService, PayfastService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PLAN_CONFIGS: Record<
  string,
  { name: string; price: number; description: string }
> = {
  solo: {
    name: 'The Solo',
    price: 100.0,
    description: '1 haircut per month with priority booking.',
  },
  twice: {
    name: 'The Regular',
    price: 180.0,
    description: '2 haircuts per month with queue skip and priority booking.',
  },
  'father-son': {
    name: 'Father n Son',
    price: 180.0,
    description: '1 combo cut per month for father and son.',
  },
};

/**
 * POST /api/subscriptions/subscribe
 * Creates or initiates a barbershop recurring subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required. Please sign in or register.' }, { status: 401 });
    }

    const authCtx = await AuthService.verifyToken(token);
    if (!authCtx) {
      return NextResponse.json({ error: 'Invalid or expired session. Please log in again.' }, { status: 401 });
    }

    const body = await request.json();
    const { planCode = 'twice', isSandboxDemo = false } = body;

    const plan = PLAN_CONFIGS[planCode];
    if (!plan) {
      return NextResponse.json({ error: `Unknown plan code: ${planCode}` }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();

    // Fetch user's profile for autofilling first/last name and phone
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

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // If sandbox demo activation is requested (for instant staging/testing without external card swipe)
    if (isSandboxDemo) {
      const { data: subRecord, error: subErr } = await admin
        .from('subscriptions')
        .insert({
          user_id: authCtx.userId,
          plan_code: planCode,
          plan_name: plan.name,
          price: plan.price,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          payfast_token: `sandbox_token_${Date.now()}`,
        })
        .select()
        .single();

      // Also record in payments table
      await admin.from('payments').insert({
        user_id: authCtx.userId,
        provider: 'payfast',
        provider_reference: `sandbox_pf_${Date.now()}`,
        amount: plan.price,
        currency: 'ZAR',
        status: 'paid',
        related_type: 'subscription',
        related_id: subRecord?.id || authCtx.userId,
      });

      return NextResponse.json({
        success: true,
        activatedImmediately: true,
        subscription: subRecord,
        message: `Activated ${plan.name} membership!`,
      });
    }

    // Standard PayFast recurring subscription form payload
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const merchantId =
      process.env.PAYFAST_MERCHANT_ID || process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '17675995';
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || 'c08hjtdezifi4';

    const payfastData: Record<string, string> = {
      cmd: '_paynow',
      receiver: merchantId,
      return_url: `${siteUrl}/book?subscribed=true&plan=${planCode}`,
      cancel_url: `${siteUrl}/book?cancelled=true`,
      notify_url: `${siteUrl}/api/payments/payfast-notify`,
      amount: plan.price.toFixed(2),
      item_name: `Ace of Fyt - ${plan.name}`,
      item_description: plan.description,
      subscription_type: '1',
      recurring_amount: plan.price.toFixed(2),
      cycles: '12',
      frequency: '3', // Monthly
      name_first: firstName,
      name_last: lastName,
      email_address: email,
      ...(cellNumber ? { cell_number: cellNumber } : {}),
      custom_str1: planCode,
      custom_str2: authCtx.userId,
    };

    const signature = PayfastService.generateSignature(payfastData);

    return NextResponse.json({
      success: true,
      activatedImmediately: false,
      payfast: {
        action: process.env.PAYFAST_ENVIRONMENT || 'https://payment.payfast.io/eng/process',
        fields: {
          ...payfastData,
          signature,
        },
      },
    });
  } catch (err: any) {
    console.error('Subscription setup error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
