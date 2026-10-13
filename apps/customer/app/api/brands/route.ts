import { NextRequest, NextResponse } from 'next/server';
import { BrandService } from '@dissafyt/api';
import { requireStudioAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const brands = await BrandService.listBrands();
  return NextResponse.json(brands);
}

export async function POST(request: NextRequest) {
  const auth = await requireStudioAuth(request, ['admin', 'creator']);
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Brand name must be at least 2 characters.' }, { status: 400 });
    }

    let commissionRate = body.commission_rate !== undefined ? Number(body.commission_rate) : 20.0;
    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 50.0) {
      return NextResponse.json({ error: 'Commission rate must be between 0% and 50%.' }, { status: 400 });
    }

    const result = await BrandService.createBrand(
      {
        ...body,
        name,
        commission_rate: commissionRate,
        user_id: auth.userId || null,
      },
      { email: auth.email, role: auth.role }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.brand, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
