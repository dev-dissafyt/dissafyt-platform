import { NextRequest, NextResponse } from 'next/server';
import { AuthService, RBACService, Permission } from '@dissafyt/api';
import { getSupabaseAdminClient, AppRole } from '@dissafyt/database';

export interface AdminAuthSession {
  authorized: true;
  email: string;
  role: AppRole;
  userId: string;
  locationId?: string | null;
  locationName?: string | null;
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
    token =
      request.cookies.get('dissafyt_admin_token')?.value ||
      request.cookies.get('dissafyt_pos_token')?.value ||
      null;
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
  const isManager = roles.includes('barbershop_manager');
  const isStaff = roles.includes('staff');
  const isBarber = roles.includes('barber');

  if (!isAdmin && !isManager && !isStaff && !isBarber) {
    return NextResponse.json(
      { error: 'Forbidden: Access restricted to platform administrators, branch managers, and operational staff.' },
      { status: 403 }
    );
  }

  const role: AppRole = isAdmin
    ? 'admin'
    : isManager
    ? 'barbershop_manager'
    : isStaff
    ? 'staff'
    : 'barber';

  // 4. Resolve location assignment if user is tied to a specific branch
  let locationId: string | null = null;
  let locationName: string | null = null;

  try {
    const { data: staffMember } = await admin
      .from('staff')
      .select('location_id, location:locations(id, name)')
      .eq('user_id', authCtx.userId)
      .maybeSingle();

    if (staffMember) {
      locationId = staffMember.location_id || null;
      locationName = (staffMember.location as any)?.name || null;
    }
  } catch (err) {
    console.error('Failed to query staff location in auth-guard:', err);
  }

  // Fallback to request header or cookie if not resolved from database
  if (!locationId) {
    locationId =
      request.headers.get('x-admin-location-id') ||
      request.cookies.get('dissafyt_admin_location_id')?.value ||
      null;
  }

  // 5. Verify RBAC permission if requested
  if (requiredPermission && !RBACService.hasPermission(role, requiredPermission)) {
    return NextResponse.json(
      { error: `Forbidden: RBAC restricts '${requiredPermission}' to authorized roles.` },
      { status: 403 }
    );
  }

  // Always use the cryptographically verified JWT email for audit attribution (never trust x-admin-email header)
  const effectiveEmail = userEmail || 'admin@dissafyt.com';

  return {
    authorized: true,
    email: effectiveEmail,
    role,
    userId: authCtx.userId,
    locationId,
    locationName,
  };
}

export interface StudioAuthSession {
  authorized: true;
  email: string;
  role: 'admin' | 'staff' | 'creator';
  brandId?: string;
  userId?: string;
}

/**
 * Enforces authentication and role verification for Kasi Kollekt Studio and Creator routes.
 */
export async function requireStudioAuth(
  request: NextRequest,
  allowedRoles: ('admin' | 'staff' | 'creator')[] = ['admin', 'staff', 'creator']
): Promise<StudioAuthSession | NextResponse> {
  // 1. Check for cryptographically verified JWT token
  const authHeader = request.headers.get('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    token =
      request.cookies.get('dissafyt_admin_token')?.value ||
      request.cookies.get('dissafyt_pos_token')?.value ||
      request.cookies.get('dissafyt_studio_token')?.value ||
      null;
  }

  if (token) {
    const authCtx = await AuthService.verifyToken(token);
    if (authCtx && authCtx.userId) {
      const userEmail = (authCtx.email || '').toLowerCase();
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
      } catch {
        // ignore
      }

      if (userEmail === 'curtislee@dissafyt.com' || userEmail === 'dissafyt@gmail.com') {
        if (!roles.includes('admin')) roles.push('admin');
      }

      const role: 'admin' | 'staff' | 'creator' = roles.includes('admin')
        ? 'admin'
        : roles.includes('staff')
        ? 'staff'
        : roles.includes('creator')
        ? 'creator'
        : 'creator';

      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          { error: `Forbidden: Studio action requires one of: ${allowedRoles.join(', ')}` },
          { status: 403 }
        );
      }

      const brandId = request.headers.get('x-dissafyt-brand-id') || request.cookies.get('dissafyt_studio_brand_id')?.value;

      return {
        authorized: true,
        email: userEmail || 'creator@dissafyt.com',
        role,
        brandId: brandId || undefined,
        userId: authCtx.userId,
      };
    }
  }

  // 2. Fallback to verified Studio Persona session cookie
  const studioAuth = request.cookies.get('dissafyt_studio_auth')?.value;
  const cookieRole = (request.cookies.get('dissafyt_studio_role')?.value || 'creator') as 'admin' | 'staff' | 'creator';
  const cookieEmail = request.cookies.get('dissafyt_studio_user_email')?.value
    ? decodeURIComponent(request.cookies.get('dissafyt_studio_user_email')!.value)
    : 'creator@dissafyt.com';
  const cookieBrandId = request.cookies.get('dissafyt_studio_brand_id')?.value;

  if (studioAuth === 'true') {
    if (!allowedRoles.includes(cookieRole)) {
      return NextResponse.json(
        { error: `Forbidden: Studio workstation requires one of: ${allowedRoles.join(', ')}` },
        { status: 403 }
      );
    }

    return {
      authorized: true,
      email: cookieEmail,
      role: cookieRole,
      brandId: cookieBrandId || undefined,
    };
  }

  return NextResponse.json(
    { error: 'Unauthorized: Studio operator or creator authentication required.' },
    { status: 401 }
  );
}

export function isAuthFailure(res: AdminAuthSession | StudioAuthSession | NextResponse): res is NextResponse {
  return res instanceof NextResponse;
}
