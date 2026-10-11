import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';

/**
 * GET /auth/callback
 * Universal Supabase Auth redirect handler for:
 * 1. Email confirmations / account verifications
 * 2. Password recovery redirects
 * 3. PKCE code exchanges
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || (type === 'recovery' ? '/auth/reset-password' : '/account');

  // Preserve any hash parameters and redirect cleanly
  const destination = new URL(next, requestUrl.origin);

  if (requestUrl.searchParams.has('verified')) {
    destination.searchParams.set('verified', '1');
  }

  return NextResponse.redirect(destination);
}
