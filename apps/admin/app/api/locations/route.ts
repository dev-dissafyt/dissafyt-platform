import { NextResponse } from 'next/server';
import { BarbershopService } from '@dissafyt/api';

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
