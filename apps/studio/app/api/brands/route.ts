import { NextRequest, NextResponse } from 'next/server';
import { BrandService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const brands = await BrandService.listBrands();
  return NextResponse.json(brands);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await BrandService.createBrand(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.brand, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
