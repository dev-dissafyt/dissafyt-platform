import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/audit
 * Fetches the immutable database audit trail.
 * Strictly restricted by RBAC to 'admin' role (permission 'audit:view').
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'audit:view');
  if (isAuthFailure(auth)) return auth;

  try {
    const logs = await AuditService.listLogs(100);
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
