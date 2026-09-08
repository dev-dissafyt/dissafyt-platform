-- Migration 0004: Studio Locations & Invisible Database Audit Trail
-- Aligned with docs/04-modules/BARBERSHOP.md and PLATFORM.md Section 18

-- 1. Locations Table (Decoupled Physical Studios & Branches)
CREATE TABLE IF NOT EXISTS public.locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'South Africa',
    phone TEXT,
    is_flagship BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    capacity_chairs INTEGER NOT NULL DEFAULT 2,
    operating_hours_display TEXT NOT NULL DEFAULT 'Mon-Fri: 09:00 - 18:00 | Sat: 09:00 - 17:00 | Sun: Closed',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Seed Flagship Studio if not exists
INSERT INTO public.locations (
    id, name, slug, address, city, province, country, phone, is_flagship, is_active, capacity_chairs, operating_hours_display
) VALUES (
    'loc-jhb-flagship',
    'Dissafyt Studio, Johannesburg',
    'dissafyt-studio-jhb',
    'Ace of Fyt Flagship Studio, Johannesburg',
    'Johannesburg',
    'Gauteng',
    'South Africa',
    '+27 82 123 4567',
    true,
    true,
    2,
    'Mon-Fri: 09:00 - 18:00 | Sat: 09:00 - 17:00 | Sun: Closed'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    capacity_chairs = EXCLUDED.capacity_chairs;

-- 2. Audit Logs Table (Invisible Audit Trail in DB)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL DEFAULT 'admin',
    action TEXT NOT NULL, -- e.g. 'product.create', 'product.update', 'product.delete', etc.
    entity_type TEXT NOT NULL, -- e.g. 'product', 'service', 'staff', 'location', 'user_role'
    entity_id TEXT NOT NULL,
    entity_name TEXT,
    changes JSONB DEFAULT '{}'::jsonb, -- Diff or snapshot of modified values
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for high-performance audit query inspection
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_email);

-- 3. Row Level Security (RLS)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Locations RLS Policies
DROP POLICY IF EXISTS "Public can view active locations" ON public.locations;
CREATE POLICY "Public can view active locations"
    ON public.locations FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view all locations" ON public.locations;
CREATE POLICY "Admins can view all locations"
    ON public.locations FOR SELECT
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins have full access to locations" ON public.locations;
CREATE POLICY "Admins have full access to locations"
    ON public.locations FOR ALL
    USING (public.is_admin(auth.uid()));

-- Audit Logs RLS Policies (Strictly invisible to customers/public, admin only)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
