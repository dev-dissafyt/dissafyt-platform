-- Migration 20261012000015: Product Pricing Surveys & Prospect Voting Engine
-- Allows prospective customers to vote on prices across intervals of 50%, 75%, and 100% margins without knowing the backend margin.
-- Enables admin to review aggregate feedback and determine optimal release pricing.

CREATE TABLE IF NOT EXISTS public.product_survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_name TEXT,
  respondent_email TEXT,
  respondent_phone TEXT,
  general_feedback TEXT,
  source TEXT DEFAULT 'web',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_survey_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.product_survey_responses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  selected_price NUMERIC(10, 2) NOT NULL,
  tier_selected TEXT NOT NULL CHECK (tier_selected IN ('tier_50', 'tier_75', 'tier_100', 'not_interested', 'custom')),
  margin_percentage NUMERIC(5, 2) DEFAULT 0,
  estimated_profit NUMERIC(10, 2) DEFAULT 0,
  feedback_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_survey_votes_product_id ON public.product_survey_votes(product_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_response_id ON public.product_survey_votes(response_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_tier ON public.product_survey_votes(tier_selected);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON public.product_survey_responses(created_at DESC);

ALTER TABLE public.product_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_survey_votes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_survey_responses' AND policyname = 'Allow anon insert to product_survey_responses'
  ) THEN
    CREATE POLICY "Allow anon insert to product_survey_responses"
      ON public.product_survey_responses
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_survey_votes' AND policyname = 'Allow anon insert to product_survey_votes'
  ) THEN
    CREATE POLICY "Allow anon insert to product_survey_votes"
      ON public.product_survey_votes
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_survey_responses' AND policyname = 'Allow admin full access to product_survey_responses'
  ) THEN
    CREATE POLICY "Allow admin full access to product_survey_responses"
      ON public.product_survey_responses
      FOR ALL
      TO authenticated, service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_survey_votes' AND policyname = 'Allow admin full access to product_survey_votes'
  ) THEN
    CREATE POLICY "Allow admin full access to product_survey_votes"
      ON public.product_survey_votes
      FOR ALL
      TO authenticated, service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE public.product_survey_responses IS 'Survey submissions from prospects assessing garment catalogue pricing';
COMMENT ON TABLE public.product_survey_votes IS 'Per-product votes capturing willingness to pay and margin preference';
