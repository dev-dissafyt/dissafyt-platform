import { NextRequest, NextResponse } from 'next/server';
import { FounderPassService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/founders-pass
 * Retrieves current campaign settings, buildout stats, and all issued founder passes.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  try {
    const [settings, stats, passes] = await Promise.all([
      FounderPassService.getCampaignSettings(),
      FounderPassService.getBuildoutStats(),
      FounderPassService.listPasses(),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      stats,
      passes,
    });
  } catch (err: any) {
    console.error('Error fetching admin founder pass data:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/founders-pass
 * Updates campaign parameters: price_per_pass, total_cuts, total_spots, capital_target, is_active.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'service:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const updated = await FounderPassService.updateCampaignSettings(
      {
        price_per_pass: body.price_per_pass !== undefined ? Number(body.price_per_pass) : undefined,
        total_cuts: body.total_cuts !== undefined ? Number(body.total_cuts) : undefined,
        total_spots: body.total_spots !== undefined ? Number(body.total_spots) : undefined,
        capital_target: body.capital_target !== undefined ? Number(body.capital_target) : undefined,
        is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      },
      auth.email
    );

    const stats = await FounderPassService.getBuildoutStats();

    return NextResponse.json({
      success: true,
      settings: updated,
      stats,
    });
  } catch (err: any) {
    console.error('Error updating founder pass campaign settings:', err);
    return NextResponse.json({ error: err.message || 'Failed to update campaign parameters' }, { status: 400 });
  }
}

/**
 * POST /api/founders-pass
 * Manually grant or record a founder pass from the admin console.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'service:create');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    if (!body.email || !body.name || !body.phone) {
      return NextResponse.json({ error: 'Name, email, and phone are required' }, { status: 400 });
    }

    const result = await FounderPassService.createPass({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      isPaid: Boolean(body.isPaid),
      paymentMethod: body.paymentMethod || 'manual_grant',
      paymentRef: body.paymentRef || `MANUAL-${Date.now()}`,
      notes: body.notes ? `Admin grant by ${auth.email}: ${body.notes}` : `Admin grant by ${auth.email}`,
    });

    if (!result.success || !result.pass) {
      return NextResponse.json({ error: result.error || 'Failed to create pass' }, { status: 400 });
    }

    return NextResponse.json({ success: true, pass: result.pass }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating admin founder pass:', err);
    return NextResponse.json({ error: err.message || 'Failed to create pass' }, { status: 500 });
  }
}
