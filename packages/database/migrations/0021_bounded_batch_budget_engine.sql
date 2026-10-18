-- 0021_bounded_batch_budget_engine.sql
-- Bounded Working Capital Pre-Order Batch Engine (R10,000 Capital Cap & Atomic Concurrency Controls)

CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name TEXT NOT NULL,
    batch_code TEXT NOT NULL UNIQUE, -- e.g. 'batch-01'
    capital_budget NUMERIC(10, 2) NOT NULL DEFAULT 10000.00,
    remaining_budget NUMERIC(10, 2) NOT NULL DEFAULT 10000.00,
    current_cogs_allocated NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    current_retail_value NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_units_reserved INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'accumulating' 
        CHECK (status IN ('accumulating', 'batch_filled', 'in_production', 'dispatched', 'completed', 'cancelled')),
    contingency_buffer_pct NUMERIC(5, 2) DEFAULT 5.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active batches"
    ON public.batches FOR SELECT
    USING (is_active = true);

CREATE POLICY "Allow service_role full control on batches"
    ON public.batches FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add batch linkage and reservation tracking to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reservation_tier TEXT DEFAULT 'standard' CHECK (reservation_tier IN ('subsidized_free', 'waitlist', 'standard', 'deposit_paid')),
ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS batch_settlement_requested_at TIMESTAMPTZ;

-- Stored Procedure: Atomic Row-Locked Spot Reservation
CREATE OR REPLACE FUNCTION public.claim_batch_spot(
    p_batch_id UUID,
    p_cogs_amount NUMERIC(10, 2),
    p_retail_amount NUMERIC(10, 2),
    p_quantity INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_batch public.batches%ROWTYPE;
BEGIN
    UPDATE public.batches
    SET 
        remaining_budget = remaining_budget - p_cogs_amount,
        current_cogs_allocated = current_cogs_allocated + p_cogs_amount,
        current_retail_value = current_retail_value + p_retail_amount,
        total_units_reserved = total_units_reserved + p_quantity,
        updated_at = NOW()
    WHERE id = p_batch_id 
      AND remaining_budget >= p_cogs_amount
      AND status = 'accumulating'
    RETURNING * INTO v_updated_batch;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'CAPACITY_EXCEEDED'
        );
    END IF;

    -- If remaining budget is less than R100 (smallest garment cost), mark batch as filled
    IF v_updated_batch.remaining_budget < 100.00 THEN
        UPDATE public.batches 
        SET status = 'batch_filled' 
        WHERE id = p_batch_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'remaining_budget', v_updated_batch.remaining_budget,
        'current_cogs', v_updated_batch.current_cogs_allocated,
        'current_retail', v_updated_batch.current_retail_value,
        'total_units', v_updated_batch.total_units_reserved,
        'status', v_updated_batch.status
    );
END;
$$;

-- Stored Procedure: Release Spot (for ghost / cancellation handling)
CREATE OR REPLACE FUNCTION public.release_batch_spot(
    p_batch_id UUID,
    p_cogs_amount NUMERIC(10, 2),
    p_retail_amount NUMERIC(10, 2),
    p_quantity INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_batch public.batches%ROWTYPE;
BEGIN
    UPDATE public.batches
    SET 
        remaining_budget = LEAST(capital_budget, remaining_budget + p_cogs_amount),
        current_cogs_allocated = GREATEST(0.00, current_cogs_allocated - p_cogs_amount),
        current_retail_value = GREATEST(0.00, current_retail_value - p_retail_amount),
        total_units_reserved = GREATEST(0, total_units_reserved - p_quantity),
        status = CASE WHEN status = 'batch_filled' THEN 'accumulating' ELSE status END,
        updated_at = NOW()
    WHERE id = p_batch_id
    RETURNING * INTO v_updated_batch;

    RETURN jsonb_build_object(
        'success', true,
        'remaining_budget', v_updated_batch.remaining_budget,
        'current_cogs', v_updated_batch.current_cogs_allocated,
        'status', v_updated_batch.status
    );
END;
$$;

-- Seed initial Batch 01 (R10,000 Budget Cap)
INSERT INTO public.batches (
    batch_name,
    batch_code,
    capital_budget,
    remaining_budget,
    current_cogs_allocated,
    current_retail_value,
    total_units_reserved,
    status,
    is_active
) VALUES (
    'Batch 01 - Cape Town Streetwear Drop',
    'batch-01',
    10000.00,
    10000.00,
    0.00,
    0.00,
    0,
    'accumulating',
    true
) ON CONFLICT (batch_code) DO NOTHING;
