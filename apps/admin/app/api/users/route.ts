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

  const users = await AdminUserService.listUsers();
  return NextResponse.json(users);
}

/**
 * POST /api/users
 * Assigns or revokes roles (requires user:manage_roles).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'user:manage_roles');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const { userId, role, action } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    if (action === 'revoke') {
      const result = await AdminUserService.revokeRole(userId, role, { email: auth.email, role: auth.role });
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, message: `Role ${role} revoked` });
    } else {
      const result = await AdminUserService.assignRole(userId, role, { email: auth.email, role: auth.role });
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, message: `Role ${role} assigned` });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
