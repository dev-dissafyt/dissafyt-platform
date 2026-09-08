import { NextRequest, NextResponse } from 'next/server';
import { BarbershopService, RBACService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * PATCH /api/locations/[id]
 * Updates studio location details with RBAC authorization and audit logging.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const email = request.headers.get('x-admin-email') || 'admin@dissafyt.com';
  const role = request.headers.get('x-admin-role') || 'admin';

  if (!RBACService.hasPermission(role, 'location:edit')) {
    return NextResponse.json(
      { error: 'Forbidden: RBAC restricts location modifications to platform administrators.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const result = await BarbershopService.updateLocation(params.id, body, { email, role });
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update location' }, { status: 400 });
    }
    return NextResponse.json(result.location);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}

/**
 * DELETE /api/locations/[id]
 * Deletes a studio location with RBAC authorization and audit logging.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const email = request.headers.get('x-admin-email') || 'admin@dissafyt.com';
  const role = request.headers.get('x-admin-role') || 'admin';

  if (!RBACService.hasPermission(role, 'location:delete')) {
    return NextResponse.json(
      { error: 'Forbidden: RBAC restricts location deletion to platform administrators.' },
      { status: 403 }
    );
  }

  try {
    const result = await BarbershopService.deleteLocation(params.id, { email, role });
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete location' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
