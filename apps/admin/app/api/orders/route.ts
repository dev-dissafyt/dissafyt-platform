import { NextResponse } from 'next/server';
import { OrderService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const orders = await OrderService.listAdminOrders();
  return NextResponse.json(orders);
}
