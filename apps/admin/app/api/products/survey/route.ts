import { NextRequest, NextResponse } from 'next/server';
import { SurveyService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/products/survey
 * Retrieves aggregated product pricing survey analytics and feedback for the admin catalog.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  try {
    const analytics = await SurveyService.getSurveyAnalytics();
    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[API /api/products/survey GET] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load survey analytics' },
      { status: 500 }
    );
  }
}
