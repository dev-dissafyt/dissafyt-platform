import { NextRequest, NextResponse } from 'next/server';
import { AdminUserService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/bootstrap
 * Secure endpoint to promote an initial administrator.
 * Requires either an active authenticated administrator session OR a valid server bootstrap secret.
 */
export async function POST(request: NextRequest) {
  const secretHeader = request.headers.get('x-bootstrap-secret');
  const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET || 'Dissafyt_Bootstrap_Secure_2026';

  const isSecretValid = Boolean(secretHeader && secretHeader === configuredSecret);

  if (!isSecretValid) {
    const auth = await requireAdminAuth(request, 'user:manage_roles');
    if (isAuthFailure(auth)) {
      return NextResponse.json(
        { error: 'Unauthorized: Bootstrapping requires administrative authentication or server secret.' },
        { status: 401 }
      );
    }
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await AdminUserService.bootstrapAdmin(email);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
