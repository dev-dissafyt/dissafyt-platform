import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/staff/[id]
 * Updates staff member details or active status with RBAC authorization and audit logging.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth(request, 'staff:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const result = await AdminBarbershopService.updateStaff(params.id, body, {
      email: auth.email,
      role: auth.role,
    });

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
 * Deletes a staff member with RBAC authorization and audit logging.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth(request, 'staff:delete');
  if (isAuthFailure(auth)) return auth;

  try {
    const result = await AdminBarbershopService.deleteStaff(params.id, {
      email: auth.email,
      role: auth.role,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete staff' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}


