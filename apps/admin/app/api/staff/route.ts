import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';
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
    const locationId = searchParams.get('locationId') || undefined;
    const staff = await AdminBarbershopService.listStaff(locationId);
    return NextResponse.json(staff);
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
    const { display_name, bio, phone, is_active, user_id, location_id } = body;

    if (!display_name) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    const result = await AdminBarbershopService.createStaff(
      {
        display_name,
        bio,
        phone: phone || undefined,
        is_active: is_active !== undefined ? is_active : true,
        user_id: user_id || null,
        location_id: location_id || undefined,
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

