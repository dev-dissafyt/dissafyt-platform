import { NextResponse } from 'next/server';
import { BarbershopService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/staff
 * Returns all active barbers/staff for customer selection.
 */
export async function GET() {
  try {
    const staff = await BarbershopService.listActiveStaff();
    return NextResponse.json(staff);
  } catch (error: any) {
    console.error('Failed to fetch staff:', error);
    return NextResponse.json({ error: 'Failed to retrieve barbers' }, { status: 500 });
  }
}
