import { NextResponse } from 'next/server';
import { ReportingService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/reporting
 * Returns live operational metrics across commerce and barbershop domains.
 */
export async function GET() {
  try {
    const metrics = await ReportingService.getOperationalMetrics();
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Error fetching operational metrics:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch operational metrics' },
      { status: 500 }
    );
  }
}
