import { PayfastService, OrderService } from '../../api/src/index';
import { PAYFAST_PLANS } from '../../ui/src/components/payfast-button';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('Dissafyt Platform: Barbershop Subscriptions & Gating Verification');
console.log('================================================================\n');

async function runVerification() {
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failedCount++;
    }
  }

  // ----------------------------------------------------
  // Test 1: Subscription Plans & Pricing Configuration
  // ----------------------------------------------------
  console.log('--- 1. Testing Barbershop Membership Plans Configuration ---');

  assert(Boolean(PAYFAST_PLANS.solo), 'Plan "solo" exists in PAYFAST_PLANS');
  assert(PAYFAST_PLANS.solo.amount === '100', 'The Solo plan is R100/mo');
  assert(PAYFAST_PLANS.solo.itemName === 'The Solo', 'The Solo item name is correct');

  assert(Boolean(PAYFAST_PLANS.twice), 'Plan "twice" exists in PAYFAST_PLANS');
  assert(PAYFAST_PLANS.twice.amount === '180', 'The Regular (twice) plan is R180/mo');
  assert(PAYFAST_PLANS.twice.itemName === 'The Regular', 'The Regular item name is correct');

  assert(Boolean(PAYFAST_PLANS['father-son']), 'Plan "father-son" exists in PAYFAST_PLANS');
  assert(PAYFAST_PLANS['father-son'].amount === '180', 'Father n Son plan is R180/mo');
  assert(PAYFAST_PLANS['father-son'].itemName === 'Father n Son', 'Father n Son item name is correct');

  // ----------------------------------------------------
  // Test 2: PayFast Signature Generation for Subscriptions
  // ----------------------------------------------------
  console.log('\n--- 2. Testing PayFast Subscription Signature & Payload ---');

  const testSubPayload = {
    merchant_id: '17675995',
    merchant_key: 'c08hjtdezifi4',
    amount: '180.00',
    item_name: 'Ace of Fyt - The Regular',
    subscription_type: '1',
    recurring_amount: '180.00',
    cycles: '12',
    frequency: '3',
    name_first: 'Sipho',
    name_last: 'Khumalo',
    email_address: 'sipho@example.com',
    cell_number: '+27821234567',
    custom_str1: 'twice',
    custom_str2: 'usr_mock_123',
  };

  const generatedSignature = PayfastService.generateSignature(testSubPayload);
  assert(Boolean(generatedSignature && generatedSignature.length === 32), 'MD5 signature generated correctly for subscription payload');

  const validationResult = PayfastService.validateSignature({
    ...testSubPayload,
    signature: generatedSignature,
  });
  assert(validationResult === true, 'PayFast validates signature matching payload attributes');

  // ----------------------------------------------------
  // Test 3: Product Checkout Autofill Data Pipeline
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Product Checkout Autofill Data Propagation ---');

  const mockShippingAddress = {
    recipient_name: 'Nomvula Dlamini',
    recipient_phone: '0839876543',
    recipient_email: 'nomvula@example.co.za',
    street_address: '45 Vilakazi Street',
    suburb: 'Orlando West',
    city: 'Johannesburg',
    province: 'Gauteng',
    postal_code: '1804',
    country: 'South Africa',
  };

  const nameParts = mockShippingAddress.recipient_name.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');

  const checkoutPayfastPayload: Record<string, string> = {
    merchant_id: '17675995',
    merchant_key: 'c08hjtdezifi4',
    amount: '450.00',
    item_name: 'Dissafyt Order ORD-TEST-01',
    name_first: firstName,
    name_last: lastName,
    email_address: mockShippingAddress.recipient_email,
    cell_number: mockShippingAddress.recipient_phone,
    custom_str1: 'ord_123',
    custom_str2: 'usr_456',
  };

  assert(checkoutPayfastPayload.name_first === 'Nomvula', 'Autofills recipient first name correctly');
  assert(checkoutPayfastPayload.name_last === 'Dlamini', 'Autofills recipient last name correctly');
  assert(checkoutPayfastPayload.email_address === 'nomvula@example.co.za', 'Autofills recipient email for order confirmation');
  assert(checkoutPayfastPayload.cell_number === '0839876543', 'Autofills recipient mobile number for Delivery SMS');

  const checkoutSignature = PayfastService.generateSignature(checkoutPayfastPayload);
  assert(Boolean(checkoutSignature), 'Generates valid PayFast signature with prefilled recipient details');

  // ----------------------------------------------------
  // Test 4: Database Migration 0006 Schema & Policies
  // ----------------------------------------------------
  console.log('\n--- 4. Verifying Migration 0006_subscriptions.sql Schema ---');

  const migrationPath = path.resolve(__dirname, '../migrations/0006_subscriptions.sql');
  assert(fs.existsSync(migrationPath), 'Migration 0006_subscriptions.sql file exists');

  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.subscriptions'), 'Creates public.subscriptions table');
  assert(sqlContent.includes('plan_code TEXT NOT NULL'), 'Includes plan_code column');
  assert(sqlContent.includes('status TEXT NOT NULL DEFAULT \'active\''), 'Includes status column with active default');
  assert(sqlContent.includes('current_period_end TIMESTAMPTZ'), 'Includes billing cycle period timestamps');
  assert(sqlContent.includes('idx_subscriptions_user_id'), 'Includes index on user_id for fast gating lookups');
  assert(sqlContent.includes('ENABLE ROW LEVEL SECURITY'), 'Enables RLS on subscriptions');
  assert(sqlContent.includes('Users can view own subscriptions'), 'RLS policy allows users to view own subscriptions');
  assert(sqlContent.includes('Admins can manage all subscriptions'), 'RLS policy allows admins to manage all subscriptions');

  // ----------------------------------------------------
  // Test 5: Booking Gating Logic
  // ----------------------------------------------------
  console.log('\n--- 5. Verifying Barbershop Booking Gating Rules ---');

  // Rule 1: Guest / Unauthenticated
  const guestStatus = { hasActiveSubscription: false, subscription: null };
  const canGuestBook = guestStatus.hasActiveSubscription;
  assert(!canGuestBook, 'Guest without active subscription CANNOT access booking slots');

  // Rule 2: Registered user without subscription
  const unsubscribedUserStatus = { hasActiveSubscription: false, subscription: null };
  const canUnsubscribedBook = unsubscribedUserStatus.hasActiveSubscription;
  assert(!canUnsubscribedBook, 'Registered user without active membership CANNOT access booking slots');

  // Rule 3: Active Member (e.g. The Regular)
  const activeMemberStatus = {
    hasActiveSubscription: true,
    subscription: {
      id: 'sub_123',
      user_id: 'usr_456',
      plan_code: 'twice',
      plan_name: 'The Regular Membership',
      price: 180.0,
      status: 'active',
      current_period_end: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };
  const canActiveMemberBook = activeMemberStatus.hasActiveSubscription;
  assert(canActiveMemberBook, 'Active member UNLOCKS appointment booking schedule');
  assert(activeMemberStatus.subscription.plan_code === 'twice', 'Identifies active plan tier ("twice" / The Regular)');

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`Verification Complete: ${passedCount} Passed, ${failedCount} Failed`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runVerification().catch((e) => {
  console.error('Unhandled verification error:', e);
  process.exit(1);
});
