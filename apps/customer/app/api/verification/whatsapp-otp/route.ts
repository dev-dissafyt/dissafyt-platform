import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { WhatsAppService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';

const OTP_SECRET = process.env.WHATSAPP_ACCESS_TOKEN || process.env.PAYFAST_PASSPHRASE || 'dissafyt-otp-secret-2026';

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
  if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
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

      // If userId supplied, mark profile phone verified
      if (userId) {
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
