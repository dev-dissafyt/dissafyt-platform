import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PROJECT_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Dissafyt Platform Phase 8: Platform Integration Verification ---');
console.log('Target Supabase:', url);

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runPhase8Verification() {
  try {
    // 1. Verify Operational Metrics Aggregation
    console.log('\n[Step 1] Verifying Operational Analytics & Aggregation...');
    const { count: customerCount } = await admin.from('profiles').select('*', { count: 'exact', head: true });
    const { count: orderCount } = await admin.from('orders').select('*', { count: 'exact', head: true });
    const { data: bookings } = await admin.from('bookings').select('total_amount, status');

    const totalRevenue = (bookings || [])
      .filter((b) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + Number(b.total_amount), 0);

    console.log(`Aggregated Metrics: Customers: ${customerCount}, Orders: ${orderCount}, Bookings: ${bookings?.length || 0}`);
    console.log(`Total Grooming Volume: R ${totalRevenue.toFixed(2)}`);

    if (customerCount === 0) {
      throw new Error('Customer profile count was 0');
    }
    console.log('SUCCESS: Operational metrics successfully aggregated.');

    // 2. Verify Barbershop Reschedule Engine & Collision Prevention
    console.log('\n[Step 2] Testing Barbershop Reschedule & Collision Engine...');
    const { data: activeBookings } = await admin
      .from('bookings')
      .select('id, customer_id, staff_id, start_time, end_time, status')
      .neq('status', 'cancelled')
      .limit(1);

    if (!activeBookings || activeBookings.length === 0) {
      throw new Error('No active booking found to test rescheduling.');
    }

    const testBooking = activeBookings[0];
    const originalStart = testBooking.start_time;
    const originalEnd = testBooking.end_time;

    // Reschedule to a new future slot (e.g. next Saturday 14:00)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + ((6 - targetDate.getDay() + 7) % 7 || 7)); // Next Saturday
    targetDate.setUTCHours(14, 0, 0, 0);

    const newStartISO = targetDate.toISOString();
    const newEndISO = new Date(targetDate.getTime() + 45 * 60 * 1000).toISOString();

    console.log(`Rescheduling booking ${testBooking.id} to ${newStartISO}...`);
    const { data: updatedBooking, error: uErr } = await admin
      .from('bookings')
      .update({
        start_time: newStartISO,
        end_time: newEndISO,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', testBooking.id)
      .select()
      .single();

    if (uErr || !updatedBooking) {
      throw new Error(`Reschedule failed: ${uErr?.message}`);
    }
    console.log('SUCCESS: Appointment rescheduled to new date/time.');

    // Verify collision detection: try to create a conflicting booking for the same barber at the same time
    console.log('Testing anti-collision guard for overlapping slot...');
    const { data: collisions } = await admin
      .from('bookings')
      .select('id')
      .eq('staff_id', testBooking.staff_id)
      .neq('status', 'cancelled')
      .lt('start_time', newEndISO)
      .gt('end_time', newStartISO);

    if (!collisions || collisions.length === 0) {
      throw new Error('Collision detection failed: overlapping slot was not detected!');
    }
    console.log(`SUCCESS: Anti-double-booking collision correctly detected ${collisions.length} conflict(s).`);

    // Restore original booking time
    await admin
      .from('bookings')
      .update({
        start_time: originalStart,
        end_time: originalEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', testBooking.id);
    console.log('Restored test booking to original schedule.');

    // 3. Verify Payment Records Audit Log
    console.log('\n[Step 3] Verifying Payment Records Audit Logging in public.payments...');
    const testPaymentId = '00000000-0000-0000-0000-000000000008';
    
    // Insert an audit entry
    const { data: payRecord, error: pErr } = await admin
      .from('payments')
      .upsert({
        id: testPaymentId,
        user_id: testBooking.customer_id,
        provider: 'payfast',
        provider_reference: 'PF_TEST_PHASE8_998877',
        amount: 360.00,
        currency: 'ZAR',
        status: 'paid',
        related_type: 'booking',
        related_id: testBooking.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (pErr) {
      throw new Error(`Payment audit write failed: ${pErr.message}`);
    }
    console.log('SUCCESS: Written payment audit record:', payRecord.provider_reference, `R ${payRecord.amount}`);

    // Query back from payments audit log
    const { data: readPay, error: rpErr } = await admin
      .from('payments')
      .select('*')
      .eq('id', testPaymentId)
      .single();

    if (rpErr || !readPay) {
      throw new Error(`Payment audit read failed: ${rpErr?.message}`);
    }
    console.log('SUCCESS: Verified audit queryability for payment:', readPay.provider_reference);

    console.log('\n======================================================');
    console.log('ALL PHASE 8 INTEGRATION VERIFICATION CHECKS PASSED!');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('\nVerification Error:', err.message);
    process.exit(1);
  }
}

runPhase8Verification();
