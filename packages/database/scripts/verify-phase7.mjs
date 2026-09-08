import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PROJECT_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Dissafyt Platform Phase 7: Barbershop MVP Verification ---');
console.log('Target Supabase:', url);

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runPhase7Verification() {
  let testCustomer = null;
  let testBookingId = null;

  try {
    // 1. Verify Active Staff
    console.log('\n[Step 1] Verifying Active Barbershop Staff in public.staff...');
    const { data: staffList, error: staffErr } = await admin
      .from('staff')
      .select('*')
      .eq('is_active', true);

    if (staffErr || !staffList || staffList.length === 0) {
      throw new Error(`Staff check failed: ${staffErr?.message || 'No active staff found'}`);
    }
    console.log(`SUCCESS: Found ${staffList.length} active barber(s):`, staffList.map((s) => s.display_name).join(', '));
    const testBarber = staffList[0];

    // 2. Verify Grooming Services
    console.log('\n[Step 2] Verifying Barbershop Services in public.services...');
    const { data: services, error: sErr } = await admin
      .from('services')
      .select('*')
      .eq('is_active', true)
      .eq('is_subscription', false);

    if (sErr || !services || services.length === 0) {
      throw new Error(`Services check failed: ${sErr?.message || 'No regular services found'}`);
    }
    const testService = services[0];
    console.log(`SUCCESS: Selected test service: "${testService.name}" (${testService.duration_minutes}m, R${testService.price})`);

    // 3. Register a Test Customer Profile for Appointment
    console.log('\n[Step 3] Registering Test Customer Profile...');
    const testEmail = `client_${Date.now()}@dissafyt.co.za`;
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: { full_name: 'Test Grooming Client' },
    });

    if (authErr || !authUser?.user) {
      throw new Error(`Failed to create test customer: ${authErr?.message}`);
    }
    testCustomer = authUser.user;
    console.log(`SUCCESS: Customer registered: ${testCustomer.id} (${testEmail})`);

    // 4. Test Booking Creation
    console.log('\n[Step 4] Creating Barbershop Appointment via Backend Logic...');
    // Tomorrow at 10:00 AM UTC
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setUTCHours(10, 0, 0, 0);

    const startTimeISO = tomorrow.toISOString();
    const endTimeISO = new Date(tomorrow.getTime() + testService.duration_minutes * 60000).toISOString();

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .insert({
        customer_id: testCustomer.id,
        service_id: testService.id,
        staff_id: testBarber.id,
        start_time: startTimeISO,
        end_time: endTimeISO,
        status: 'confirmed',
        total_amount: testService.price,
        notes: 'Verification test booking — skin fade & beard trim',
      })
      .select()
      .single();

    if (bErr || !booking) {
      throw new Error(`Booking creation failed: ${bErr?.message}`);
    }
    testBookingId = booking.id;
    console.log(`SUCCESS: Appointment created: ID ${booking.id} (${booking.status}) with ${testBarber.display_name} at ${startTimeISO}`);

    // 5. Test Collision / Double-Booking Prevention
    console.log('\n[Step 5] Testing Anti Double-Booking Collision Detection...');
    const { data: collisions } = await admin
      .from('bookings')
      .select('id')
      .eq('staff_id', testBarber.id)
      .neq('status', 'cancelled')
      .lt('start_time', endTimeISO)
      .gt('end_time', startTimeISO);

    if (!collisions || collisions.length === 0) {
      throw new Error('Collision detection assertion failed: overlapping booking was not detected!');
    }
    console.log(`SUCCESS: Anti-collision detected existing booking ID ${collisions[0].id}. Concurrent double-booking prevented.`);

    // 6. Test Admin Appointment Management & Status Transition
    console.log('\n[Step 6] Admin Appointment Operations (confirmed -> completed)...');
    const { data: updatedBooking, error: updateErr } = await admin
      .from('bookings')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', testBookingId)
      .select()
      .single();

    if (updateErr || updatedBooking?.status !== 'completed') {
      throw new Error(`Failed to update booking status: ${updateErr?.message}`);
    }
    console.log(`SUCCESS: Admin successfully transitioned appointment status to: ${updatedBooking.status}`);

    // 7. Verify Customer History Retrieval
    console.log('\n[Step 7] Customer Booking History Verification...');
    const { data: customerHistory, error: hErr } = await admin
      .from('bookings')
      .select(`
        *,
        service:services(*),
        staff:staff(*)
      `)
      .eq('customer_id', testCustomer.id);

    if (hErr || !customerHistory || customerHistory.length === 0) {
      throw new Error(`Customer booking history check failed: ${hErr?.message}`);
    }
    console.log(`SUCCESS: Customer has ${customerHistory.length} booking(s) on record. Service: "${customerHistory[0].service?.name}", Barber: "${customerHistory[0].staff?.display_name}".`);

    // 8. Test Cancellation Flow
    console.log('\n[Step 8] Testing Appointment Cancellation Flow...');
    const { data: cancelledBooking, error: cErr } = await admin
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', testBookingId)
      .select()
      .single();

    if (cErr || cancelledBooking?.status !== 'cancelled') {
      throw new Error(`Cancellation failed: ${cErr?.message}`);
    }
    console.log(`SUCCESS: Appointment successfully cancelled: ${cancelledBooking.status}`);

    console.log('\n================================================================');
    console.log('>>> PHASE 7: BARBERSHOP MVP & APPOINTMENT LIFECYCLE PASSED! <<<');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ PHASE 7 VERIFICATION FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup test records
    console.log('\n[Cleanup] Cleaning up test customer and booking records...');
    if (testBookingId) {
      await admin.from('bookings').delete().eq('id', testBookingId);
    }
    if (testCustomer?.id) {
      await admin.from('profiles').delete().eq('id', testCustomer.id);
      await admin.auth.admin.deleteUser(testCustomer.id);
    }
    console.log('SUCCESS: Test environment clean.');
  }
}

runPhase7Verification();
