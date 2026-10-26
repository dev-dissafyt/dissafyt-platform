-- ==============================================================================
-- 20261026000025_branch_rbac_and_gateway_settings.sql
-- Dissafyt Platform: Per-Branch RBAC & Branch Gateway Configurations
-- ==============================================================================

-- 1. Add branch-level payment gateway and payout settings to public.locations
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS payfast_merchant_id TEXT,
ADD COLUMN IF NOT EXISTS payfast_merchant_key TEXT,
ADD COLUMN IF NOT EXISTS payfast_passphrase TEXT,
ADD COLUMN IF NOT EXISTS use_custom_payfast BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS payout_bank_name TEXT,
ADD COLUMN IF NOT EXISTS payout_account_number TEXT,
ADD COLUMN IF NOT EXISTS payout_branch_code TEXT;

-- 2. Add location_id to public.user_roles to enable RBAC per branch
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS location_id TEXT REFERENCES public.locations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_user_roles_location_id ON public.user_roles(location_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_location ON public.user_roles(user_id, location_id);

-- 3. Replace single-scope constraint with NULLS NOT DISTINCT constraint across user_id, role, location_id
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_location_key;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_role_location_key UNIQUE NULLS NOT DISTINCT (user_id, role, location_id);

-- 4. Update helper function to check user_roles location_id or staff location_id
CREATE OR REPLACE FUNCTION public.get_auth_user_location_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        (SELECT location_id FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND location_id IS NOT NULL LIMIT 1),
        (SELECT location_id FROM public.staff WHERE user_id = (SELECT auth.uid()) AND location_id IS NOT NULL LIMIT 1)
    );
$$;

-- 5. RLS on public.user_roles for branch managers
DROP POLICY IF EXISTS "Manager view branch user_roles" ON public.user_roles;
CREATE POLICY "Manager view branch user_roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
    location_id = public.get_auth_user_location_id()
    OR user_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Manager manage branch user_roles" ON public.user_roles;
CREATE POLICY "Manager manage branch user_roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
    (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = (SELECT auth.uid())
            AND ur.role = 'barbershop_manager'
        )
        AND location_id = public.get_auth_user_location_id()
        AND role != 'admin'
    )
    OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'
    )
)
WITH CHECK (
    (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = (SELECT auth.uid())
            AND ur.role = 'barbershop_manager'
        )
        AND location_id = public.get_auth_user_location_id()
        AND role != 'admin'
    )
    OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'
    )
);

-- 6. Allow branch managers to update their assigned location gateway settings
DROP POLICY IF EXISTS "Manager update own location" ON public.locations;
CREATE POLICY "Manager update own location"
ON public.locations FOR UPDATE
TO authenticated
USING (
    id = public.get_auth_user_location_id()
    OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'
    )
)
WITH CHECK (
    id = public.get_auth_user_location_id()
    OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role = 'admin'
    )
);
