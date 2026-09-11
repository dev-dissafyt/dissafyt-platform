-- Migration 0006: Barbershop Subscriptions Table & RLS Policies
-- Aligned with Member-Exclusive Grooming Access

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL, -- 'solo', 'twice', 'father-son'
    plan_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
    current_period_start TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    current_period_end TIMESTAMPTZ DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '30 days') NOT NULL,
    payfast_token TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for fast active subscription queries by user_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Customers can view their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view and manage all subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
    ON public.subscriptions FOR SELECT
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
    ON public.subscriptions FOR ALL
    USING (public.is_admin(auth.uid()));

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
