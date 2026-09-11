-- Migration 0002: Add subscription metadata to services and seed default categories & services

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS plan_code TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS billing_frequency INTEGER DEFAULT 3;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS billing_cycles INTEGER DEFAULT 12;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Seed default categories if empty
INSERT INTO public.categories (name, slug, description) VALUES
  ('Streetwear', 'streetwear', 'Signature hoodies, t-shirts, and apparel'),
  ('Headwear', 'headwear', 'Caps, beanies, and hats'),
  ('Accessories', 'accessories', 'Grooming tools, bags, and lifestyle accessories')
ON CONFLICT (slug) DO NOTHING;

-- Seed default barbershop services & subscriptions
INSERT INTO public.services (name, description, duration_minutes, price, is_active, is_subscription, plan_code) VALUES
  ('The Solo Membership', 'One fresh cut every month to keep you looking sharp. Priority booking slots.', 30, 100.00, true, true, 'solo'),
  ('The Regular Membership', 'Two cuts a month for the guy who never lets it grow out. Best value per cut.', 30, 180.00, true, true, 'twice'),
  ('Father n Son Membership', 'A combo cut for you and your boy — bonding time, sorted.', 45, 180.00, true, true, 'father-son'),
  ('Classic Haircut', 'Consultation, precision fade or scissor cut, wash & style.', 30, 120.00, true, false, NULL),
  ('Beard Sculpt & Shape', 'Hot towel treatment, razor line-up, and beard conditioning oils.', 20, 80.00, true, false, NULL),
  ('The Full Combo', 'Complete signature haircut, full beard grooming, wash & hot towel.', 50, 180.00, true, false, NULL)
ON CONFLICT DO NOTHING;
