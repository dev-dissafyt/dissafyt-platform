-- Migration 0023: Survey Runs & Product Selection for Pricing Insights
-- Enables operators to create survey campaigns/runs with customized product selections,
-- deselect old products, select newly added products, and preserve documented historical survey runs.

CREATE TABLE IF NOT EXISTS public.survey_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'draft')),
  product_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  created_by TEXT DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_survey_runs_status ON public.survey_runs(status);
CREATE INDEX IF NOT EXISTS idx_survey_runs_created_at ON public.survey_runs(created_at DESC);

-- Add survey_run_id to product_survey_responses if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_survey_responses' AND column_name = 'survey_run_id'
  ) THEN
    ALTER TABLE public.product_survey_responses
    ADD COLUMN survey_run_id UUID REFERENCES public.survey_runs(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_survey_responses_run_id ON public.product_survey_responses(survey_run_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.survey_runs ENABLE ROW LEVEL SECURITY;

-- Allow anon & authenticated to view active survey runs (needed for public /survey)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'survey_runs' AND policyname = 'Allow anon read active survey_runs'
  ) THEN
    CREATE POLICY "Allow anon read active survey_runs"
      ON public.survey_runs
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'survey_runs' AND policyname = 'Allow admin full access to survey_runs'
  ) THEN
    CREATE POLICY "Allow admin full access to survey_runs"
      ON public.survey_runs
      FOR ALL
      TO authenticated, service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Seed initial baseline survey run and backfill existing responses
DO $$
DECLARE
  v_run_id UUID;
  v_product_ids UUID[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.survey_runs) THEN
    SELECT ARRAY_AGG(id) INTO v_product_ids FROM public.products WHERE is_active = true;

    INSERT INTO public.survey_runs (title, description, status, product_ids, created_at, created_by)
    VALUES (
      'Run #1: Baseline Catalog Survey (Oct 2026)',
      'Initial baseline pricing survey across core launch garments.',
      'active',
      COALESCE(v_product_ids, '{}'),
      '2026-10-12 00:00:00+00',
      'system'
    )
    RETURNING id INTO v_run_id;

    UPDATE public.product_survey_responses
    SET survey_run_id = v_run_id
    WHERE survey_run_id IS NULL;
  END IF;
END $$;

COMMENT ON TABLE public.survey_runs IS 'Tracks discrete pricing survey runs/campaigns with customizable product inclusion lists';
