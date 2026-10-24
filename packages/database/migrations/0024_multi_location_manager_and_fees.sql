-- ==============================================================================
-- 20261024000024_multi_location_manager_and_fees.sql
-- Dissafyt Platform: Multi-Location Governance, Branch Manager RBAC & Fee Transparency
-- ==============================================================================

-- 1. Register 'barbershop_manager' role in public.roles
INSERT INTO public.roles (id, description) VALUES
    ('barbershop_manager', 'Manager of an individual barbershop location/branch with scoped operational control')
ON CONFLICT (id) DO NOTHING;

-- 2. Add admin_fee_pct to public.locations (default 5.00%)
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS admin_fee_pct NUMERIC(5, 2) NOT NULL DEFAULT 5.00;

-- 3. Add itemized fee tracking to public.bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS base_service_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS admin_fee_amount NUMERIC(10, 2);

-- 4. Ensure performance indexes on staff and bookings for RLS lookups
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_location_id ON public.staff(location_id);
CREATE INDEX IF NOT EXISTS idx_bookings_location_id ON public.bookings(location_id);

-- 5. Helper function for fast RLS lookups of caller's assigned location
CREATE OR REPLACE FUNCTION public.get_auth_user_location_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT location_id FROM public.staff
    WHERE user_id = (SELECT auth.uid())
    LIMIT 1;
$$;

-- 6. Grant RLS permissions on public.service_locations to barbershop_manager
DROP POLICY IF EXISTS "Manager manage service_locations" ON public.service_locations;
CREATE POLICY "Manager manage service_locations"
ON public.service_locations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'barbershop_manager'
    )
    AND location_id = public.get_auth_user_location_id()
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'barbershop_manager'
    )
    AND location_id = public.get_auth_user_location_id()
);

-- 7. Grant RLS permissions on public.staff to barbershop_manager
DROP POLICY IF EXISTS "Manager manage branch staff" ON public.staff;
CREATE POLICY "Manager manage branch staff"
ON public.staff FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'barbershop_manager'
    )
    AND location_id = public.get_auth_user_location_id()
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'barbershop_manager'
    )
    AND location_id = public.get_auth_user_location_id()
);

-- 8. Grant RLS permissions on public.bookings to barbershop_manager
DROP POLICY IF EXISTS "Manager manage branch bookings" ON public.bookings;
CREATE POLICY "Manager manage branch bookings"
ON public.bookings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'barbershop_manager'
    )
    AND location_id = public.get_auth_user_location_id()
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'barbershop_manager'
    )
    AND location_id = public.get_auth_user_location_id()
);
