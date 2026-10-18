-- Migration 0019: Founder Pass Campaign Settings
-- Allows administrative configuration of the Founder's Pass parameters:
-- price per pass, number of cuts, total available spots, and capital target.

CREATE TABLE IF NOT EXISTS public.founder_pass_campaign_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    price_per_pass NUMERIC(10, 2) NOT NULL DEFAULT 1200.00,
    total_cuts INT NOT NULL DEFAULT 12,
    total_spots INT NOT NULL DEFAULT 50,
    capital_target NUMERIC(10, 2) NOT NULL DEFAULT 60000.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

INSERT INTO public.founder_pass_campaign_settings (id, price_per_pass, total_cuts, total_spots, capital_target, is_active)
VALUES ('default', 1200.00, 12, 50, 60000.00, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.founder_pass_campaign_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'founder_pass_campaign_settings' AND policyname = 'Anyone can view founder pass campaign settings'
  ) THEN
    CREATE POLICY "Anyone can view founder pass campaign settings"
      ON public.founder_pass_campaign_settings
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'founder_pass_campaign_settings' AND policyname = 'Admins can manage founder pass campaign settings'
  ) THEN
    CREATE POLICY "Admins can manage founder pass campaign settings"
      ON public.founder_pass_campaign_settings
      FOR ALL
      TO authenticated
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
