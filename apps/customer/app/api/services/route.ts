import { NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';

export async function GET() {
  const services = await AdminBarbershopService.listServices();
  const activeServices = services.filter((s) => s.is_active);
  return NextResponse.json(activeServices);
}
