import { NextRequest, NextResponse } from 'next/server';
import { BrandService } from '@dissafyt/api';
import { requireStudioAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireStudioAuth(request, ['admin', 'creator']);
  if (isAuthFailure(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const requestedBrandId = searchParams.get('brandId');

  let effectiveBrandId = requestedBrandId || auth.brandId || 'b0000000-0000-0000-0000-000000000001';
  if (auth.role === 'creator') {
    const creatorOwnBrandId = auth.brandId || 'b0000000-0000-0000-0000-000000000001';
    if (requestedBrandId && requestedBrandId !== creatorOwnBrandId) {
      return NextResponse.json({ error: 'Forbidden: Access to other brand payout records is prohibited.' }, { status: 403 });
    }
    effectiveBrandId = creatorOwnBrandId;
  }

  try {
    const data = await BrandService.getCreatorPayouts(effectiveBrandId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStudioAuth(request, ['admin', 'creator']);
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const { brandId, amount, banking } = body;

    let effectiveBrandId = brandId || auth.brandId;
    if (auth.role === 'creator') {
      const creatorOwnBrandId = auth.brandId || 'b0000000-0000-0000-0000-000000000001';
      if (brandId && brandId !== creatorOwnBrandId) {
        return NextResponse.json({ error: 'Forbidden: Cannot submit payout for another creator brand.' }, { status: 403 });
      }
      effectiveBrandId = creatorOwnBrandId;
    }

    const payoutAmount = Number(amount);
    if (!Number.isFinite(payoutAmount) || payoutAmount < 500) {
      return NextResponse.json({ error: 'Minimum payout threshold is R500.00' }, { status: 400 });
    }

    if (!banking || !banking.bank_name || !banking.account_number || !banking.account_holder) {
      return NextResponse.json({ error: 'Complete South African banking details are required for payout.' }, { status: 400 });
    }

    const result = await BrandService.requestPayout(effectiveBrandId, payoutAmount, banking, {
      email: auth.email,
      role: auth.role,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
