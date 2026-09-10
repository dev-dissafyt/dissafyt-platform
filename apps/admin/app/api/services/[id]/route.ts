import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth(request, 'service:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const id = params.id;
    const body = await request.json();

    const result = await AdminBarbershopService.updateService(id, body, {
      email: auth.email,
      role: auth.role,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.service);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth(request, 'service:delete');
  if (isAuthFailure(auth)) return auth;

  const id = params.id;
  const result = await AdminBarbershopService.deleteService(id, {
    email: auth.email,
    role: auth.role,
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}


