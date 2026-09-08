import { NextRequest, NextResponse } from 'next/server';
import { AdminProductService, RBACService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const email = request.headers.get('x-admin-email') || 'admin@dissafyt.com';
  const role = request.headers.get('x-admin-role') || 'admin';

  if (!RBACService.hasPermission(role, 'product:edit')) {
    return NextResponse.json(
      { error: 'Forbidden: RBAC restricts product editing to authorized personnel.' },
      { status: 403 }
    );
  }

  try {
    const id = params.id;
    const body = await request.json();

    const result = await AdminProductService.updateProduct(id, body, { email, role });
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
  const email = request.headers.get('x-admin-email') || 'admin@dissafyt.com';
  const role = request.headers.get('x-admin-role') || 'admin';

  if (!RBACService.hasPermission(role, 'product:delete')) {
    return NextResponse.json(
      { error: 'Forbidden: RBAC restricts product deletion to platform administrators.' },
      { status: 403 }
    );
  }

  const id = params.id;
  const result = await AdminProductService.deleteProduct(id, { email, role });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

