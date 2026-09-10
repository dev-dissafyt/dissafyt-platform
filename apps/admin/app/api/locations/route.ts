import { NextRequest, NextResponse } from 'next/server';
import { BarbershopService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/locations
 * Returns barbershop locations with studio metadata for operations.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  try {
    const locations = await BarbershopService.listLocations();
    return NextResponse.json(locations);
  } catch (error: any) {
    console.error('Error fetching admin locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

/**
 * POST /api/locations
 * Registers a new studio location with RBAC and audit trail.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'location:create');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const result = await BarbershopService.createLocation(body, {
      email: auth.email,
      role: auth.role,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to create location' }, { status: 400 });
    }
    return NextResponse.json(result.location, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}


