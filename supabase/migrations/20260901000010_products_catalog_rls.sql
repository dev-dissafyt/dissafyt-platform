-- ==============================================================================
-- 20260901000010_products_catalog_rls.sql
-- Enable Row Level Security and Authoritative Access Policies for Commerce Catalog
-- Ensures public access to view products/categories/variants and admin access to manage them.
-- ==============================================================================

-- 1. Enable RLS on catalog tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing conflicting policies if present
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public read product_variants" ON public.product_variants;

DROP POLICY IF EXISTS "Service role manage categories" ON public.categories;
DROP POLICY IF EXISTS "Service role manage products" ON public.products;
DROP POLICY IF EXISTS "Service role manage product_variants" ON public.product_variants;

DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admin manage products" ON public.products;
DROP POLICY IF EXISTS "Admin manage product_variants" ON public.product_variants;

-- 3. Public Read Policies: Open to anon, authenticated, and service_role
CREATE POLICY "Public read categories"
ON public.categories
FOR SELECT
USING (true);

CREATE POLICY "Public read products"
ON public.products
FOR SELECT
USING (true);

CREATE POLICY "Public read product_variants"
ON public.product_variants
FOR SELECT
USING (true);

-- 4. Service Role Management: Full privileges for serverless backend
CREATE POLICY "Service role manage categories"
ON public.categories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role manage products"
ON public.products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role manage product_variants"
ON public.product_variants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Admin & Staff Management for Authenticated Users (via user_roles)
CREATE POLICY "Admin manage categories"
ON public.categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Admin manage products"
ON public.products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Admin manage product_variants"
ON public.product_variants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'staff')
  )
);
