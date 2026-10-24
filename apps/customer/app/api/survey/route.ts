import { NextRequest, NextResponse } from 'next/server';
import { SurveyService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/survey
 * Public endpoint to fetch active catalog products with blind price options.
 * Selects products from the active survey run or requested runId.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId') || undefined;

    const products = await SurveyService.getPublicSurveyProducts(runId);
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[API /api/survey GET] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load survey products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/survey
 * Public endpoint for prospective customers to submit pricing feedback.
 * Tags responses with the active or specified survey run.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.votes || !Array.isArray(body.votes) || body.votes.length === 0) {
      return NextResponse.json(
        { error: 'Please vote on at least one product price.' },
        { status: 400 }
      );
    }

    const result = await SurveyService.submitSurveyResponse({
      survey_run_id: body.survey_run_id,
      respondent_name: body.respondent_name,
      respondent_email: body.respondent_email,
      respondent_phone: body.respondent_phone,
      general_feedback: body.general_feedback,
      source: body.source || 'web',
      votes: body.votes,
    });

    return NextResponse.json({
      success: true,
      responseId: result.responseId,
      message: 'Thank you for your pricing feedback! You are on our Priority VIP Drop List.',
    });
  } catch (err: any) {
    console.error('[API /api/survey POST] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to record survey response' },
      { status: 400 }
    );
  }
}
