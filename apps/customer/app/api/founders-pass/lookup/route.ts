import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/founders-pass/lookup?query=...
 * Looks up Founder Passes by customer phone, email, name, or pass number.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() || '';

    if (!query) {
      return NextResponse.json({ success: true, passes: [] });
    }

    const admin = getSupabaseAdminClient();

    let dbQuery = admin
      .from('founder_passes')
      .select('*')
      .or(
        `pass_number.ilike.%${query}%,customer_name.ilike.%${query}%,customer_email.ilike.%${query}%,customer_phone.ilike.%${query}%`
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
