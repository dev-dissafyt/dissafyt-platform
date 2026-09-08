import { NextResponse } from 'next/server';
import { AdminProductService } from '@dissafyt/api';

export async function GET() {
  const products = await AdminProductService.listProducts();
  const activeProducts = products.filter((p) => p.is_active);
  return NextResponse.json(activeProducts);
}
