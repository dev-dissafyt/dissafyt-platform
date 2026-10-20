import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('location_id') || searchParams.get('locationId') || undefined;
  const isAdminRequest =
    searchParams.get('scope') === 'admin' ||
    request.headers.has('x-admin-role') ||
    request.cookies.has('dissafyt_admin_token');

  const services = await AdminBarbershopService.listServices(locationId);

  if (isAdminRequest) {
    const auth = await requireAdminAuth(request);
    if (!isAuthFailure(auth)) {
      return NextResponse.json(services);
    }
  }

  const activeServices = services
    .filter((s) => {
      if (!s.is_active) return false;
      if (locationId && locationId !== 'all' && s.is_available_at_location === false) return false;
      return true;
    })
    .map((s) => ({
      ...s,
      price: s.effective_price ?? s.price,
    }));

  return NextResponse.json(activeServices);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'service:create');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    if (!body.name || body.price === undefined) {
      return NextResponse.json({ error: 'Service name and price are required' }, { status: 400 });
    }

    const result = await AdminBarbershopService.createService(
      {
        name: body.name,
        description: body.description,
        duration_minutes: Number(body.duration_minutes) || 30,
        price: Number(body.price),
        is_active: body.is_active !== undefined ? body.is_active : true,
        is_subscription: body.is_subscription,
        plan_code: body.plan_code,
        billing_frequency: body.billing_frequency,
        billing_cycles: body.billing_cycles,
      },
      { email: auth.email, role: auth.role }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.service, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
