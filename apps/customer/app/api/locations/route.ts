import { NextResponse } from 'next/server';
import { BarbershopService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/locations
 * Returns active barbershop physical locations / studios.
 */
export async function GET() {
  try {
    const locations = await BarbershopService.listLocations();
    return NextResponse.json(locations, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
