-- Migration 0009: Guest Checkout & E-Commerce Security Enhancements
-- Aligned with docs/04-modules/ECOMMERCE.md and Phase 8 of BUILD_PLAN.md

-- 1. Make user_id nullable on public.orders so guest checkouts without an auth profile are supported natively
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add direct customer contact columns to public.orders for fast dispatch labeling
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 3. Upsert official guest fallback profile into public.profiles
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '5554892b-dd35-4778-81cc-98da343dfbae',
  'guest@dissafyt.com',
  'Dissafyt Guest Customer',
  'customer'
)
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- 4. Ensure Row Level Security on public.orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
CREATE POLICY "Admins have full access to orders"
    ON public.orders FOR ALL
    USING (public.is_admin(auth.uid()));

-- 5. Row Level Security on public.order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
CREATE POLICY "Public can create order items"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can view own order items" ON public.order_items;
CREATE POLICY "Customers can view own order items"
    ON public.order_items FOR SELECT
    USING (
      order_id IN (
        SELECT id FROM public.orders WHERE user_id = auth.uid()
      )
    );

DROP POLICY IF EXISTS "Admins have full access to order items" ON public.order_items;
CREATE POLICY "Admins have full access to order items"
    ON public.order_items FOR ALL
    USING (public.is_admin(auth.uid()));

-- 6. Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
