-- Migration 0017: Supplier Cost Price, Profit Margin Engine & Batch Preorder Accumulation
-- Adds supplier costing & batch lifecycle fields to products/variants and batch tracking tokens to orders.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS supplier_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS supplier_sku TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS batch_status TEXT DEFAULT 'accumulating' CHECK (batch_status IN ('accumulating', 'batch_filled', 'in_production', 'dispatched', 'completed'));

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS cost_price_override NUMERIC(10, 2) DEFAULT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_link_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS batch_notified_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_payment_link_token ON public.orders(payment_link_token);
CREATE INDEX IF NOT EXISTS idx_products_batch_status ON public.products(batch_status);

COMMENT ON COLUMN public.products.cost_price IS 'Supplier wholesale unit cost per garment blank / manufacturing';
COMMENT ON COLUMN public.products.supplier_name IS 'Supplier or factory mill name (e.g. Vic Bay, Barron, Local Cape Town Screenprinter)';
COMMENT ON COLUMN public.products.supplier_sku IS 'Supplier catalog code / reference';
COMMENT ON COLUMN public.products.batch_status IS 'Lifecycle stage of drop batch: accumulating, batch_filled, in_production, dispatched, completed';
COMMENT ON COLUMN public.orders.payment_link_token IS 'Secure unique token used to allow customers to settle their order when batch unlocks';
COMMENT ON COLUMN public.orders.batch_notified_at IS 'Timestamp when customer was notified that batch is filled with direct payment link';
