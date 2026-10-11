import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { EmailService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Resolve baseUrl / origin for redirect
    const host = req.headers.get('host') || 'www.dissafyt.com';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const origin = `${proto}://${host}`;
    const redirectTo = `${origin}/auth/reset-password`;

    // 2. Generate secure recovery link via Supabase Admin (bypasses Supabase SMTP 504 issues)
    const admin = getSupabaseAdminClient();
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo,
      },
    });

    if (linkError) {
      console.warn('[ForgotPassword] Supabase generateLink warning:', linkError.message);
      // For security, do not expose whether an email exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    const actionLink = linkData?.properties?.action_link;

    if (actionLink) {
      // 3. Dispatch branded luxury email via EmailService
      try {
        const mailResult = await EmailService.sendPasswordReset(cleanEmail, actionLink);
        if (!mailResult.success) {
          console.error('[ForgotPassword] EmailService dispatch error:', mailResult.error);
        } else {
          console.log(`[ForgotPassword] Password reset email sent to ${cleanEmail} via Dissafyt Concierge.`);
        }
      } catch (mailErr) {
        console.error('[ForgotPassword] Error sending via EmailService:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (err: unknown) {
    console.error('[ForgotPassword] Unhandled exception:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
