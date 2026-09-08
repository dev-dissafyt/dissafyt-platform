import { NextRequest, NextResponse } from 'next/server';
import { BarbershopService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/availability
 * Query parameters:
 *  - date: string (YYYY-MM-DD)
 *  - serviceId: string (UUID)
 *  - staffId: optional string (UUID or 'any')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');
    const staffId = searchParams.get('staffId');

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Parameters "date" and "serviceId" are required.' },
        { status: 400 }
      );
    }

    const result = await BarbershopService.getAvailableSlots({
      date,
      serviceId,
      staffId: staffId || undefined,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Availability API error:', error);
    return NextResponse.json({ error: 'Internal error checking availability' }, { status: 500 });
  }
}
