-- Migration 0012: Newsletter Subscribers Table & RLS Policies
-- Captures email subscriptions from website footer / drop lists

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL DEFAULT 'website_footer',
    status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for fast lookup by email and status
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON public.newsletter_subscribers(status);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Grants for Data API
GRANT SELECT, INSERT ON public.newsletter_subscribers TO anon, authenticated, service_role;

-- Public (anon and authenticated) can subscribe
DROP POLICY IF EXISTS "Allow public newsletter subscription insert" ON public.newsletter_subscribers;
CREATE POLICY "Allow public newsletter subscription insert"
    ON public.newsletter_subscribers FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admins can view all newsletter subscribers
DROP POLICY IF EXISTS "Admins can view newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can view newsletter subscribers"
    ON public.newsletter_subscribers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Admins can manage newsletter subscribers
DROP POLICY IF EXISTS "Admins can manage newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can manage newsletter subscribers"
    ON public.newsletter_subscribers FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
