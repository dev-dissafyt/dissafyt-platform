import { NextRequest, NextResponse } from 'next/server';
import { StudioService } from '@dissafyt/api';
import { requireStudioAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireStudioAuth(request, ['admin', 'staff', 'creator']);
  if (isAuthFailure(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as any;
  const requestedBrandId = searchParams.get('brandId') || undefined;

  let effectiveBrandId = requestedBrandId;
  if (auth.role === 'creator') {
    const creatorOwnBrandId = auth.brandId || 'b0000000-0000-0000-0000-000000000001';
    if (requestedBrandId && requestedBrandId !== creatorOwnBrandId) {
      return NextResponse.json({ error: 'Forbidden: Access to other brand jobs is prohibited' }, { status: 403 });
    }
    effectiveBrandId = creatorOwnBrandId;
  }

  const jobs = await StudioService.listPrintJobs({ status, brandId: effectiveBrandId });
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  const auth = await requireStudioAuth(request, ['admin', 'staff']);
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const result = await StudioService.createPrintJob(body, {
      email: auth.email,
      role: auth.role,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.printJob, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
