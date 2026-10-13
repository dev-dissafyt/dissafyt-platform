import { NextRequest, NextResponse } from 'next/server';
import { StudioService } from '@dissafyt/api';
import { requireStudioAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireStudioAuth(request, ['admin', 'staff']);
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const { status, tracking_number } = body;

    const result = await StudioService.updateJobStatus(params.id, status, tracking_number, {
      email: auth.email,
      role: auth.role,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.printJob);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
