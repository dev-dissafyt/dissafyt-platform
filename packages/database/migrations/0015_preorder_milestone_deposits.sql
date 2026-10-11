-- Migration 0015: Preorder Milestone Deposit Engine
-- Adds milestone deposit percentage to products, deposit/balance tracking & fulfillment choices to orders,
-- and individual item deposit/balance amounts to order_items.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS preorder_deposit_pct INTEGER DEFAULT 50 CHECK (preorder_deposit_pct BETWEEN 10 AND 100);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS deposit_paid NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'none' CHECK (deposit_status IN ('none', 'deposit_paid', 'fully_settled', 'refunded')),
  ADD COLUMN IF NOT EXISTS fulfillment_choice TEXT DEFAULT 'courier' CHECK (fulfillment_choice IN ('courier', 'studio_collection')),
  ADD COLUMN IF NOT EXISTS collection_location_id TEXT DEFAULT 'loc-cpt-flagship';

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(10, 2) DEFAULT 0.00;

CREATE INDEX IF NOT EXISTS idx_orders_deposit_status ON public.orders(deposit_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_choice ON public.orders(fulfillment_choice);

COMMENT ON COLUMN public.products.preorder_deposit_pct IS 'Configurable deposit percentage required upfront for pre-order production (default 50%)';
COMMENT ON COLUMN public.orders.deposit_paid IS 'Amount paid upfront as production milestone deposit';
COMMENT ON COLUMN public.orders.balance_due IS 'Outstanding balance to be collected upon studio handover or before courier dispatch';
COMMENT ON COLUMN public.orders.deposit_status IS 'Milestone deposit lifecycle: none, deposit_paid, fully_settled, refunded';
COMMENT ON COLUMN public.orders.fulfillment_choice IS 'Customer fulfillment choice: courier delivery or free studio collection';
COMMENT ON COLUMN public.orders.collection_location_id IS 'Studio branch ID for customer collection';
COMMENT ON COLUMN public.order_items.deposit_amount IS 'Milestone deposit allocated for this item';
COMMENT ON COLUMN public.order_items.balance_amount IS 'Remaining balance allocated for this item';
