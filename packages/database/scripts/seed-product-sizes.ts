import { getSupabaseAdminClient } from '../src';

async function seedSizes() {
  const admin = getSupabaseAdminClient();
  console.log('Seeding apparel size curves (S, M, L, XL, 2XL)...');

  const { data: products, error: pErr } = await admin.from('products').select('*');
  if (pErr || !products) {
    console.error('Failed to fetch products:', pErr);
    return;
  }

  const sizes = ['S', 'M', 'L', 'XL', '2XL'];
  const stockCurve: Record<string, number> = {
    'S': 5,
    'M': 10,
    'L': 15,
    'XL': 10,
    '2XL': 5,
  };

  for (const prod of products) {
    console.log(`Processing product: ${prod.name} (${prod.id})...`);

    // Remove old "Standard" single variant if present
    await admin
      .from('product_variants')
      .delete()
      .eq('product_id', prod.id)
      .eq('name', 'Standard');

    // Check existing variants
    const { data: existingVars } = await admin
      .from('product_variants')
      .select('*')
      .eq('product_id', prod.id);

    const existingNames = new Set((existingVars || []).map((v) => v.name));

    const prefix = prod.slug.toUpperCase().slice(0, 4);

    for (const size of sizes) {
      if (!existingNames.has(size)) {
        const sku = `${prefix}-${size}`;
        const stock = stockCurve[size] || 10;
        const { error: insErr } = await admin.from('product_variants').insert({
          product_id: prod.id,
          name: size,
          sku,
          stock_quantity: stock,
          is_active: true,
        });

        if (insErr) {
          console.error(`Failed to insert size ${size} for ${prod.name}:`, insErr);
        } else {
          console.log(`  Added size ${size} (SKU: ${sku}, Stock: ${stock})`);
        }
      }
    }
  }

  console.log('Apparel sizing seeded successfully!');
}

seedSizes().catch(console.error);
