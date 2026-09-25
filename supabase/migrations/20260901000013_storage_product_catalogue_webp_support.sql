-- Migration: 20260901000013_storage_product_catalogue_webp_support.sql
-- Description: Expand allowed MIME types on product_catalogue bucket to include WebP, AVIF, and GIF, and increase file size limit to 15MB.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/avif', 'image/gif'],
    file_size_limit = 15728640
WHERE id = 'product_catalogue';
