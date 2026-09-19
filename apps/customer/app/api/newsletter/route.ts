import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { AuthService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/newsletter
 * Captures email for VIP drop alerts and newsletter broadcasts.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
    const source = typeof body.source === 'string' ? body.source.trim() : 'website_footer';

    if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const email = rawEmail.toLowerCase();
    const admin = getSupabaseAdminClient();

    const { data, error } = await admin
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          source: source || 'website_footer',
          status: 'subscribed',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) {
      console.error('Newsletter subscription upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to record subscription. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "You're on the VIP Drop List!",
      subscriber: data,
    });
  } catch (err: any) {
    console.error('Newsletter subscription error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/newsletter
 * Admin-authenticated list of all newsletter subscribers.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'user:view');
  if (isAuthFailure(auth)) return auth;

  try {
    const admin = getSupabaseAdminClient();
    const { data: subscribers, error, count } = await admin
      .from('newsletter_subscribers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscribers:', error);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    return NextResponse.json({
      total: count || (subscribers ? subscribers.length : 0),
      subscribers: subscribers || [],
    });
  } catch (err: any) {
    console.error('Newsletter fetch error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
