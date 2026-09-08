import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/staff/[id]
 * Updates staff member details or active status.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const result = await AdminBarbershopService.updateStaff(params.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update staff' }, { status: 400 });
    }

    return NextResponse.json(result.staff);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * DELETE /api/staff/[id]
 * Deletes a staff member.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await AdminBarbershopService.deleteStaff(params.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete staff' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
