-- Migration 0013: Preorder system and sizing extensions
-- Adds pre-order tracking and batch configurations to products and order line items.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preorder_message TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preorder_target INTEGER DEFAULT NULL;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.products.is_preorder IS 'Whether this garment/product is sold as a pre-order batch drop';
COMMENT ON COLUMN public.products.preorder_message IS 'Customer-facing dispatch timeline or production notice';
COMMENT ON COLUMN public.products.preorder_target IS 'Target units to unlock/fund batch run';
COMMENT ON COLUMN public.order_items.is_preorder IS 'Whether this purchased line item is part of a pre-order batch';
