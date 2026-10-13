import { NextRequest, NextResponse } from 'next/server';
import { BrandService } from '@dissafyt/api';
import { requireStudioAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireStudioAuth(request, ['admin', 'creator']);
  if (isAuthFailure(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const requestedBrandId = searchParams.get('brandId');

  // Enforce tenant boundary: Creator may ONLY query their own brand
  let effectiveBrandId = requestedBrandId || auth.brandId || 'b0000000-0000-0000-0000-000000000001';
  if (auth.role === 'creator') {
    const creatorOwnBrandId = auth.brandId || 'b0000000-0000-0000-0000-000000000001';
    if (requestedBrandId && requestedBrandId !== creatorOwnBrandId) {
      return NextResponse.json({ error: 'Forbidden: Access to other brand analytics is prohibited.' }, { status: 403 });
    }
    effectiveBrandId = creatorOwnBrandId;
  }

  try {
    const [salesSummary, stackedMetrics] = await Promise.all([
      BrandService.getCreatorSalesSummary(effectiveBrandId),
      BrandService.getStackedReturnsMetrics(effectiveBrandId),
    ]);

    return NextResponse.json({
      sales: salesSummary,
      stackedReturns: stackedMetrics,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
