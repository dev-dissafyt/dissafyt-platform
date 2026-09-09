-- =====================================================================
-- Migration 0005: Studio & Factory Management OS (Kasi Kollekt)
-- =====================================================================

-- 1. Brands / Local Creators Table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    bio TEXT,
    logo_url TEXT,
    deal_type TEXT NOT NULL DEFAULT 'drip_income' CHECK (deal_type IN ('stacked_returns', 'drip_income')),
    commission_rate NUMERIC(5, 2) DEFAULT 20.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);

-- 2. Enhance Products Table with Kasi Kollekt / Print Factory Fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS design_file_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS mockup_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS print_placement JSONB;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_custom_print BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);

-- 3. Factory Production Queue (Print Jobs)
CREATE TABLE IF NOT EXISTS public.print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id UUID,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    garment_color TEXT NOT NULL DEFAULT 'Black',
    garment_size TEXT NOT NULL DEFAULT 'L',
    print_technique TEXT NOT NULL DEFAULT 'dtf',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'printing', 'qc_passed', 'packed', 'dispatched')),
    tracking_number TEXT,
    operator_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_print_jobs_order_id ON public.print_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON public.print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_brand_id ON public.print_jobs(brand_id);

-- 4. Creator Payout / Royalty Ledger
CREATE TABLE IF NOT EXISTS public.creator_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    print_job_id UUID REFERENCES public.print_jobs(id) ON DELETE SET NULL,
    deal_type TEXT NOT NULL DEFAULT 'drip_income',
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_payouts_brand_id ON public.creator_payouts(brand_id);

-- 5. Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

-- Public read for active brands
DROP POLICY IF EXISTS "Public can view brands" ON public.brands;
CREATE POLICY "Public can view brands" ON public.brands FOR SELECT USING (true);

-- Staff and admin can manage all brands
DROP POLICY IF EXISTS "Admins can manage brands" ON public.brands;
CREATE POLICY "Admins can manage brands" ON public.brands FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'staff'))
);

-- Staff and admin can manage all print jobs
DROP POLICY IF EXISTS "Admins and staff can manage print jobs" ON public.print_jobs;
CREATE POLICY "Admins and staff can manage print jobs" ON public.print_jobs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'staff'))
);

-- Creators can view their own brand's print jobs
DROP POLICY IF EXISTS "Creators can view own print jobs" ON public.print_jobs;
CREATE POLICY "Creators can view own print jobs" ON public.print_jobs FOR SELECT USING (
    brand_id IN (SELECT id FROM public.brands WHERE user_id = auth.uid())
);

-- 6. Seed Default In-House Creator Brand
INSERT INTO public.brands (id, name, slug, bio, deal_type, commission_rate)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Dissafyt Originals',
    'dissafyt-originals',
    'Core in-house streetwear and heritage graphics.',
    'stacked_returns',
    0.00
) ON CONFLICT (slug) DO NOTHING;
