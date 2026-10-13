import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/founders-pass/lookup?query=...
 * Looks up Founder Passes by customer phone, email, name, or pass number.
 * Restricted to authenticated POS / studio staff and administrators.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'booking:view');
  if (isAuthFailure(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('query')?.trim() || '';
    const safeQuery = rawQuery.replace(/[,()%_*\\'"]/g, '').trim();

    if (!safeQuery) {
      return NextResponse.json({ success: true, passes: [] });
    }

    const admin = getSupabaseAdminClient();

    const dbQuery = admin
      .from('founder_passes')
      .select('*')
      .or(
        `pass_number.ilike.%${safeQuery}%,customer_name.ilike.%${safeQuery}%,customer_email.ilike.%${safeQuery}%,customer_phone.ilike.%${safeQuery}%`
      )
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: passes, error } = await dbQuery;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const formatted = (passes || []).map((p) => ({
      ...p,
      cuts_remaining: Math.max(0, (p.total_cuts || 12) - (p.cuts_used || 0)),
    }));

    return NextResponse.json({
      success: true,
      passes: formatted,
    });
  } catch (err: any) {
    console.error('Founder pass lookup error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
