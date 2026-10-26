import { NextRequest, NextResponse } from 'next/server';
import { AdminUserService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/users
 * Lists platform customers and roles (requires user:view).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'user:view');
  if (isAuthFailure(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    let locationId = searchParams.get('locationId') || undefined;
    if ((auth.role === 'barbershop_manager' || auth.role === 'barber') && auth.locationId) {
      locationId = auth.locationId;
    }

    const users = await AdminUserService.listUsers(locationId);
    return NextResponse.json(users);
  } catch (err: any) {
    console.error('Error fetching users in /api/users:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Assigns or revokes roles (requires user:manage_roles or branch manager permissions).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const { userId, role, action, locationId } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    // Branch managers cannot grant or revoke global 'admin' role
    if (auth.role === 'barbershop_manager' && role === 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Branch managers cannot grant or revoke global administrator privileges.' },
        { status: 403 }
      );
    }

    // Determine target location for the role assignment
    const targetLocationId =
      auth.role === 'barbershop_manager'
        ? auth.locationId || locationId || null
        : locationId || null;

    if (action === 'revoke') {
      const result = await AdminUserService.revokeRole(
        userId,
        role,
        { email: auth.email, role: auth.role },
        targetLocationId
      );
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, message: `Role ${role} revoked` });
    } else {
      const result = await AdminUserService.assignRole(
        userId,
        role,
        { email: auth.email, role: auth.role },
        targetLocationId
      );
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, message: `Role ${role} assigned` });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
