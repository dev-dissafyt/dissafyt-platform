import { NextRequest, NextResponse } from 'next/server';
import { BrandService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callerBrandId = request.headers.get('x-dissafyt-brand-id') || 
                        request.cookies.get('dissafyt_studio_brand_id')?.value;
  const brandId = searchParams.get('brandId') || callerBrandId || 'b0000000-0000-0000-0000-000000000001';

  try {
    const [salesSummary, stackedMetrics] = await Promise.all([
      BrandService.getCreatorSalesSummary(brandId),
      BrandService.getStackedReturnsMetrics(brandId),
    ]);

    return NextResponse.json({
      sales: salesSummary,
      stackedReturns: stackedMetrics,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
