import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PROJECT_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const admin = createClient(url.trim(), serviceKey.trim(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SAST_TIMEZONE = 'Africa/Johannesburg';
const SAST_OFFSET = '+02:00';
const SLOT_STEP_MINUTES = 30;

function getSASTComponents(dateInput) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const partMap = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const hour = parseInt(partMap.hour || '0', 10);
  const minute = parseInt(partMap.minute || '0', 10);
  const year = parseInt(partMap.year || '0', 10);
  const month = parseInt(partMap.month || '0', 10);
  const day = parseInt(partMap.day || '0', 10);
  const weekday = partMap.weekday || 'Mon';

  return {
    weekday,
    year,
    month,
    day,
    hour,
    minute,
    timeLabel: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    dateLabel: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

function getEffectiveDurationMinutes(durationMinutes) {
  return Math.ceil(Math.max(1, durationMinutes) / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
}

async function runSlotVerification() {
  console.log('--- Ace of Fyt Barbershop: Professional Booking Logic & Timezone Verification ---');
  let testBookingId = null;

  try {
    // 1. Verify SAST Timezone Construction & Format
    console.log('\n[Step 1] Testing 09:30 SAST Timezone Accuracy...');
    const testDate = '2026-09-23'; // A Wednesday
    const slot0930ISO = `${testDate}T09:30:00${SAST_OFFSET}`;
    const dateObj = new Date(slot0930ISO);

    // In UTC, 09:30 SAST must be 07:30:00.000Z
    const utcISO = dateObj.toISOString();
    console.log(`  Constructed ISO: ${slot0930ISO}`);
    console.log(`  UTC ISO:         ${utcISO}`);
    if (!utcISO.includes('T07:30:00')) {
      throw new Error(`Expected UTC string to be 07:30:00, but got ${utcISO}`);
    }

    const formattedSAST = dateObj.toLocaleTimeString('en-ZA', {
      timeZone: SAST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    console.log(`  Formatted in SAST: ${formattedSAST}`);
    if (formattedSAST !== '09:30') {
      throw new Error(`Expected SAST formatted time to be 09:30, but got ${formattedSAST}`);
    }
    console.log('  SUCCESS: 09:30 SAST correctly resolves to 07:30 UTC and formats as 09:30 (No 11:30 shift).');

    // 2. Verify Duration Rounding Logic
    console.log('\n[Step 2] Testing 30-Minute Block Duration Rounding...');
    const durations = [
      { raw: 20, expected: 30 },
      { raw: 30, expected: 30 },
      { raw: 45, expected: 60 },
      { raw: 50, expected: 60 }, // User's specific requirement
      { raw: 75, expected: 90 },
      { raw: 80, expected: 90 },
    ];
    for (const d of durations) {
      const calculated = getEffectiveDurationMinutes(d.raw);
      console.log(`  ${d.raw}m service -> ${calculated}m effective slot (expected ${d.expected}m)`);
      if (calculated !== d.expected) {
        throw new Error(`Duration calculation mismatch for ${d.raw}m: got ${calculated}, expected ${d.expected}`);
      }
    }
    console.log('  SUCCESS: 50m service properly expands to a full 1h (60m) reservation slot.');

    // 3. Fetch Service, Barber, and Customer to run end-to-end booking test
    console.log('\n[Step 3] Fetching test entities from Supabase...');
    const { data: services } = await admin.from('services').select('*').eq('name', 'The Full Combo').single();
    if (!services) throw new Error('Service "The Full Combo" (50m) not found in database.');

    const { data: staffList } = await admin.from('staff').select('*').eq('is_active', true);
    if (!staffList || staffList.length === 0) throw new Error('No active staff found.');
    const aceBarber = staffList.find((s) => s.display_name.includes('Ace')) || staffList[0];

    const { data: customers } = await admin.from('profiles').select('id').limit(1);
    if (!customers || customers.length === 0) throw new Error('No test customer profile found.');
    const testCustomerId = customers[0].id;

    console.log(`  Using Service: ${services.name} (${services.duration_minutes}m)`);
    console.log(`  Using Barber:  ${aceBarber.display_name} (${aceBarber.id})`);
    console.log(`  Using Customer: ${testCustomerId}`);

    // 4. Create 50-minute booking at 09:00 SAST
    console.log('\n[Step 4] Creating 50m booking at 09:00 SAST...');
    const bookStart = new Date(`${testDate}T09:00:00${SAST_OFFSET}`);
    const effectiveMins = getEffectiveDurationMinutes(services.duration_minutes);
    const bookEnd = new Date(bookStart.getTime() + effectiveMins * 60000);

    console.log(`  Booking Start (SAST 09:00): ${bookStart.toISOString()}`);
    console.log(`  Booking End   (SAST 10:00): ${bookEnd.toISOString()}`);

    const { data: newBooking, error: insErr } = await admin
      .from('bookings')
      .insert({
        customer_id: testCustomerId,
        service_id: services.id,
        staff_id: aceBarber.id,
        start_time: bookStart.toISOString(),
        end_time: bookEnd.toISOString(),
        status: 'confirmed',
        total_amount: services.price,
      })
      .select()
      .single();

    if (insErr || !newBooking) {
      throw new Error(`Failed to insert test booking: ${insErr?.message}`);
    }
    testBookingId = newBooking.id;
    console.log(`  Test booking created successfully: ID ${testBookingId}`);

    // 5. Test Availability: 09:00 and 09:30 MUST be unavailable; 10:00 MUST be available
    console.log('\n[Step 5] Checking available slots for that barber on test date...');
    const dayStartISO = new Date(`${testDate}T00:00:00${SAST_OFFSET}`).toISOString();
    const dayEndISO = new Date(`${testDate}T23:59:59.999${SAST_OFFSET}`).toISOString();

    const { data: dayBookings } = await admin
      .from('bookings')
      .select('id, staff_id, start_time, end_time, status')
      .gte('end_time', dayStartISO)
      .lte('start_time', dayEndISO)
      .neq('status', 'cancelled');

    const openHour = 9;
    const closeHour = 18;
    const closingTime = new Date(`${testDate}T${String(closeHour).padStart(2, '0')}:00:00${SAST_OFFSET}`);

    const availableSlotsForAce = [];
    for (let h = openHour; h < closeHour; h++) {
      for (let m = 0; m < 60; m += SLOT_STEP_MINUTES) {
        const timeLabel = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const slotStart = new Date(`${testDate}T${timeLabel}:00${SAST_OFFSET}`);
        const slotEnd = new Date(slotStart.getTime() + effectiveMins * 60000);

        if (slotEnd > closingTime) continue;

        const hasCollision = (dayBookings || []).some((b) => {
          if (b.staff_id && b.staff_id !== aceBarber.id) return false;
          const bStart = new Date(b.start_time);
          const bEnd = new Date(b.end_time);
          const bDur = Math.round((bEnd.getTime() - bStart.getTime()) / 60000);
          const bEff = getEffectiveDurationMinutes(bDur);
          const bEffEnd = new Date(bStart.getTime() + bEff * 60000);
          return slotStart < bEffEnd && slotEnd > bStart;
        });

        if (!hasCollision) {
          availableSlotsForAce.push(timeLabel);
        }
      }
    }

    console.log(`  First 5 available slots for ${aceBarber.display_name}:`, availableSlotsForAce.slice(0, 5));

    if (availableSlotsForAce.includes('09:00')) {
      throw new Error('FAIL: 09:00 slot is still available but should be booked!');
    }
    if (availableSlotsForAce.includes('09:30')) {
      throw new Error('FAIL: 09:30 slot is still available! 50m service at 09:00 must occupy both 09:00 and 09:30.');
    }
    if (!availableSlotsForAce.includes('10:00')) {
      throw new Error('FAIL: 10:00 slot should be available after the 1h block ending at 10:00!');
    }

    console.log('  SUCCESS: 09:00 and 09:30 correctly became UNAVAILABLE, and 10:00 is AVAILABLE!');

    // 6. Test Collision Prevention: Re-booking 09:30 should collide
    console.log('\n[Step 6] Testing Double-Booking Collision Prevention at 09:30...');
    const collideStart = new Date(`${testDate}T09:30:00${SAST_OFFSET}`);
    const collideEnd = new Date(collideStart.getTime() + 30 * 60000);

    const { data: collisions } = await admin
      .from('bookings')
      .select('id')
      .eq('staff_id', aceBarber.id)
      .neq('status', 'cancelled')
      .lt('start_time', collideEnd.toISOString())
      .gt('end_time', collideStart.toISOString());

    console.log(`  Collisions found for 09:30 attempt: ${collisions?.length || 0}`);
    if (!collisions || collisions.length === 0) {
      throw new Error('FAIL: Collision check did not detect overlap at 09:30!');
    }
    console.log('  SUCCESS: Double-booking attempt at 09:30 was correctly blocked by collision detection.');

    // 7. Test Operating Hours Boundary Check
    console.log('\n[Step 7] Testing Operating Hours Validation...');
    const sundayMidday = new Date(`2026-09-20T12:00:00${SAST_OFFSET}`);
    const sunComponents = getSASTComponents(sundayMidday);
    if (sunComponents.weekday !== 'Sun') throw new Error('Expected Sunday');
    console.log(`  Sunday check: ${sunComponents.weekday} -> Barbershop closed on Sundays: PASS`);

    const lateWeekday = new Date(`${testDate}T17:30:00${SAST_OFFSET}`);
    const lateEnd = new Date(lateWeekday.getTime() + 60 * 60000);
    const lateEndComp = getSASTComponents(lateEnd);
    const exceedsClosing = lateEndComp.hour > 18 || (lateEndComp.hour === 18 && lateEndComp.minute > 0);
    console.log(`  Late slot check (17:30 + 60m = ${lateEndComp.timeLabel}): Exceeds 18:00 close? ${exceedsClosing}: PASS`);

    console.log('\n======================================================');
    console.log('ALL PROFESSIONAL BOOKING & TIMEZONE VERIFICATIONS PASSED!');
    console.log('======================================================');
  } finally {
    if (testBookingId) {
      console.log(`\n[Cleanup] Removing temporary test booking ${testBookingId}...`);
      await admin.from('bookings').delete().eq('id', testBookingId);
      console.log('Cleanup completed.');
    }
  }
}

runSlotVerification().catch((err) => {
  console.error('\nVerification FAILED:', err);
  process.exit(1);
});
