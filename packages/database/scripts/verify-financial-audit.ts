import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envVars: Record<string, string> = {};
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      envVars[key] = val;
      process.env[key] = val;
    }
  }
}

import { getSupabaseAdminClient } from '../src/index';
import { ReportingService, BarbershopService } from '../../api/src/index';

async function main() {
  console.log('====================================================');
  console.log('   FINANCIAL AUDIT CONTROLS & RECONCILIATION TEST   ');
  console.log('====================================================\n');

  const admin = getSupabaseAdminClient();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
      failed++;
    }
  }

  // 1. Verify user subscription
  console.log('1. Checking user subscription in public.subscriptions...');
  const { data: subs, error: sErr } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', '0b748550-9d37-49b9-b2bf-0b43bf833001');

  assert(!sErr && subs && subs.length === 1, 'Exactly one subscription record exists for user');
  const userSub = subs?.[0];
  assert(userSub?.plan_code === 'solo', `Plan code is 'solo' (actual: ${userSub?.plan_code})`);
  assert(Number(userSub?.price) === 100, `Plan price is R100.00 (actual: R${userSub?.price})`);
  assert(userSub?.status === 'active', `Subscription status is 'active' (actual: ${userSub?.status})`);

  // 2. Verify payments ledger
  console.log('\n2. Checking authoritative payments ledger in public.payments...');
  const { data: payments, error: pErr } = await admin
    .from('payments')
    .select('*');

  assert(!pErr && payments !== null, 'Payments ledger successfully queried');
  const livePaidPayments = (payments || []).filter(
    (p) => (p.status === 'paid' || p.status === 'completed') && (p as any).is_test !== true
  );

  assert(livePaidPayments.length === 1, `Exactly 1 live paid payment in ledger (actual: ${livePaidPayments.length})`);
  const singlePay = livePaidPayments[0];
  assert(Number(singlePay?.amount) === 100, `Payment amount is R100.00 (actual: R${singlePay?.amount})`);
  assert(singlePay?.related_type === 'subscription', `Payment related_type is 'subscription' (actual: ${singlePay?.related_type})`);

  // 3. Verify ReportingService operational metrics (Single Source of Truth)
  console.log('\n3. Testing ReportingService.getOperationalMetrics()...');
  const metrics = await ReportingService.getOperationalMetrics();

  assert(metrics.overview.totalRevenue === 100, `Total Revenue is exactly R100.00 (actual: R${metrics.overview.totalRevenue})`);
  assert(metrics.overview.subscriptionRevenue === 100, `Subscription Revenue is R100.00 (actual: R${metrics.overview.subscriptionRevenue})`);
  assert(metrics.overview.commerceRevenue === 0, `Commerce Revenue is R0.00 (actual: R${metrics.overview.commerceRevenue})`);
  assert(metrics.overview.walkInRevenue === 0, `Walk-In Cash Revenue is R0.00 (actual: R${metrics.overview.walkInRevenue})`);

  // 4. Verify existing bookings do not double-count
  console.log('\n4. Checking customer bookings for double-counting...');
  const { data: userBookings } = await admin
    .from('bookings')
    .select('*')
    .eq('customer_id', '0b748550-9d37-49b9-b2bf-0b43bf833001')
    .eq('id', '482a0221-cd88-4a92-ac8d-b3ee0e402d14');

  const confirmedBooking = userBookings?.[0];
  assert(Number(confirmedBooking?.total_amount) === 0, `Confirmed member booking total_amount is R0.00 (actual: R${confirmedBooking?.total_amount})`);

  // 5. Test new member booking creation has R0.00 cash increment
  console.log('\n5. Testing automatic R0.00 member coverage on new booking creation...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
  // Set to 11:00 AM SAST (09:00 UTC)
  tomorrow.setUTCHours(9, 0, 0, 0);

  const testCreate = await BarbershopService.createBooking({
    customer_id: '0b748550-9d37-49b9-b2bf-0b43bf833001',
    service_id: '3ac5d886-6b06-4d33-9b89-a375bb9e30f2', // Classic Haircut (sticker R120)
    start_time: tomorrow.toISOString(),
    notes: 'Automated Financial Audit Test Booking',
  });

  assert(testCreate.success === true, 'Member booking creation succeeded');
  assert(
    Number(testCreate.booking?.total_amount) === 0,
    `New member booking total_amount is automatically R0.00 (actual: R${testCreate.booking?.total_amount})`
  );

  // Clean up the test booking
  if (testCreate.booking?.id) {
    await admin.from('bookings').delete().eq('id', testCreate.booking.id);
    console.log('  🧹 Cleaned up temporary test booking');
  }

  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
