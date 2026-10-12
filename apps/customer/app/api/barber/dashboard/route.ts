import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { AuditService, AuthService, StaffVaultService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function resolveCallerContext(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    token =
      request.cookies.get('dissafyt_admin_token')?.value ||
      request.cookies.get('dissafyt_pos_token')?.value ||
      null;
  }

  if (!token) return null;
  const authCtx = await AuthService.verifyToken(token);
  if (!authCtx || !authCtx.userId) return null;

  const admin = getSupabaseAdminClient();
  const userEmail = (authCtx.email || '').toLowerCase();
  let roles: string[] = authCtx.roles || [];

  try {
    const { data: dbRoles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', authCtx.userId);
    if (dbRoles && dbRoles.length > 0) {
      roles = dbRoles.map((r: any) => r.role);
    }
  } catch {
    // ignore
  }

  const isAdmin =
    userEmail === 'curtislee@dissafyt.com' ||
    userEmail === 'dissafyt@gmail.com' ||
    roles.includes('admin');
  const isStaff = isAdmin || roles.includes('staff') || roles.includes('barber');

  return {
    userId: authCtx.userId,
    email: userEmail,
    isAdmin,
    isStaff,
  };
}

/**
 * GET /api/barber/dashboard
 * Returns specialist (barber / nail tech / beautician) profile, appointments,
 * and client cashflow with platform split. Requires authenticated specialist or admin session.
 */
export async function GET(request: NextRequest) {
  try {
    const caller = await resolveCallerContext(request);
    if (!caller || !caller.isStaff) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in with your specialist or administrator account.' },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const requestedStaffId = searchParams.get('staff_id');
    let staffMember: any = null;

    // Only platform admins may inspect an arbitrary staff_id
    if (requestedStaffId && caller.isAdmin) {
      const { data: st } = await admin
        .from('staff')
        .select('*, location:locations(*)')
        .eq('id', requestedStaffId)
        .maybeSingle();
      if (st) staffMember = st;
    }

    // Match specialist by their own authenticated user_id
    if (!staffMember && caller.userId) {
      const { data: st } = await admin
        .from('staff')
        .select('*, location:locations(*)')
        .eq('user_id', caller.userId)
        .maybeSingle();
      if (st) staffMember = st;
    }

    // Fallback: match by authenticated email or flagship lead specialist for admin
    if (!staffMember && caller.email) {
      const { data: st } = await admin
        .from('staff')
        .select('*, location:locations(*)')
        .ilike('bio', `%${caller.email}%`)
        .maybeSingle();
      if (st) staffMember = st;
    }

    if (!staffMember && caller.isAdmin) {
      const { data: defaultSpecialists } = await admin
        .from('staff')
        .select('*, location:locations(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1);
      if (defaultSpecialists && defaultSpecialists.length > 0) {
        staffMember = defaultSpecialists[0];
      }
    }

    if (!staffMember) {
      return NextResponse.json({ error: 'No specialist profile linked to your account.' }, { status: 404 });
    }

    // Fetch all bookings assigned to this specialist
    const { data: bookings, error: bErr } = await admin
      .from('bookings')
      .select(`
        id,
        customer_id,
        service_id,
        staff_id,
        location_id,
        start_time,
        end_time,
        status,
        total_amount,
        payment_status,
        is_subscription_covered,
        notes,
        created_at,
        customer:profiles(id, full_name, email, phone),
        service:services(id, name, duration_minutes, price),
        location:locations(id, name, address, city, google_maps_url)
      `)
      .eq('staff_id', staffMember.id)
      .order('start_time', { ascending: false });

    if (bErr) {
      console.error('[BarberDashboard] Error fetching bookings:', bErr);
    }

    const bookingList = bookings || [];
    const splitPct = Number(staffMember.commission_split_pct || 15.0);

    let grossTotal = 0;
    let platformFeeTotal = 0;
    let netBarberTotal = 0;
    let paidTotal = 0;
    let pendingChairTotal = 0;

    const cashflowPerClient = bookingList.map((b: any) => {
      const servicePrice = Number(b.service?.price || 0);
      const isSub = Boolean(b.is_subscription_covered || b.payment_status === 'membership_covered');

      const gross = Number(b.total_amount) > 0 ? Number(b.total_amount) : isSub ? servicePrice : 0;
      const platformCut = Number((gross * (splitPct / 100)).toFixed(2));
      const barberPayout = Number((gross - platformCut).toFixed(2));

      if (b.status !== 'cancelled') {
        grossTotal += gross;
        platformFeeTotal += platformCut;
        netBarberTotal += barberPayout;

        if (b.payment_status === 'paid_online' || isSub) {
          paidTotal += barberPayout;
        } else if (b.payment_status === 'unpaid' || b.payment_status === 'paid_in_chair') {
          pendingChairTotal += barberPayout;
        }
      }

      return {
        bookingId: b.id,
        clientName: b.customer?.full_name || 'Guest Client',
        clientEmail: b.customer?.email || null,
        clientPhone: b.customer?.phone || null,
        serviceName: b.service?.name || 'Studio Session',
        startTime: b.start_time,
        endTime: b.end_time,
        status: b.status,
        paymentStatus: b.payment_status,
        isSubscriptionCovered: isSub,
        grossAmount: gross,
        platformFeePct: splitPct,
        platformFeeAmount: platformCut,
        netBarberAmount: barberPayout,
        locationName: b.location?.name || staffMember.location?.name || 'Dissafyt Studio - Bernie',
        notes: b.notes,
      };
    });

    const safeStaff = StaffVaultService.formatStaffForAuthorizedView(staffMember);

    return NextResponse.json(
      {
        barber: {
          id: safeStaff.id,
          user_id: safeStaff.user_id,
          display_name: safeStaff.display_name,
          specialty: safeStaff.specialty || 'barber',
          bio: safeStaff.bio,
          phone: safeStaff.phone,
          avatar_url: safeStaff.avatar_url,
          location_id: safeStaff.location_id,
          location: safeStaff.location,
          commission_split_pct: splitPct,
          payfast_merchant_id: safeStaff.payfast_merchant_id || null,
          bank_name: safeStaff.bank_name || null,
          bank_account_number: safeStaff.bank_account_number || null,
          bank_account_type: safeStaff.bank_account_type || 'cheque',
          bank_branch_code: safeStaff.bank_branch_code || null,
          bank_account_hash: safeStaff.bank_account_hash || null,
          has_station_pin: Boolean(safeStaff.has_station_pin),
          pos_terminal_id: safeStaff.pos_terminal_id || null,
        },
        summary: {
          totalBookings: bookingList.length,
          grossRevenue: Number(grossTotal.toFixed(2)),
          platformSplitPct: splitPct,
          platformFees: Number(platformFeeTotal.toFixed(2)),
          netBarberPayout: Number(netBarberTotal.toFixed(2)),
          settledPayouts: Number(paidTotal.toFixed(2)),
          pendingChairCash: Number(pendingChairTotal.toFixed(2)),
        },
        cashflow: cashflowPerClient,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('[BarberDashboard] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal dashboard error' }, { status: 500 });
  }
}

/**
 * PATCH /api/barber/dashboard
 * Updates the specialist's payout settings with AES-256-GCM encryption, SHA-256 bank hashing,
 * and scrypt Station PIN verification.
 */
export async function PATCH(request: NextRequest) {
  try {
    const caller = await resolveCallerContext(request);
    if (!caller || !caller.isStaff) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid specialist or admin session required to update payout details.' },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdminClient();
    const body = await request.json();
    const {
      staff_id,
      payfast_merchant_id,
      bank_name,
      bank_account_number,
      bank_account_type,
      bank_branch_code,
      phone,
      station_pin,
      new_station_pin,
    } = body;

    if (!staff_id) {
      return NextResponse.json({ error: 'staff_id is required' }, { status: 400 });
    }

    const { data: existingStaff, error: fetchErr } = await admin
      .from('staff')
      .select('*')
      .eq('id', staff_id)
      .maybeSingle();

    if (fetchErr || !existingStaff) {
      return NextResponse.json({ error: 'Specialist record not found' }, { status: 404 });
    }

    // Enforce ownership unless caller is a platform admin
    const isOwner =
      existingStaff.user_id === caller.userId ||
      (caller.email && existingStaff.bio?.toLowerCase().includes(caller.email));
    if (!caller.isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden: You may only modify your own station payout settings.' },
        { status: 403 }
      );
    }

    // Verify existing Station PIN if configured on this specialist profile
    if (existingStaff.station_pin_hash && !caller.isAdmin) {
      const pinValid = StaffVaultService.verifyStationPin(station_pin, existingStaff.station_pin_hash);
      if (!pinValid) {
        return NextResponse.json(
          { error: 'Invalid Station Security PIN. Please enter your current PIN to unlock payout changes.' },
          { status: 403 }
        );
      }
    }

    const updatePayload: any = {};
    if (payfast_merchant_id !== undefined) {
      updatePayload.payfast_merchant_id = StaffVaultService.encryptField(payfast_merchant_id);
    }
    if (bank_name !== undefined) {
      updatePayload.bank_name = bank_name?.trim() || null;
    }
    if (bank_account_number !== undefined && !StaffVaultService.isMaskedValue(bank_account_number)) {
      updatePayload.bank_account_number = StaffVaultService.encryptField(bank_account_number);
      updatePayload.bank_account_hash = StaffVaultService.hashBankAccount(bank_account_number);
    }
    if (bank_account_type !== undefined) {
      updatePayload.bank_account_type = bank_account_type?.trim() || 'cheque';
    }
    if (bank_branch_code !== undefined && !StaffVaultService.isMaskedValue(bank_branch_code)) {
      updatePayload.bank_branch_code = StaffVaultService.encryptField(bank_branch_code);
    }
    if (phone !== undefined) {
      updatePayload.phone = phone?.trim() || null;
    }
    if (new_station_pin && String(new_station_pin).trim().length >= 4) {
      updatePayload.station_pin_hash = StaffVaultService.hashStationPin(String(new_station_pin));
    }

    const { data: updated, error } = await admin
      .from('staff')
      .update(updatePayload)
      .eq('id', staff_id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const safeUpdated = StaffVaultService.formatStaffForAuthorizedView(updated);

    await AuditService.recordLog({
      actor_email: caller.email || 'specialist@dissafyt.com',
      actor_role: caller.isAdmin ? 'admin' : 'staff',
      action: 'staff.update',
      entity_type: 'staff',
      entity_id: staff_id,
      entity_name: updated.display_name,
      changes: {
        bank_name: safeUpdated.bank_name,
        bank_account_masked: safeUpdated.bank_account_masked,
        bank_account_hash: safeUpdated.bank_account_hash,
        has_station_pin: safeUpdated.has_station_pin,
      },
    });

    return NextResponse.json({ success: true, staff: safeUpdated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
}
