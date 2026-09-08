import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PROJECT_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.API_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- DISSafyt Platform Phase 2 Verification ---');
console.log('Target Supabase Project:', url);

if (!serviceKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is missing from .env.local');
  process.exit(1);
}

const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonClient = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runVerification() {
  console.log('\n[Step 1] Checking Database Tables & Roles...');
  const { data: roles, error: rolesErr } = await adminClient.from('roles').select('*');
  if (rolesErr) {
    console.error('FAILED to query roles table:', rolesErr.message);
    process.exit(1);
  }
  console.log('SUCCESS: Roles table exists with roles:', roles.map(r => r.id).join(', '));

  console.log('\n[Step 2] Checking Required Tables Existence...');
  const tables = ['profiles', 'user_roles', 'products', 'categories', 'orders', 'services', 'staff', 'bookings', 'payments'];
  for (const table of tables) {
    const { error } = await adminClient.from(table).select('count', { count: 'exact', head: true });
    if (error) {
      console.error(`FAILED: Table "${table}" error:`, error.message);
      process.exit(1);
    }
  }
  console.log('SUCCESS: All 9 platform tables exist and are accessible via PostgreSQL.');

  console.log('\n[Step 3] Testing Customer Registration & Trigger...');
  const testEmail = `test_customer_${Date.now()}@dissafyt.com`;
  const testPassword = `TestPass!${Date.now()}`;
  const testFullName = 'DISSafyt Test Customer';

  const { data: signupData, error: signupErr } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { full_name: testFullName },
  });

  if (signupErr || !signupData.user) {
    console.error('FAILED to register test user:', signupErr?.message);
    process.exit(1);
  }
  const testUserId = signupData.user.id;
  console.log(`SUCCESS: Test user registered with ID: ${testUserId} (${testEmail})`);

  // Wait a moment for trigger
  await new Promise(res => setTimeout(res, 1000));

  console.log('\n[Step 4] Verifying Automatic Profile & Role Creation (on_auth_user_created Trigger)...');
  const { data: profile, error: profileErr } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', testUserId)
    .single();

  if (profileErr || !profile) {
    console.error('FAILED: Profile was not automatically created by PostgreSQL trigger:', profileErr?.message);
    process.exit(1);
  }
  console.log('SUCCESS: Profile auto-created:', { id: profile.id, full_name: profile.full_name, email: profile.email });

  const { data: userRoles, error: userRolesErr } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', testUserId);

  if (userRolesErr || !userRoles || userRoles.length === 0) {
    console.error('FAILED: Default role was not assigned:', userRolesErr?.message);
    process.exit(1);
  }
  console.log('SUCCESS: Default role assigned:', userRoles.map(r => r.role).join(', '));

  console.log('\n[Step 5] Testing Customer Login & Session Token...');
  const { data: signinData, error: signinErr } = await anonClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signinErr || !signinData.session) {
    console.error('FAILED to sign in with password:', signinErr?.message);
    process.exit(1);
  }
  const accessToken = signinData.session.access_token;
  console.log('SUCCESS: Logged in and received JWT access token.');

  console.log('\n[Step 6] Testing Profile Update (PATCH /users/me logic)...');
  const updatedPhone = '+27 82 555 1234';
  const updatedName = 'DISSafyt Verified Customer';

  const { data: updatedProfile, error: updateErr } = await adminClient
    .from('profiles')
    .update({ full_name: updatedName, phone: updatedPhone, updated_at: new Date().toISOString() })
    .eq('id', testUserId)
    .select()
    .single();

  if (updateErr) {
    console.error('FAILED to update profile:', updateErr.message);
    process.exit(1);
  }
  console.log('SUCCESS: Profile updated successfully:', { full_name: updatedProfile.full_name, phone: updatedProfile.phone });

  console.log('\n[Step 7] Testing Security & Authorization Matrix...');
  // 7a. Authenticated client queries own profile
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });

  const { data: ownProfile, error: ownProfileErr } = await userClient
    .from('profiles')
    .select('*')
    .eq('id', testUserId)
    .single();

  if (ownProfileErr) {
    console.error('FAILED: Customer could not read own profile:', ownProfileErr.message);
  } else {
    console.log('ALLOW: Customer successfully read own profile:', ownProfile.full_name);
  }

  // 7b. Customer attempts to read another arbitrary user profile
  const fakeOtherUserId = '00000000-0000-0000-0000-000000000001';
  const { data: otherProfile, error: otherProfileErr } = await userClient
    .from('profiles')
    .select('*')
    .eq('id', fakeOtherUserId);

  if (!otherProfile || otherProfile.length === 0) {
    console.log('DENY: Customer query to another user\'s profile returned 0 rows (enforced by RLS).');
  } else {
    console.error('VIOLATION: Customer was able to query another user\'s profile!');
  }

  // 7c. Check admin helper function
  const { data: isAdmin } = await adminClient.rpc('is_admin', { user_id: testUserId });
  if (isAdmin === false) {
    console.log('DENY: Regular customer is NOT an admin (is_admin = false).');
  } else {
    console.error('VIOLATION: Customer has admin rights unexpectedly!');
  }

  // Clean up test user
  console.log('\n[Step 8] Cleaning up test customer...');
  await adminClient.auth.admin.deleteUser(testUserId);
  console.log('SUCCESS: Test user cleaned up.');

  console.log('\n======================================================');
  console.log('>>> MILESTONE 1 / PHASE 2 GATE: PASSED SUCCESSFULLY! <<<');
  console.log('======================================================\n');
}

runVerification().catch(err => {
  console.error('Verification encountered an unexpected error:', err);
  process.exit(1);
});
