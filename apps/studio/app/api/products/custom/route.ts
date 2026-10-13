import { NextRequest, NextResponse } from 'next/server';
import { BrandService } from '@dissafyt/api';
import { requireStudioAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireStudioAuth(request, ['admin', 'creator']);
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const basePrice = Number(body.base_price ?? body.price ?? 0);

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Product name must be at least 2 characters.' }, { status: 400 });
    }

    if (!Number.isFinite(basePrice) || basePrice < 150) {
      return NextResponse.json(
        { error: 'Minimum retail price for custom streetwear pieces is R150.00.' },
        { status: 400 }
      );
    }

    if (!body.design_file_url) {
      return NextResponse.json({ error: 'Print design file URL is required.' }, { status: 400 });
    }

    let effectiveBrandId = body.brand_id;
    if (auth.role === 'creator') {
      effectiveBrandId = auth.brandId || body.brand_id || 'b0000000-0000-0000-0000-000000000001';
    }

    const result = await BrandService.createCustomProduct(
      {
        ...body,
        name,
        base_price: basePrice,
        price: basePrice,
        brand_id: effectiveBrandId,
      },
      { email: auth.email, role: auth.role }
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.product, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
