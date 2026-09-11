import { NextResponse } from 'next/server';
import { AdminProductService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const products = await AdminProductService.listProducts();
  const activeProducts = products.filter((p) => p.is_active);
  return NextResponse.json(activeProducts, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
