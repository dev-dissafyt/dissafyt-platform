import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/services/location-pricing
 * Updates or sets branch-specific price overrides and availability for a service.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'service:edit');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const { service_id, location_id, price, is_available, custom_duration_minutes } = body;

    if (!service_id || !location_id) {
      return NextResponse.json(
        { error: 'service_id and location_id are required' },
        { status: 400 }
      );
    }

    if (auth.role === 'barbershop_manager' && auth.locationId && location_id !== auth.locationId) {
      return NextResponse.json(
        { error: 'Forbidden: Branch managers can only configure pricing overrides for their assigned location.' },
        { status: 403 }
      );
    }

    const result = await AdminBarbershopService.updateServiceLocationPricing(
      service_id,
      location_id,
      {
        price:
          price === null || price === undefined || price === ''
            ? null
            : Number(price),
        is_available:
          is_available !== undefined ? Boolean(is_available) : undefined,
        custom_duration_minutes:
          custom_duration_minutes !== undefined && custom_duration_minutes !== null
            ? Number(custom_duration_minutes)
            : undefined,
      },
      { email: auth.email, role: auth.role }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.serviceLocation, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to update location service pricing' },
      { status: 400 }
    );
  }
}
