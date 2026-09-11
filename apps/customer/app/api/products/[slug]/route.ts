import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  { params }: { params?: { slug?: string } }
) {
  const admin = getSupabaseAdminClient();
  const slug = params?.slug;
  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  const { data: product, error } = await admin
    .from('products')
    .select('*, categories(name)')
    .eq('slug', slug)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const { data: variants } = await admin
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id);

  return NextResponse.json(
    {
      ...product,
      category_name: (product as any).categories?.name,
      variants: variants || [],
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
