import { NextRequest, NextResponse } from 'next/server';
import { StudioService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as any;
  const brandId = searchParams.get('brandId') || undefined;

  const jobs = await StudioService.listPrintJobs({ status, brandId });
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
