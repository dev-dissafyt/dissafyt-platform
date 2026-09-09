import { NextRequest, NextResponse } from 'next/server';
import { BrandService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callerBrandId = request.headers.get('x-dissafyt-brand-id') || 
                        request.cookies.get('dissafyt_studio_brand_id')?.value;
  const brandId = searchParams.get('brandId') || callerBrandId || 'b0000000-0000-0000-0000-000000000001';

  try {
    const data = await BrandService.getCreatorPayouts(brandId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, amount, banking } = body;
    const actorEmail = request.headers.get('x-dissafyt-email') || 'creator@dissafyt.com';

    const result = await BrandService.requestPayout(brandId, Number(amount), banking, {
      email: actorEmail,
      role: 'creator',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
