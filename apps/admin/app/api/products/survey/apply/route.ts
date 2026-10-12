import { NextRequest, NextResponse } from 'next/server';
import { SurveyService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/products/survey/apply
 * Applies an optimal or surveyed price directly to a product's base_price in the catalog.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request, 'product:edit');
  if (isAuthFailure(auth)) return auth;


  try {
    const body = await request.json();
    const { productId, newPrice } = body;

    if (!productId || typeof newPrice !== 'number' || newPrice <= 0) {
      return NextResponse.json(
        { error: 'Valid productId and positive newPrice are required.' },
        { status: 400 }
      );
    }

    const result = await SurveyService.applyPriceToProduct(
      productId,
      newPrice,
      {
        id: auth.userId,
        email: auth.email,
      }
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API /api/products/survey/apply POST] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to apply surveyed price' },
      { status: 400 }
    );
  }
}
