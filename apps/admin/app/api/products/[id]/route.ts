import { NextRequest, NextResponse } from 'next/server';
import { AdminProductService, RBACService, AuthService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function resolveAdminAuth(request: NextRequest): Promise<{ email: string; role: any } | null> {
  const authHeader = request.headers.get('Authorization');
  let email = request.headers.get('x-admin-email');
  let role = request.headers.get('x-admin-role');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const authCtx = await AuthService.verifyToken(token);
    if (authCtx) {
      email = email || authCtx.email || null;
      role = role || (authCtx.roles?.[0] as string) || null;
    }
  }

  if (!email || !role) {
    return null;
  }

  return { email, role };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await resolveAdminAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication credentials required.' },
      { status: 401 }
    );
  }

  if (!RBACService.hasPermission(auth.role, 'product:edit')) {
    return NextResponse.json(
      { error: 'Forbidden: RBAC restricts product editing to authorized personnel.' },
      { status: 403 }
    );
  }

  try {
    const id = params.id;
    const body = await request.json();

    const result = await AdminProductService.updateProduct(id, body, { email: auth.email, role: auth.role });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.product);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await resolveAdminAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication credentials required.' },
      { status: 401 }
    );
  }

  if (!RBACService.hasPermission(auth.role, 'product:delete')) {
    return NextResponse.json(
      { error: 'Forbidden: RBAC restricts product deletion to platform administrators.' },
      { status: 403 }
    );
  }

  const id = params.id;
  const result = await AdminProductService.deleteProduct(id, { email: auth.email, role: auth.role });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

