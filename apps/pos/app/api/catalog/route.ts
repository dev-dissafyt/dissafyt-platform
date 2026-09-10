import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/catalog
 * Returns active grooming services, staff members, and retail products with live variant stock.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdminClient();

    // 1. Fetch active haircut / grooming services (excluding subscription pass entries)
    const { data: services, error: sErr } = await admin
      .from('services')
      .select('*')
      .eq('is_active', true)
      .eq('is_subscription', false)
      .order('price', { ascending: true });

    if (sErr) throw sErr;

    // 2. Fetch active barbers / staff
    const { data: staff, error: stErr } = await admin
      .from('staff')
      .select('id, display_name, bio, phone, avatar_url, is_active')
      .eq('is_active', true)
      .order('display_name', { ascending: true });

    if (stErr) throw stErr;

    // 3. Fetch active retail products with their variants and live stock
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
      products: (products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        title: p.name,
        description: p.description,
        base_price: Number(p.base_price || 0),
        images: p.images || [],
        variants: (p.variants || [])
          .filter((v: any) => v.is_active !== false)
          .map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price_override ? Number(v.price_override) : Number(p.base_price || 0),
            stock_quantity: Number(v.stock_quantity || 0),
          })),
      })),
    });
  } catch (err: any) {
    console.error('Failed to load POS catalog:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load POS catalog' },
      { status: 500 }
    );
  }
}
