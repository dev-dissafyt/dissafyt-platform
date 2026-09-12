import { NextRequest, NextResponse } from 'next/server';
import { ReportingService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/reporting
 * Returns live operational metrics across commerce and barbershop domains.
 * Restricted by RBAC to authorized administrative/staff operators (reporting:view).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'reporting:view');
  if (isAuthFailure(auth)) return auth;

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

