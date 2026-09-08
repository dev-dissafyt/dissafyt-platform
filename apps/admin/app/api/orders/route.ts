import { NextResponse } from 'next/server';
import { OrderService } from '@dissafyt/api';

export async function GET() {
  const orders = await OrderService.listAdminOrders();
  return NextResponse.json(orders);
}
