import { NextResponse } from 'next/server';
import { ReportingService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/payments
 * Returns unified payment audit records across all platform transactions.
 */
export async function GET() {
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
