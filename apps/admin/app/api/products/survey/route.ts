import { NextRequest, NextResponse } from 'next/server';
import { SurveyService } from '@dissafyt/api';
import { requireAdminAuth, isAuthFailure } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/products/survey
 * Retrieves aggregated product pricing survey analytics, active/selected run, and documented run history.
 * Accepts optional ?runId=<id> to view historical run analytics.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId') || undefined;

    const analytics = await SurveyService.getSurveyAnalytics(runId);
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

/**
 * POST /api/products/survey
 * Creates a new documented survey run with custom product selection.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();

    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { error: 'Survey Run title is required.' },
        { status: 400 }
      );
    }

    const run = await SurveyService.createSurveyRun(
      {
        title: body.title,
        description: body.description,
        product_ids: Array.isArray(body.product_ids) ? body.product_ids : [],
        setAsActive: body.setAsActive !== false,
      },
      {
        email: auth.email,
        role: auth.role,
      }
    );

    return NextResponse.json({ success: true, run }, { status: 201 });
  } catch (err: any) {
    console.error('[API /api/products/survey POST] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create survey run' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/survey
 * Updates products included in a survey run (select/deselect) or updates run status/title.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAuth(request);
  if (isAuthFailure(auth)) return auth;

  try {
    const body = await request.json();
    const runId = body.runId || body.id;

    if (!runId) {
      return NextResponse.json(
        { error: 'Survey Run ID (runId) is required.' },
        { status: 400 }
      );
    }

    if (Array.isArray(body.product_ids)) {
      const updated = await SurveyService.updateSurveyRunProducts(
        runId,
        body.product_ids,
        {
          email: auth.email,
          role: auth.role,
        }
      );
      return NextResponse.json({ success: true, run: updated });
    }

    const updated = await SurveyService.updateSurveyRun(
      runId,
      {
        title: body.title,
        description: body.description,
        status: body.status,
      },
      {
        email: auth.email,
        role: auth.role,
      }
    );

    return NextResponse.json({ success: true, run: updated });
  } catch (err: any) {
    console.error('[API /api/products/survey PATCH] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update survey run' },
      { status: 500 }
    );
  }
}
