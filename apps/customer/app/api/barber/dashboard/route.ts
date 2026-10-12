import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { AuditService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/barber/dashboard
 * Returns barber profile, appointments, and client cashflow with platform split.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdminClient();
    const { searchParams } = new URL(request.url);

    // 1. Resolve user token from header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string | null = null;
    let userEmail: string | null = null;

    if (token) {
      const { data: userData } = await admin.auth.getUser(token);
      if (userData?.user) {
        userId = userData.user.id;
        userEmail = userData.user.email || null;
      }
    }

    // 2. Resolve Staff Profile
    const requestedStaffId = searchParams.get('staff_id');
    let staffMember: any = null;

    if (requestedStaffId) {
      const { data: st } = await admin.from('staff').select('*, location:locations(*)').eq('id', requestedStaffId).maybeSingle();
      if (st) staffMember = st;
    }

    if (!staffMember && userId) {
      const { data: st } = await admin.from('staff').select('*, location:locations(*)').eq('user_id', userId).maybeSingle();
      if (st) staffMember = st;
    }

    // Fallback: match by email or return first active barber if admin/developer requesting
    if (!staffMember && userEmail) {
      const { data: st } = await admin.from('staff').select('*, location:locations(*)').ilike('bio', `%${userEmail}%`).maybeSingle();
      if (st) staffMember = st;
    }

    // Default to flagship lead barber if unassigned or demo mode
    if (!staffMember) {
      const { data: defaultBarbers } = await admin.from('staff').select('*, location:locations(*)').eq('is_active', true).order('created_at', { ascending: true }).limit(1);
      if (defaultBarbers && defaultBarbers.length > 0) {
        staffMember = defaultBarbers[0];
      }
    }

    if (!staffMember) {
      return NextResponse.json({ error: 'No barber profile found' }, { status: 404 });
    }

    // 3. Fetch all bookings assigned to this barber
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
    const splitPct = Number(staffMember.commission_split_pct || 15.00); // Platform %

    // 4. Calculate cashflow per client
    let grossTotal = 0;
    let platformFeeTotal = 0;
    let netBarberTotal = 0;
    let paidTotal = 0;
    let pendingChairTotal = 0;

    const cashflowPerClient = bookingList.map((b: any) => {
      const servicePrice = Number(b.service?.price || 0);
      const isSub = Boolean(b.is_subscription_covered || b.payment_status === 'membership_covered');
      
      // If subscription covered, customer paid R0 at booking, but platform attributes standard tier value
      const gross = Number(b.total_amount) > 0 ? Number(b.total_amount) : (isSub ? servicePrice : 0);
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
        serviceName: b.service?.name || 'Studio Cut',
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

    return NextResponse.json({
      barber: {
        id: staffMember.id,
        user_id: staffMember.user_id,
        display_name: staffMember.display_name,
        bio: staffMember.bio,
        phone: staffMember.phone,
        avatar_url: staffMember.avatar_url,
        location_id: staffMember.location_id,
        location: staffMember.location,
        commission_split_pct: splitPct,
        payfast_merchant_id: staffMember.payfast_merchant_id || null,
        bank_name: staffMember.bank_name || null,
        bank_account_number: staffMember.bank_account_number || null,
        bank_account_type: staffMember.bank_account_type || 'cheque',
        bank_branch_code: staffMember.bank_branch_code || null,
        pos_terminal_id: staffMember.pos_terminal_id || null,
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
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[BarberDashboard] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal dashboard error' }, { status: 500 });
  }
}

/**
 * PATCH /api/barber/dashboard
 * Updates the barber's payout settings (PayFast merchant ID/email, bank account details).
 */
export async function PATCH(request: NextRequest) {
  try {
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
    } = body;

    if (!staff_id) {
      return NextResponse.json({ error: 'staff_id is required' }, { status: 400 });
    }

    const updatePayload: any = {};
    if (payfast_merchant_id !== undefined) updatePayload.payfast_merchant_id = payfast_merchant_id?.trim() || null;
    if (bank_name !== undefined) updatePayload.bank_name = bank_name?.trim() || null;
    if (bank_account_number !== undefined) updatePayload.bank_account_number = bank_account_number?.trim() || null;
    if (bank_account_type !== undefined) updatePayload.bank_account_type = bank_account_type?.trim() || 'cheque';
    if (bank_branch_code !== undefined) updatePayload.bank_branch_code = bank_branch_code?.trim() || null;
    if (phone !== undefined) updatePayload.phone = phone?.trim() || null;

    const { data: updated, error } = await admin
      .from('staff')
      .update(updatePayload)
      .eq('id', staff_id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await AuditService.recordLog({
      actor_email: 'barber@dissafyt.com',
      actor_role: 'staff',
      action: 'staff.update',
      entity_type: 'staff',
      entity_id: staff_id,
      entity_name: updated.display_name,
      changes: updatePayload,
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
}
