import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { WhatsAppService, AuthService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';

const OTP_SECRET =
  process.env.WHATSAPP_ACCESS_TOKEN ||
  process.env.PAYFAST_PASSPHRASE ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'dissafyt_secure_runtime_hmac_anchor';

// In-memory rate limiting map: phone -> array of timestamps
const OTP_SEND_RATE_LIMIT = new Map<string, number[]>();

function checkRateLimit(phone: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxAttempts = 3;

  const timestamps = (OTP_SEND_RATE_LIMIT.get(phone) || []).filter((ts) => now - ts < windowMs);

  if (timestamps.length >= maxAttempts) {
    const oldest = timestamps[0];
    const waitSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  timestamps.push(now);
  OTP_SEND_RATE_LIMIT.set(phone, timestamps);
  return { allowed: true };
}

function signOtp(phone: string, code: string, expiresAt: number): string {
  const data = `${phone}:${code}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');
  return `${expiresAt}.${hmac}`;
}

function verifyOtpSignature(phone: string, code: string, token: string): { valid: boolean; error?: string } {
  const [expiresStr, hmac] = token.split('.');
  const expiresAt = parseInt(expiresStr, 10);

  if (isNaN(expiresAt) || !hmac) {
    return { valid: false, error: 'Malformed verification token' };
  }

  if (Date.now() > expiresAt) {
    return { valid: false, error: 'Verification code has expired. Please request a new one.' };
  }

  const expectedHmac = crypto.createHmac('sha256', OTP_SECRET).update(`${phone}:${code}:${expiresAt}`).digest('hex');
  if (hmac.length === expectedHmac.length && crypto.timingSafeEqual(Buffer.from(hmac, 'utf8'), Buffer.from(expectedHmac, 'utf8'))) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid verification code.' };
}

/**
 * POST /api/verification/whatsapp-otp
 * Handles sending and verifying WhatsApp OTPs for client verification.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, code, token, userId } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const formattedPhone = WhatsAppService.formatPhoneNumber(phone);

    // =========================================================================
    // ACTION: SEND
    // =========================================================================
    if (action === 'send') {
      const rateLimit = checkRateLimit(formattedPhone);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: `Too many verification requests. Please wait ${rateLimit.waitSeconds} seconds before trying again.` },
          { status: 429 }
        );
      }

      // Generate random 6-digit code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      const verificationToken = signOtp(formattedPhone, otpCode, expiresAt);

      const sendResult = await WhatsAppService.sendVerificationCode(formattedPhone, otpCode);
      if (!sendResult.success) {
        return NextResponse.json({ error: sendResult.error || 'Failed to dispatch WhatsApp OTP' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        token: verificationToken,
        expiresAt,
        message: 'Verification code dispatched to your WhatsApp.',
      });
    }

    // =========================================================================
    // ACTION: VERIFY
    // =========================================================================
    if (action === 'verify') {
      if (!code || !token) {
        return NextResponse.json({ error: 'Code and verification token are required' }, { status: 400 });
      }

      const verification = verifyOtpSignature(formattedPhone, code.trim(), token);
      if (!verification.valid) {
        return NextResponse.json({ error: verification.error }, { status: 400 });
      }

      // If userId supplied, verify caller's session before updating profile phone
      if (userId) {
        const authHeader = request.headers.get('Authorization');
        const jwt =
          (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null) ||
          request.cookies.get('dissafyt_admin_token')?.value ||
          null;

        if (jwt) {
          const authCtx = await AuthService.verifyToken(jwt);
          const isCallerOrAdmin =
            authCtx &&
            (authCtx.userId === userId ||
              (authCtx.roles || []).includes('admin') ||
              (authCtx.roles || []).includes('staff') ||
              authCtx.email === 'curtislee@dissafyt.com' ||
              authCtx.email === 'dissafyt@gmail.com');

          if (isCallerOrAdmin) {
            try {
              const admin = getSupabaseAdminClient();
              await admin
                .from('profiles')
                .update({ phone: formattedPhone, updated_at: new Date().toISOString() })
                .eq('id', userId);
            } catch {
              // non-blocking
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Phone number successfully verified via WhatsApp.',
      });
    }

    return NextResponse.json({ error: 'Invalid action. Supported: "send" or "verify"' }, { status: 400 });
  } catch (err: any) {
    console.error('WhatsApp OTP error:', err);
    return NextResponse.json({ error: err.message || 'Internal error processing verification' }, { status: 500 });
  }
}
