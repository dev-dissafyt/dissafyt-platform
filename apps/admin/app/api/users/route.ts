import { NextRequest, NextResponse } from 'next/server';
import { AdminUserService } from '@dissafyt/api';

export async function GET() {
  const users = await AdminUserService.listUsers();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role, action } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    if (action === 'revoke') {
      const result = await AdminUserService.revokeRole(userId, role);
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, message: `Role ${role} revoked` });
    } else {
      const result = await AdminUserService.assignRole(userId, role);
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, message: `Role ${role} assigned` });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
