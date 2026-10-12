-- ==============================================================================
-- 20261012000014_barber_locations_payouts_maps.sql
-- Adds map directions, embeds, and card machine terminal columns to public.locations
-- Adds commission split, PayFast payout, bank details, and POS terminal to public.staff
-- ==============================================================================

-- 1. Extend public.locations with Google Maps metadata and POS card machine terminal ID
ALTER TABLE public.locations 
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_embed_url TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS pos_terminal_id TEXT;

-- Seed default Google Maps URL for Flagship studio (Bernie)
UPDATE public.locations
SET 
  google_maps_url = COALESCE(google_maps_url, 'https://www.google.com/maps/search/?api=1&query=1+Norwalk+Way+Bernadino+Heights+Kraaifontein+7570'),
  google_maps_embed_url = COALESCE(google_maps_embed_url, 'https://maps.google.com/maps?q=1%20Norwalk%20Way%20Bernadino%20Heights%20Kraaifontein%207570&t=&z=15&ie=UTF8&iwloc=&output=embed')
WHERE id = 'loc-cpt-flagship';

-- 2. Extend public.staff with payout split, PayFast merchant ID, banking details, and card machine terminal
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS commission_split_pct NUMERIC NOT NULL DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS payfast_merchant_id TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_type TEXT DEFAULT 'cheque',
  ADD COLUMN IF NOT EXISTS bank_branch_code TEXT,
  ADD COLUMN IF NOT EXISTS pos_terminal_id TEXT;

-- 3. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
