import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@dissafyt/api';
import { getSupabaseAdminClient, AppRole } from '@dissafyt/database';

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

export function isAuthFailure(res: StudioAuthSession | NextResponse): res is NextResponse {
  return res instanceof NextResponse;
}
