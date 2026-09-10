import { NextRequest, NextResponse } from 'next/server';
import { BarbershopService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

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
  const auth = await requireAdminAuth(request, 'location:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const result = await BarbershopService.updateLocation(params.id, body, {
      email: auth.email,
      role: auth.role,
    });
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
  const auth = await requireAdminAuth(request, 'location:delete');
  if (isAuthFailure(auth)) return auth;

  try {
    const result = await BarbershopService.deleteLocation(params.id, {
      email: auth.email,
      role: auth.role,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete location' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}

