import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { AuditService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * High-speed server-side registration handler.
 * Creates authenticated Supabase user directly via administrative API with email_confirm: true.
 * This completely prevents the 35-second 504 Gateway Timeout caused by Supabase SMTP delivery failures.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, phone } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (fullName || '').trim() || 'Dissafyt Member';
    const cleanPhone = (phone || '').trim();

    const admin = getSupabaseAdminClient();

    // Direct, high-speed user creation with pre-confirmed email (immune to SMTP timeouts)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        phone: cleanPhone,
      },
    });

    if (createErr) {
      if (
        createErr.message.toLowerCase().includes('already registered') ||
        createErr.status === 422
      ) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    // Ensure profile has phone number recorded
    if (created?.user?.id && cleanPhone) {
      void admin
        .from('profiles')
        .update({ phone: cleanPhone })
        .eq('id', created.user.id)
        .then();
    }

    // Asynchronously record audit log without blocking response
    void AuditService.recordLog({
      actor_email: cleanEmail,
      actor_role: 'customer',
      action: 'customer.registered',
      entity_type: 'profile',
      entity_id: created?.user?.id || 'new_user',
      changes: { email: cleanEmail, fullName: cleanName, phone: cleanPhone },
    }).catch((err) => console.warn('Audit record warning:', err));

    return NextResponse.json({
      success: true,
      user: {
        id: created.user.id,
        email: created.user.email,
        full_name: cleanName,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}
