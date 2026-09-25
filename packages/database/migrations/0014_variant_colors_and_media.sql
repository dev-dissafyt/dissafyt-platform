-- 0014_variant_colors_and_media.sql
-- Add color, color_hex, size, and variant-specific image_url to product_variants

ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color_hex TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS size TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Backfill size from name if size is null and name matches standard streetwear sizing
UPDATE public.product_variants
SET size = name
WHERE size IS NULL AND name IS NOT NULL;

-- Create index for faster color/size lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON public.product_variants(product_id, color);
CREATE INDEX IF NOT EXISTS idx_product_variants_size ON public.product_variants(product_id, size);
