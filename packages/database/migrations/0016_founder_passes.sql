-- Migration 0016: Founder Passes (Buildout Capital Entitlement Engine)
-- 12 Total Master Cuts prepaid upfront for R1,200 to fund the physical barbershop buildout

CREATE TABLE IF NOT EXISTS public.founder_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_number TEXT UNIQUE NOT NULL, -- e.g. 'FP-0029', 'FP-0030'
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    total_cuts INT NOT NULL DEFAULT 12,
    cuts_used INT NOT NULL DEFAULT 0,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 1200.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'expired', 'pending_payment', 'cancelled')),
    payment_method TEXT DEFAULT 'payfast' CHECK (payment_method IN ('payfast', 'pos_card', 'pos_cash', 'manual_grant', 'pledge_waitlist')),
    payment_ref TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    notes TEXT,
    expires_at TIMESTAMPTZ DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '365 days') NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_founder_passes_email ON public.founder_passes(customer_email);
CREATE INDEX IF NOT EXISTS idx_founder_passes_phone ON public.founder_passes(customer_phone);
CREATE INDEX IF NOT EXISTS idx_founder_passes_status ON public.founder_passes(status);
CREATE INDEX IF NOT EXISTS idx_founder_passes_user_id ON public.founder_passes(user_id);

-- Enable RLS
ALTER TABLE public.founder_passes ENABLE ROW LEVEL SECURITY;

-- Customers can view their own passes
DROP POLICY IF EXISTS "Users can view own founder passes" ON public.founder_passes;
CREATE POLICY "Users can view own founder passes"
    ON public.founder_passes FOR SELECT
    USING (auth.uid() = user_id OR customer_email = auth.jwt()->>'email');

-- Admins have full access
DROP POLICY IF EXISTS "Admins have full access to founder passes" ON public.founder_passes;
CREATE POLICY "Admins have full access to founder passes"
    ON public.founder_passes FOR ALL
    USING (public.is_admin(auth.uid()));

-- Redemptions log table for auditability and punch-card tracking:
CREATE TABLE IF NOT EXISTS public.founder_pass_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID NOT NULL REFERENCES public.founder_passes(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    cut_number INT NOT NULL, -- e.g. 1 of 12
    service_name TEXT NOT NULL DEFAULT 'Master Haircut',
    barber_name TEXT,
    notes TEXT,
    redeemed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fp_redemptions_pass_id ON public.founder_pass_redemptions(pass_id);

ALTER TABLE public.founder_pass_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to redemptions" ON public.founder_pass_redemptions;
CREATE POLICY "Admins have full access to redemptions"
    ON public.founder_pass_redemptions FOR ALL
    USING (public.is_admin(auth.uid()));

NOTIFY pgrst, 'reload schema';
