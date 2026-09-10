import { NextRequest, NextResponse } from 'next/server';
import { AdminProductService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth(request, 'product:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const id = params.id;
    const body = await request.json();

    const result = await AdminProductService.updateProduct(id, body, {
      id: auth.userId,
      email: auth.email,
      role: auth.role,
    });
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
  const auth = await requireAdminAuth(request, 'product:delete');
  if (isAuthFailure(auth)) return auth;

  const id = params.id;
  const result = await AdminProductService.deleteProduct(id, {
    id: auth.userId,
    email: auth.email,
    role: auth.role,
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}


