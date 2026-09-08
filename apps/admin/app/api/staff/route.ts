import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/staff
 * Lists all barbershop staff/barbers.
 */
export async function GET() {
  try {
    const staff = await AdminBarbershopService.listStaff();
    return NextResponse.json(staff);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to list staff' }, { status: 500 });
  }
}

/**
 * POST /api/staff
 * Creates a new barber/staff member.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { display_name, bio, is_active, user_id } = body;

    if (!display_name) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    const result = await AdminBarbershopService.createStaff({
      display_name,
      bio,
      is_active: is_active !== undefined ? is_active : true,
      user_id: user_id || null,
    });

    if (!result.success || !result.staff) {
      return NextResponse.json({ error: result.error || 'Failed to create staff' }, { status: 400 });
    }

    return NextResponse.json(result.staff, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
}
