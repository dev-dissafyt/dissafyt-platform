-- ==============================================================================
-- 20260901000011_barbershop_locations_and_relationships.sql
-- Establishes public.locations, links barbers (staff) and bookings to locations,
-- and enables RLS policies for unified operations.
-- ==============================================================================

-- 1. Create public.locations if not exists
CREATE TABLE IF NOT EXISTS public.locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Cape Town',
    province TEXT NOT NULL DEFAULT 'Western Cape',
    country TEXT NOT NULL DEFAULT 'South Africa',
    phone TEXT,
    is_flagship BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    capacity_chairs INTEGER NOT NULL DEFAULT 2,
    operating_hours_display TEXT NOT NULL DEFAULT 'Tue-Sat: 09:00 - 19:00 | Sun: 10:00 - 16:00 | Mon: By Appointment',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Seed Flagship Studio (Cape Town) & Belmont Park Branch
INSERT INTO public.locations (
    id, name, slug, address, city, province, country, phone, is_flagship, is_active, capacity_chairs, operating_hours_display
) VALUES (
    'loc-cpt-flagship',
    'Dissafyt Studio, Cape Town',
    'dissafyt-studio-cpt',
    'Ace of Fyt Flagship Studio, Cape Town',
    'Cape Town',
    'Western Cape',
    'South Africa',
    '+27 818082570',
    true,
    true,
    4,
    'Tue-Sat: 09:00 - 19:00 | Sun: 10:00 - 16:00 | Mon: By Appointment'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    capacity_chairs = EXCLUDED.capacity_chairs;

INSERT INTO public.locations (
    id, name, slug, address, city, province, country, phone, is_flagship, is_active, capacity_chairs, operating_hours_display
) VALUES (
    'loc-ace-of-fyt-belmont-park',
    'Ace of Fyt - Belmont Park',
    'ace-of-fyt-belmont-park',
    '67 Voortrekker Rd, Belmont Park',
    'Cape Town',
    'Western Cape',
    'South Africa',
    '+27 21 000 0000',
    false,
    true,
    2,
    'Mon-Fri: 09:00 - 18:00 | Sat: 09:00 - 17:00 | Sun: Closed'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address;

-- 2. Link staff (barbers) to physical studio locations
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS location_id TEXT REFERENCES public.locations(id) ON DELETE SET NULL;

-- Default existing barbers to Flagship studio
UPDATE public.staff
SET location_id = 'loc-cpt-flagship'
WHERE location_id IS NULL;

-- 3. Link bookings to physical studio locations
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS location_id TEXT REFERENCES public.locations(id) ON DELETE SET NULL;

-- Default existing bookings to Flagship studio
UPDATE public.bookings
SET location_id = 'loc-cpt-flagship'
WHERE location_id IS NULL;

-- 4. Enable RLS and setup policies
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read locations" ON public.locations;
CREATE POLICY "Public read locations"
ON public.locations FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Service role manage locations" ON public.locations;
CREATE POLICY "Service role manage locations"
ON public.locations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage locations" ON public.locations;
CREATE POLICY "Admin manage locations"
ON public.locations FOR ALL
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

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
