import { NextRequest, NextResponse } from 'next/server';
import { FounderPassService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/founders-pass/redeem
 * Redeems 1 haircut from an active Founder Pass (counter register or staff action).
 * Restricted to authenticated POS / studio staff and administrators.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'booking:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    const passId = body.passId;
    const barberName = body.barberName || auth.email || 'Ace Barber';
    const notes = body.notes || `In-Studio Walk-in Haircut (Operator: ${auth.email})`;

    if (!passId) {
      return NextResponse.json(
        { success: false, error: 'passId is required to redeem a haircut.' },
        { status: 400 }
      );
    }

    const result = await FounderPassService.redeemCut({
      passId,
      barberName,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to redeem cut' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cut #${result.cutNumber} successfully redeemed! ${result.cutsRemaining} cuts remaining.`,
      cutNumber: result.cutNumber,
      cutsRemaining: result.cutsRemaining,
    });
  } catch (err: any) {
    console.error('Founder pass redemption error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
