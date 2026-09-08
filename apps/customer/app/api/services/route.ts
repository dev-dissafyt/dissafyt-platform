import { NextResponse } from 'next/server';
import { AdminBarbershopService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const services = await AdminBarbershopService.listServices();
  const activeServices = services.filter((s) => s.is_active);
  return NextResponse.json(activeServices);
}
