import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService, StaffVaultService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/staff
 * Lists all barbershop staff/barbers.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const locationParam = searchParams.get('locationId') || undefined;
    let targetLocationId = locationParam;
    if ((auth.role === 'barbershop_manager' || auth.role === 'barber') && auth.locationId) {
      targetLocationId = auth.locationId;
    }
    const staff = await AdminBarbershopService.listStaff(targetLocationId);
    if (auth.role === 'admin' || auth.role === 'barbershop_manager') {
      return NextResponse.json(staff);
    }
    const scopedStaff = staff.map((s) =>
      s.user_id && s.user_id === auth.userId ? s : StaffVaultService.sanitizePublicStaff(s)
    );
    return NextResponse.json(scopedStaff);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to list staff' }, { status: 500 });
  }
}

/**
 * POST /api/staff
 * Creates a new barber/staff member (requires staff:create).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'staff:create');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const {
      display_name,
      bio,
      phone,
      is_active,
      user_id,
      location_id,
      commission_split_pct,
      payfast_merchant_id,
      bank_name,
      bank_account_number,
      bank_account_type,
      bank_branch_code,
      pos_terminal_id,
    } = body;

    if (!display_name) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    const assignedLocationId = auth.role === 'barbershop_manager' ? (auth.locationId || location_id) : (location_id || undefined);

    const result = await AdminBarbershopService.createStaff(
      {
        display_name,
        bio,
        phone: phone || undefined,
        is_active: is_active !== undefined ? is_active : true,
        user_id: user_id || null,
        location_id: assignedLocationId,
        commission_split_pct: commission_split_pct !== undefined ? Number(commission_split_pct) : undefined,
        payfast_merchant_id: payfast_merchant_id || undefined,
        bank_name: bank_name || undefined,
        bank_account_number: bank_account_number || undefined,
        bank_account_type: bank_account_type || undefined,
        bank_branch_code: bank_branch_code || undefined,
        pos_terminal_id: pos_terminal_id || undefined,
      },
      { email: auth.email, role: auth.role }
    );

    if (!result.success || !result.staff) {
      return NextResponse.json({ error: result.error || 'Failed to create staff' }, { status: 400 });
    }

    return NextResponse.json(result.staff, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
}

