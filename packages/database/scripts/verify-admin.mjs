import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PROJECT_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- DISSafyt Platform Admin Operations Verification ---');
console.log('Target Supabase:', url);

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runTest() {
  // 1. Test Category & Product Creation
  console.log('\n[Test 1] Testing Product Creation & Variant Association...');
  const testCatSlug = `test-cat-${Date.now()}`;
  const { data: cat } = await admin
    .from('categories')
    .insert({ name: 'Test Apparel', slug: testCatSlug })
    .select()
    .single();

  console.log('Created category:', cat?.name);

  const testProdName = `DISSafyt Test Jacket ${Date.now()}`;
  const testProdSlug = `test-jacket-${Date.now()}`;
  const { data: product, error: prodErr } = await admin
    .from('products')
    .insert({
      name: testProdName,
      slug: testProdSlug,
      description: 'Heavyweight winter jacket with PayFast buy button',
      base_price: 850.00,
      category_id: cat?.id || null,
      is_active: true,
      images: ['https://placehold.co/600x400/png'],
    })
    .select()
    .single();

  if (prodErr) throw new Error(`Product creation failed: ${prodErr.message}`);
  console.log('SUCCESS: Product created:', { id: product.id, name: product.name, price: product.base_price });

  // Add a variant
  const { data: variant, error: varErr } = await admin
    .from('product_variants')
    .insert({
      product_id: product.id,
      name: 'Size L - Black',
      sku: `JKT-${Date.now()}-L`,
      stock_quantity: 15,
      is_active: true,
    })
    .select()
    .single();

  if (varErr) throw new Error(`Variant creation failed: ${varErr.message}`);
  console.log('SUCCESS: Product variant created:', { sku: variant.sku, stock: variant.stock_quantity });

  // 2. Test Barbershop Service & Subscription Creation
  console.log('\n[Test 2] Testing Barbershop Service Creation...');
  const { data: service, error: srvErr } = await admin
    .from('services')
    .insert({
      name: `VIP Cut & Shave ${Date.now()}`,
      description: 'Exclusive grooming appointment with master barber',
      duration_minutes: 45,
      price: 250.00,
      is_active: true,
    })
    .select()
    .single();

  if (srvErr) throw new Error(`Service creation failed: ${srvErr.message}`);
  console.log('SUCCESS: Service created:', { id: service.id, name: service.name, rate: service.price });

  // 3. Test Product & Service Cleanup
  console.log('\n[Test 3] Cleaning up test product, variant, category, and service...');
  await admin.from('product_variants').delete().eq('id', variant.id);
  await admin.from('products').delete().eq('id', product.id);
  if (cat?.id) await admin.from('categories').delete().eq('id', cat.id);
  await admin.from('services').delete().eq('id', service.id);
  console.log('SUCCESS: Cleaned up test commerce and service entities.');

  console.log('\n======================================================');
  console.log('>>> ADMIN OPERATIONS VERIFICATION: PASSED! <<<');
  console.log('======================================================\n');
}

runTest().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
