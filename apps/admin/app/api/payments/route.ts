import { NextRequest, NextResponse } from 'next/server';
import { ReportingService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/payments
 * Returns unified payment audit records across all platform transactions.
 * Restricted by RBAC to authorized administrative/staff operators (payment:view).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'payment:view');
  if (isAuthFailure(auth)) return auth;

  try {
    const records = await ReportingService.getPaymentAuditLog();
    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Error fetching payment audit records:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch payment records' },
      { status: 500 }
    );
  }
}

