-- Migration 0020: Father-Son Subscription Settings
-- Allows administrative configuration of extra son pricing and maximum sons allowed on the Father & Son membership plan.

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS extra_son_price NUMERIC(10, 2) DEFAULT 60.00,
ADD COLUMN IF NOT EXISTS max_sons INT DEFAULT 3;

-- Ensure father-son service has defaults and is active
UPDATE public.services
SET extra_son_price = 60.00, max_sons = 3, is_active = true
WHERE plan_code = 'father-son';

NOTIFY pgrst, 'reload schema';
