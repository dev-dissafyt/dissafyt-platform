import { NextRequest, NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';

export async function GET() {
  const services = await AdminBarbershopService.listServices();
  return NextResponse.json(services);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || body.price === undefined) {
      return NextResponse.json({ error: 'Service name and price are required' }, { status: 400 });
    }

    const result = await AdminBarbershopService.createService({
      name: body.name,
      description: body.description,
      duration_minutes: Number(body.duration_minutes) || 30,
      price: Number(body.price),
      is_active: body.is_active,
      is_subscription: body.is_subscription,
      plan_code: body.plan_code,
      billing_frequency: body.billing_frequency,
      billing_cycles: body.billing_cycles,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.service, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
