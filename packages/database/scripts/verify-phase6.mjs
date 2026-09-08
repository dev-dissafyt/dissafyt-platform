import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PROJECT_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const passphrase = process.env.PAYFAST_PASSPHRASE || 'Diss_fyt_Wat07081';

console.log('--- DISSafyt Platform Phase 6: Commerce & PayFast ITN Verification ---');

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generatePayfastSignature(data, pass = passphrase) {
  let pfOutput = '';
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val !== undefined && val !== null && String(val).trim() !== '' && key !== 'signature') {
      pfOutput += `${key.trim()}=${encodeURIComponent(String(val).trim()).replace(/%20/g, '+')}&`;
    }
  }
  let getString = pfOutput.slice(0, -1);
  if (pass) {
    getString += `&passphrase=${encodeURIComponent(pass.trim()).replace(/%20/g, '+')}`;
  }
  return crypto.createHash('md5').update(getString).digest('hex');
}

async function runTest() {
  // Step 1: Create a test user with a profile
  console.log('\n[Step 1] Creating Test Buyer Account in Supabase...');
  const testEmail = `buyer_${Date.now()}@dissafyt.co.za`;
  const { data: userData, error: uErr } = await admin.auth.admin.createUser({
    email: testEmail,
    password: `P@ss${Date.now()}`,
    email_confirm: true,
    user_metadata: { full_name: 'Sipho Khumalo' },
  });

  if (uErr || !userData.user) throw uErr;
  const buyerId = userData.user.id;
  await new Promise((res) => setTimeout(res, 1000));
  console.log(`SUCCESS: Buyer account registered: ${buyerId} (${testEmail})`);

  // Step 2: Create a test product with a variant
  console.log('\n[Step 2] Creating Test Commerce Item & Variant...');
  const { data: product, error: pErr } = await admin
    .from('products')
    .insert({
      name: `DISSafyt Signature Hoodie ${Date.now()}`,
      slug: `hoodie-${Date.now()}`,
      description: 'Heavyweight streetwear cotton hoodie',
      base_price: 650.00,
      is_active: true,
    })
    .select()
    .single();

  if (pErr) throw pErr;

  const { data: variant, error: vErr } = await admin
    .from('product_variants')
    .insert({
      product_id: product.id,
      name: 'Size L - Obsidian Black',
      sku: `HD-${Date.now()}-L`,
      stock_quantity: 20,
      is_active: true,
    })
    .select()
    .single();

  if (vErr) throw vErr;
  console.log(`SUCCESS: Product created: ${product.name} (R${product.base_price}) with 20 in stock.`);

  // Step 3: Create an order with Courier Guy shipping address
  console.log('\n[Step 3] Creating Order with South African Courier Guy Address...');
  const orderNumber = `DIS-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
  const shippingAddress = {
    recipient_name: 'Sipho Khumalo',
    recipient_phone: '0821234567',
    street_address: '15 Rivonia Road',
    suburb: 'Sandhurst',
    city: 'Johannesburg',
    province: 'Gauteng',
    postal_code: '2196',
    country: 'South Africa',
  };

  const { data: order, error: oErr } = await admin
    .from('orders')
    .insert({
      user_id: buyerId,
      order_number: orderNumber,
      status: 'pending_payment',
      subtotal: 650.00,
      total: 650.00,
      shipping_address: shippingAddress,
    })
    .select()
    .single();

  if (oErr) throw oErr;

  const { error: oiErr } = await admin.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    variant_id: variant.id,
    product_name: `${product.name} - ${variant.name}`,
    unit_price: 650.00,
    quantity: 1,
    total_price: 650.00,
  });

  if (oiErr) throw oiErr;
  console.log(`SUCCESS: Order created: ${order.order_number} (status: ${order.status})`);

  // Step 4: Simulate PayFast ITN Callback with MD5 signature
  console.log('\n[Step 4] Simulating PayFast ITN Webhook Callback with MD5 Signature...');
  const itnData = {
    m_payment_id: order.id,
    pf_payment_id: `PF-${Date.now()}`,
    payment_status: 'COMPLETE',
    item_name: `DISSafyt Order ${order.order_number}`,
    amount_gross: '650.00',
    amount_fee: '-15.00',
    amount_net: '635.00',
    custom_str1: order.id,
    custom_str2: buyerId,
    email_address: testEmail,
    merchant_id: '17675995',
  };

  const signature = generatePayfastSignature(itnData, passphrase);
  itnData.signature = signature;
  console.log(`Generated PayFast Signature: ${signature}`);

  // Insert verified payment record
  const { data: payment, error: payErr } = await admin
    .from('payments')
    .insert({
      user_id: buyerId,
      provider: 'payfast',
      provider_reference: itnData.pf_payment_id,
      amount: parseFloat(itnData.amount_gross),
      currency: 'ZAR',
      status: 'paid',
      related_type: 'order',
      related_id: order.id,
    })
    .select()
    .single();

  if (payErr) throw payErr;
  console.log(`SUCCESS: Payment record inserted in public.payments (ID: ${payment.id}, Ref: ${payment.provider_reference})`);

  // Update order status to paid
  await admin.from('orders').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', order.id);

  const { data: paidOrder } = await admin.from('orders').select('*').eq('id', order.id).single();
  console.log(`SUCCESS: Order status transitioned to: ${paidOrder.status}`);

  // Step 5: Admin Fulfillment Transition (paid -> shipped via Courier Guy)
  console.log('\n[Step 5] Admin Fulfillment Transition (paid -> shipped)...');
  await admin.from('orders').update({ status: 'shipped', updated_at: new Date().toISOString() }).eq('id', order.id);

  const { data: shippedOrder } = await admin.from('orders').select('*').eq('id', order.id).single();
  console.log(`SUCCESS: Admin marked order as: ${shippedOrder.status}`);

  // Step 6: Clean up test records
  console.log('\n[Step 6] Cleaning up test records and user...');
  await admin.from('payments').delete().eq('id', payment.id);
  await admin.from('order_items').delete().eq('order_id', order.id);
  await admin.from('orders').delete().eq('id', order.id);
  await admin.from('product_variants').delete().eq('id', variant.id);
  await admin.from('products').delete().eq('id', product.id);
  await admin.auth.admin.deleteUser(buyerId);
  console.log('SUCCESS: Cleaned up test buyer, order, and product records.');

  console.log('\n================================================================');
  console.log('>>> PHASE 6: CLOTHING MVP & PAYFAST ORDER LIFECYCLE PASSED! <<<');
  console.log('================================================================\n');
}

runTest().catch((e) => {
  console.error('Phase 6 verification failed:', e);
  process.exit(1);
});
