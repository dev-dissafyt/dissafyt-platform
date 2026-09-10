import { NextRequest, NextResponse } from 'next/server';
import { AdminProductService, RBACService, AuthService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function resolveAdminAuth(request: NextRequest): Promise<{ email: string; role: any } | null> {
  const authHeader = request.headers.get('Authorization');
  let email = request.headers.get('x-admin-email');
  let role = request.headers.get('x-admin-role');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const authCtx = await AuthService.verifyToken(token);
    if (authCtx) {
      email = email || authCtx.email || null;
      role = role || (authCtx.roles?.[0] as string) || null;
    }
  }

  if (!email || !role) {
    return null;
  }

  return { email, role };
}

export async function GET() {
  const products = await AdminProductService.listProducts();
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const auth = await resolveAdminAuth(request);
  if (!auth) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication credentials required.' },
      { status: 401 }
    );
  }

  if (!RBACService.hasPermission(auth.role, 'product:create')) {
    return NextResponse.json(
      { error: 'Forbidden: RBAC restricts product creation to authorized personnel.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    if (!body.name || body.base_price === undefined) {
      return NextResponse.json({ error: 'Product name and base_price are required' }, { status: 400 });
    }

    const result = await AdminProductService.createProduct({
      name: body.name,
      slug: body.slug,
      description: body.description,
      category_id: body.category_id,
      base_price: Number(body.base_price),
      is_active: body.is_active,
      images: body.images || [],
      variants: body.variants || [],
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.product, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 });
  }
}
