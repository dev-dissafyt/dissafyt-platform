import { NextRequest, NextResponse } from 'next/server';
import { AdminProductService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  const products = await AdminProductService.listProducts();
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'product:create');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    if (!body.name || body.base_price === undefined) {
      return NextResponse.json({ error: 'Product name and base_price are required' }, { status: 400 });
    }

    const result = await AdminProductService.createProduct(
      {
        name: body.name,
        slug: body.slug,
        description: body.description,
        category_id: body.category_id,
        base_price: Number(body.base_price),
        is_active: body.is_active,
        images: body.images || [],
        variants: body.variants || [],
      },
      {
        id: auth.userId,
        email: auth.email,
        role: auth.role,
      }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.product, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}

