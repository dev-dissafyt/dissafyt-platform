import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService, RBACService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/staff/[id]
 * Updates staff member details or active status with RBAC authorization and audit logging.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const email = request.headers.get('x-admin-email') || 'admin@dissafyt.com';
  const role = request.headers.get('x-admin-role') || 'admin';

  if (!RBACService.hasPermission(role, 'staff:edit')) {
    return NextResponse.json(
      { error: 'Forbidden: RBAC restricts staff updates to authorized roles.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const result = await AdminBarbershopService.updateStaff(params.id, body, { email, role });

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
  const email = request.headers.get('x-admin-email') || 'admin@dissafyt.com';
  const role = request.headers.get('x-admin-role') || 'admin';

  if (!RBACService.hasPermission(role, 'staff:delete')) {
    return NextResponse.json(
      { error: 'Forbidden: RBAC restricts staff deletion to platform administrators.' },
      { status: 403 }
    );
  }

  try {
    const result = await AdminBarbershopService.deleteStaff(params.id, { email, role });
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete staff' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

