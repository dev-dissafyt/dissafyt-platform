import { NextRequest, NextResponse } from 'next/server';
import { AdminProductService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  const categories = await AdminProductService.listCategories();
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'product:create');
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    const result = await AdminProductService.createCategory(body.name, body.description);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.category, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}

