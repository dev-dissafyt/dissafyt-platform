import { NextRequest, NextResponse } from 'next/server';
import { StudioService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as any;
  const requestedBrandId = searchParams.get('brandId') || undefined;

  const role = request.headers.get('x-dissafyt-role') || request.cookies.get('dissafyt_studio_role')?.value || 'staff';
  const callerBrandId = request.headers.get('x-dissafyt-brand-id') || request.cookies.get('dissafyt_studio_brand_id')?.value;

  // Tenant Boundary Governance:
  // If caller is a creator, they may ONLY query their own brand's jobs
  let effectiveBrandId = requestedBrandId;
  if (role === 'creator') {
    if (!callerBrandId) {
      return NextResponse.json([]);
    }
    if (requestedBrandId && requestedBrandId !== callerBrandId) {
      return NextResponse.json({ error: 'Forbidden: Access to other brand jobs is prohibited' }, { status: 403 });
    }
    effectiveBrandId = callerBrandId;
  }

  const jobs = await StudioService.listPrintJobs({ status, brandId: effectiveBrandId });
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await StudioService.createPrintJob(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.printJob, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
