-- ==============================================================================
-- 20261020000022_location_service_pricing_and_hours.sql
-- Establishes public.service_locations for branch-specific service pricing
-- and availability overrides, and adds JSONB operating_hours to public.locations.
-- ==============================================================================

-- 1. Create public.service_locations table
CREATE TABLE IF NOT EXISTS public.service_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    location_id TEXT NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    price NUMERIC(10, 2),
    is_available BOOLEAN NOT NULL DEFAULT true,
    custom_duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_service_location UNIQUE (service_id, location_id)
);

-- Index for fast lookup by location or service
CREATE INDEX IF NOT EXISTS idx_service_locations_loc ON public.service_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_service_locations_svc ON public.service_locations(service_id);

-- 2. Add operating_hours JSONB column to public.locations if not exists
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{
  "monday": {"open": "09:00", "close": "18:00", "is_closed": true},
  "tuesday": {"open": "09:00", "close": "19:00", "is_closed": false},
  "wednesday": {"open": "09:00", "close": "19:00", "is_closed": false},
  "thursday": {"open": "09:00", "close": "19:00", "is_closed": false},
  "friday": {"open": "09:00", "close": "19:00", "is_closed": false},
  "saturday": {"open": "09:00", "close": "17:00", "is_closed": false},
  "sunday": {"open": "10:00", "close": "16:00", "is_closed": true}
}'::jsonb;

-- 3. Enable RLS on service_locations
ALTER TABLE public.service_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read service_locations" ON public.service_locations;
CREATE POLICY "Public read service_locations"
ON public.service_locations FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Service role manage service_locations" ON public.service_locations;
CREATE POLICY "Service role manage service_locations"
ON public.service_locations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage service_locations" ON public.service_locations;
CREATE POLICY "Admin manage service_locations"
ON public.service_locations FOR ALL
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

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
