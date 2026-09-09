import { NextRequest, NextResponse } from 'next/server';
import { StudioService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { status, tracking_number } = body;
    const actorEmail = request.headers.get('x-admin-email') || 'factory@dissafyt.com';
    const actorRole = request.headers.get('x-admin-role') || 'staff';

    const result = await StudioService.updateJobStatus(params.id, status, tracking_number, {
      email: actorEmail,
      role: actorRole,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.printJob);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
