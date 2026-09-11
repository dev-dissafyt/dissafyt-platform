-- Migration 0003: Barbershop Staff & Booking Enhancements
-- Aligned with docs/04-modules/BARBERSHOP.md and Phase 7 of BUILD_PLAN.md

-- 1. Enhance public.staff table with scheduling and profile fields
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{
  "monday": { "start": "09:00", "end": "18:00", "active": true },
  "tuesday": { "start": "09:00", "end": "18:00", "active": true },
  "wednesday": { "start": "09:00", "end": "18:00", "active": true },
  "thursday": { "start": "09:00", "end": "18:00", "active": true },
  "friday": { "start": "09:00", "end": "18:00", "active": true },
  "saturday": { "start": "09:00", "end": "17:00", "active": true },
  "sunday": { "start": "09:00", "end": "14:00", "active": false }
}'::jsonb;

-- 2. Row Level Security on public.staff
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active staff" ON public.staff;
CREATE POLICY "Public can view active staff"
    ON public.staff FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view all staff" ON public.staff;
CREATE POLICY "Admins can view all staff"
    ON public.staff FOR SELECT
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert staff" ON public.staff;
CREATE POLICY "Admins can insert staff"
    ON public.staff FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update staff" ON public.staff;
CREATE POLICY "Admins can update staff"
    ON public.staff FOR UPDATE
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete staff" ON public.staff;
CREATE POLICY "Admins can delete staff"
    ON public.staff FOR DELETE
    USING (public.is_admin(auth.uid()));

-- 3. Row Level Security on public.bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
CREATE POLICY "Customers can view own bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can create own bookings" ON public.bookings;
CREATE POLICY "Customers can create own bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can update own bookings" ON public.bookings;
CREATE POLICY "Customers can update own bookings"
    ON public.bookings FOR UPDATE
    USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Staff can view assigned bookings" ON public.bookings;
CREATE POLICY "Staff can view assigned bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM public.staff WHERE id = bookings.staff_id));

DROP POLICY IF EXISTS "Admins have full access to bookings" ON public.bookings;
CREATE POLICY "Admins have full access to bookings"
    ON public.bookings FOR ALL
    USING (public.is_admin(auth.uid()));

-- 4. Seed initial Master Barbers if none exist
INSERT INTO public.staff (display_name, bio, phone, is_active)
SELECT 'Ace (Lead Barber)', 'Founder & Master Barber. Precision fades, scissor craft, and styling.', '+27 82 123 4567', true
WHERE NOT EXISTS (SELECT 1 FROM public.staff WHERE display_name = 'Ace (Lead Barber)');

INSERT INTO public.staff (display_name, bio, phone, is_active)
SELECT 'Marcus Fade Specialist', 'Razor lineups, hot towel treatments, and modern street fades.', '+27 83 987 6543', true
WHERE NOT EXISTS (SELECT 1 FROM public.staff WHERE display_name = 'Marcus Fade Specialist');

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
