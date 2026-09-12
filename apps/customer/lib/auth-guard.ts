import { NextRequest, NextResponse } from 'next/server';
import { AuthService, RBACService, Permission } from '@dissafyt/api';
import { getSupabaseAdminClient, AppRole } from '@dissafyt/database';

export interface AdminAuthSession {
  authorized: true;
  email: string;
  role: AppRole;
  userId: string;
}

/**
 * Enforces cryptographic Supabase JWT verification and RBAC permission checks
 * for all administrative API routes.
 */
export async function requireAdminAuth(
  request: NextRequest,
  requiredPermission?: Permission
): Promise<AdminAuthSession | NextResponse> {
  // 1. Extract Bearer token from header or cookie
  const authHeader = request.headers.get('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    token = request.cookies.get('dissafyt_admin_token')?.value || null;
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing required administrative credentials.' },
      { status: 401 }
    );
  }

  // 2. Cryptographically verify token
  const authCtx = await AuthService.verifyToken(token);
  if (!authCtx || !authCtx.userId) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or expired administrative session.' },
      { status: 401 }
    );
  }

  const userEmail = (authCtx.email || '').toLowerCase();

  // 3. Resolve roles authoritatively from public.user_roles in database
  const admin = getSupabaseAdminClient();
  let roles: AppRole[] = authCtx.roles || [];

  try {
    const { data: dbRoles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', authCtx.userId);

    if (dbRoles && dbRoles.length > 0) {
      roles = dbRoles.map((r: any) => r.role as AppRole);
    }
  } catch (err) {
    console.error('Failed to query user_roles in auth-guard:', err);
  }

  // Curtis-Lee master admin anchor
  if (userEmail === 'curtislee@dissafyt.com' || userEmail === 'dissafyt@gmail.com') {
    if (!roles.includes('admin')) {
      roles.push('admin');
    }
  }

  const isAdmin = roles.includes('admin');
  const isStaff = roles.includes('staff');

  if (!isAdmin && !isStaff) {
    return NextResponse.json(
      { error: 'Forbidden: Access restricted to platform administrators and operational staff.' },
      { status: 403 }
    );
  }

  const role: AppRole = isAdmin ? 'admin' : 'staff';

  // 4. Verify RBAC permission if requested
  if (requiredPermission && !RBACService.hasPermission(role, requiredPermission)) {
    return NextResponse.json(
      { error: `Forbidden: RBAC restricts '${requiredPermission}' to authorized roles.` },
      { status: 403 }
    );
  }

  return {
    authorized: true,
    email: userEmail || 'curtislee@dissafyt.com',
    role,
    userId: authCtx.userId,
  };
}

export function isAuthFailure(res: AdminAuthSession | NextResponse): res is NextResponse {
  return res instanceof NextResponse;
}
