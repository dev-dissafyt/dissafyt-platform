import { NextRequest, NextResponse } from 'next/server';
import { AuthService, UserService } from '@dissafyt/api';

/**
 * GET /api/users/me
 * Retrieves current authenticated user profile and roles
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized: missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const authCtx = await AuthService.verifyToken(token);
  if (!authCtx) {
    return NextResponse.json(
      { error: 'Unauthorized: invalid or expired session' },
      { status: 401 }
    );
  }

  const profile = await UserService.getUserProfile(authCtx.userId);
  if (!profile) {
    // If profile table has not synced yet, return basic auth identity
    return NextResponse.json({
      id: authCtx.userId,
      email: authCtx.email,
      roles: authCtx.roles,
    });
  }

  return NextResponse.json(profile);
}

/**
 * PATCH /api/users/me
 * Updates current authenticated user profile
 */
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized: missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const authCtx = await AuthService.verifyToken(token);
  if (!authCtx) {
    return NextResponse.json(
      { error: 'Unauthorized: invalid or expired session' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const result = await UserService.updateProfile(authCtx, authCtx.userId, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.profile);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
