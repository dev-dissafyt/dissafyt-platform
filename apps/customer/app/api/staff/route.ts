import { NextRequest, NextResponse } from 'next/server';
import { BarbershopService, AdminBarbershopService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/staff
 * Returns all active barbers/staff for customer selection, or all staff for admin.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdminRequest =
      searchParams.get('scope') === 'admin' ||
      request.headers.has('x-admin-role') ||
      request.cookies.has('dissafyt_admin_token');

    if (isAdminRequest) {
      const auth = await requireAdminAuth(request);
      if (!isAuthFailure(auth)) {
        const staff = await AdminBarbershopService.listStaff();
        return NextResponse.json(staff);
      }
    }

    const staff = await BarbershopService.listActiveStaff();
    return NextResponse.json(staff);
  } catch (error: any) {
    console.error('Failed to fetch staff:', error);
    return NextResponse.json({ error: 'Failed to retrieve barbers' }, { status: 500 });
  }
}

/**
 * POST /api/staff
 * Creates a new barber / staff member (requires staff:create).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'staff:create');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    if (!body.display_name) {
      return NextResponse.json({ error: 'Staff display_name is required' }, { status: 400 });
    }

    const result = await AdminBarbershopService.createStaff(body, {
      email: auth.email,
      role: auth.role,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.staff, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
