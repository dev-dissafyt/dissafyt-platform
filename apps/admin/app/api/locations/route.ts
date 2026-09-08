import { NextRequest, NextResponse } from 'next/server';
import { BarbershopService, RBACService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/locations
 * Returns barbershop locations with studio metadata for operations.
 */
export async function GET() {
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
  const email = request.headers.get('x-admin-email') || 'admin@dissafyt.com';
  const role = request.headers.get('x-admin-role') || 'admin';

  if (!RBACService.hasPermission(role, 'location:create')) {
    return NextResponse.json(
      { error: 'Forbidden: RBAC restricts studio registration to administrators.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const result = await BarbershopService.createLocation(body, { email, role });
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to create location' }, { status: 400 });
    }
    return NextResponse.json(result.location, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

