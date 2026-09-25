import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Standard'];

/**
 * GET /api/catalog
 * Returns active grooming services, barbers/staff, and retail products with sorted variant stock.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdminClient();

    // 1. Fetch active grooming services (excluding recurring subscriptions)
    const { data: services, error: sErr } = await admin
      .from('services')
      .select('*')
      .eq('is_active', true)
      .eq('is_subscription', false)
      .order('price', { ascending: true });

    if (sErr) throw sErr;

    // 2. Fetch active barbers & studio staff
    const { data: staff, error: stErr } = await admin
      .from('staff')
      .select('id, display_name, bio, phone, avatar_url, is_active')
      .eq('is_active', true)
      .order('display_name', { ascending: true });

    if (stErr) throw stErr;

    // 3. Fetch active retail products with variants and live stock
    const { data: products, error: pErr } = await admin
      .from('products')
      .select('*, variants:product_variants(*)')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (pErr) throw pErr;

    return NextResponse.json({
      success: true,
      services: services || [],
      staff: staff || [],
      products: (products || []).map((p: any) => {
        const activeVariants = (p.variants || [])
          .filter((v: any) => v.is_active !== false)
          .sort((a: any, b: any) => {
            const idxA = SIZE_ORDER.indexOf(a.name);
            const idxB = SIZE_ORDER.indexOf(b.name);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.name.localeCompare(b.name);
          });

        return {
          id: p.id,
          name: p.name,
          title: p.name,
          description: p.description,
          base_price: Number(p.base_price || 0),
          is_preorder: Boolean(p.is_preorder),
          preorder_message: p.preorder_message || null,
          preorder_target: p.preorder_target || null,
          images: p.images || [],
          variants: activeVariants.map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price_override ? Number(v.price_override) : Number(p.base_price || 0),
            stock_quantity: Number(v.stock_quantity || 0),
          })),
        };
      }),
    });
  } catch (err: any) {
    console.error('Failed to load POS catalog:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load POS catalog' },
      { status: 500 }
    );
  }
}
