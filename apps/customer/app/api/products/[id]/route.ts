import { NextRequest, NextResponse } from 'next/server';
import { AdminProductService } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getSupabaseAdminClient();
  const identifier = params.id;
  if (!identifier) {
    return NextResponse.json({ error: 'Product identifier parameter is required' }, { status: 400 });
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  let query = admin
    .from('products')
    .select('*, categories(name)');

  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier);
  }

  const { data: product, error } = await query.single();

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Standard'];

  const { data: variants } = await admin
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_active', true);

  const sortedVariants = (variants || []).sort((a: any, b: any) => {
    const idxA = SIZE_ORDER.indexOf(a.name);
    const idxB = SIZE_ORDER.indexOf(b.name);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return NextResponse.json(
    {
      ...product,
      category_name: (product as any).categories?.name,
      variants: sortedVariants,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth(request, 'product:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const id = params.id;
    const body = await request.json();

    const result = await AdminProductService.updateProduct(id, body, {
      id: auth.userId,
      email: auth.email,
      role: auth.role,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.product);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth(request, 'product:delete');
  if (isAuthFailure(auth)) return auth;

  const id = params.id;
  const result = await AdminProductService.deleteProduct(id, {
    id: auth.userId,
    email: auth.email,
    role: auth.role,
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
