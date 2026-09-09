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

async function main() {
  const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const key = envVars.SUPABASE_SERVICE_ROLE_KEY;
  const admin = getSupabaseAdminClient(url, key);

  console.log('Connecting to Supabase...');

  // 1. Check user profile for dissafyt@gmail.com
  const { data: profiles, error: pErr } = await admin
    .from('profiles')
    .select('*')
    .eq('email', 'dissafyt@gmail.com');

  if (pErr || !profiles || profiles.length === 0) {
    console.error('User not found:', pErr);
    return;
  }

  const userId = profiles[0].id;
  console.log('Found user dissafyt@gmail.com, id:', userId);

  // 2. Insert active subscription payment record into public.payments
  const { data: payRecord, error: payErr } = await admin
    .from('payments')
    .insert({
      user_id: userId,
      provider: 'payfast',
      provider_reference: `PF_SUB_LIVE_${Date.now()}`,
      amount: 180.00,
      currency: 'ZAR',
      status: 'paid',
      related_type: 'subscription',
      related_id: userId, // Using userId as valid UUID reference
    })
    .select()
    .single();

  if (payErr) {
    console.error('Failed to insert payment record:', payErr);
  } else {
    console.log('✅ Successfully recorded active subscription payment in public.payments:', payRecord);
  }

  // 3. Try to insert into public.subscriptions if table exists
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { data: subData, error: subErr } = await admin
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_code: 'twice',
      plan_name: 'The Regular Membership',
      price: 180.00,
      status: 'active',
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      payfast_token: `PF_TOKEN_${Date.now()}`,
    })
    .select();

  if (subErr) {
    console.log('Note: public.subscriptions table error (needs migration 0006):', subErr.message);
  } else {
    console.log('✅ Successfully inserted into public.subscriptions:', subData);
  }
}

main().catch(console.error);
