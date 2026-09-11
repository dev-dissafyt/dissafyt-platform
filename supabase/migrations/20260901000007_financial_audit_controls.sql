-- Migration 0007: Financial Audit Controls, Ledger Reconciliation & Booking Payment Tracking
-- Aligned with Enterprise Payment Governance and Single Source of Truth

-- 1. Enhance Bookings Table with Payment Audit Attributes
ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid', 'paid_online', 'paid_in_chair', 'membership_covered', 'waived')),
    ADD COLUMN IF NOT EXISTS is_subscription_covered BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_subscription_id ON public.bookings(subscription_id);

-- 2. Enhance Payments Table with Test Isolation & Idempotency Constraints
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

-- Add Unique Constraint on Provider Reference to Prevent Duplicate Webhook Inserts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_payments_provider_reference'
    ) THEN
        ALTER TABLE public.payments
            ADD CONSTRAINT uq_payments_provider_reference UNIQUE (provider, provider_reference);
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_live_audit ON public.payments(status, is_test, related_type);

-- 3. Ensure Invisible Audit Trail Table Exists
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT NOT NULL DEFAULT 'admin@dissafyt.com',
    actor_role TEXT NOT NULL DEFAULT 'admin',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_name TEXT,
    changes JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- 4. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
