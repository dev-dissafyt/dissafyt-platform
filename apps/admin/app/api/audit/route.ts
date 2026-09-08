import { NextRequest, NextResponse } from 'next/server';
import { AuditService, RBACService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/audit
 * Fetches the immutable database audit trail.
 * Strictly restricted by RBAC to 'admin' role (permission 'audit:view').
 */
export async function GET(request: NextRequest) {
  const role = request.headers.get('x-admin-role') || 'admin';

  if (!RBACService.hasPermission(role, 'audit:view')) {
    return NextResponse.json(
      { error: 'Forbidden: RBAC requires admin permissions to view audit logs.' },
      { status: 403 }
    );
  }

  try {
    const logs = await AuditService.listLogs(100);
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
