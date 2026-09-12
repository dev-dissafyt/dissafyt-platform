import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';

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
      // 3. Dispatch branded luxury email via Resend
      const resendApiKey =
        process.env.RESEND_API_KEY ||
        process.env.RESEND_API;

      if (resendApiKey) {
        try {
          const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Dissafyt Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 40px 20px; }
    .container { max-width: 540px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 36px; }
    .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #f59e0b; text-transform: uppercase; margin-bottom: 24px; display: inline-block; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #f59e0b; color: #000000 !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .btn-container { margin: 28px 0; text-align: center; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #27272a; font-size: 12px; color: #71717a; text-align: center; font-family: monospace; }
    .alt-link { font-size: 11px; word-break: break-all; color: #71717a; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">DISSAFYT // ACE OF FYT</div>
    <h1>Reset Your Password</h1>
    <p>We received a request to reset your password for your Dissafyt account. Click the button below to set a new password:</p>
    <div class="btn-container">
      <a href="${actionLink}" class="btn" target="_blank">Reset My Password</a>
    </div>
    <p>This password reset link will expire in 1 hour. If you did not make this request, you can safely ignore this email — your account remains completely secure.</p>
    <div class="alt-link">
      If the button above does not work, copy and paste this link into your browser:<br/>
      <a href="${actionLink}" style="color: #f59e0b;">${actionLink}</a>
    </div>
    <div class="footer">
      Dissafyt Platform • Cape Town Flagship • Western Cape, South Africa<br/>
      Encrypted 256-Bit Sovereign Authentication
    </div>
  </div>
</body>
</html>
          `;

          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Dissafyt Cape Town <onboarding@resend.dev>',
              to: [cleanEmail],
              subject: 'Reset your Dissafyt password',
              html: emailHtml,
            }),
          });

          if (!emailRes.ok) {
            const errData = await emailRes.json().catch(() => ({}));
            console.error('[ForgotPassword] Resend API error:', emailRes.status, errData);
          } else {
            console.log(`[ForgotPassword] Password reset email sent to ${cleanEmail} via Resend.`);
          }
        } catch (mailErr) {
          console.error('[ForgotPassword] Error sending via Resend:', mailErr);
        }
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
