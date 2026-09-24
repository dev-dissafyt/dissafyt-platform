import { getSupabaseAdminClient, Product, ProductVariant, ProductCategory } from '@dissafyt/database';
import { AuditService } from '../audit/audit-service';

export interface ProductVariantInput {
  id?: string;
  name: string;
  sku?: string;
  price_override?: number | null;
  stock_quantity: number;
  is_active?: boolean;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  category_id?: string | null;
  base_price: number;
  is_active?: boolean;
  images?: string[];
  is_preorder?: boolean;
  preorder_message?: string | null;
  preorder_target?: number | null;
  variants?: ProductVariantInput[];
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  category_id?: string | null;
  base_price?: number;
  is_active?: boolean;
  images?: string[];
  stock_quantity?: number;
  is_preorder?: boolean;
  preorder_message?: string | null;
  preorder_target?: number | null;
  variants?: ProductVariantInput[];
}

const SIZE_SORT_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Standard'];

function sortVariants(a: ProductVariant, b: ProductVariant) {
  const indexA = SIZE_SORT_ORDER.indexOf(a.name);
  const indexB = SIZE_SORT_ORDER.indexOf(b.name);
  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
  if (indexA !== -1) return -1;
  if (indexB !== -1) return 1;
  return a.name.localeCompare(b.name);
}

export class AdminProductService {
  /**
   * Lists all products including category name and attached variants.
   */
  static async listProducts(): Promise<(Product & { category_name?: string; variants: ProductVariant[] })[]> {
    const admin = getSupabaseAdminClient();
    const { data: products, error } = await admin
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });

    if (error || !products) {
      console.error('Failed to list products:', error);
      return [];
    }

    // Fetch variants for all products
    const productIds = products.map((p) => p.id);
    let variants: ProductVariant[] = [];
    if (productIds.length > 0) {
      const { data: varData } = await admin
        .from('product_variants')
        .select('*')
        .in('product_id', productIds);
      variants = varData || [];
    }

    return products.map((p: any) => ({
      ...p,
      category_name: p.categories?.name || 'Uncategorized',
      variants: variants
        .filter((v) => v.product_id === p.id && v.is_active !== false)
        .sort(sortVariants),
    }));
  }

  /**
   * Creates a new product and initial variant in PostgreSQL with invisible audit logging.
   */
  static async createProduct(
    input: CreateProductInput,
    actor?: { email?: string; role?: string; id?: string }
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    const admin = getSupabaseAdminClient();
    let slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!slug) slug = `product-${Date.now().toString().slice(-6)}`;

    try {
      // Ensure slug uniqueness
      const { data: existingSlug } = await admin.from('products').select('id').eq('slug', slug).maybeSingle();
      if (existingSlug) {
        slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const { data: product, error } = await admin
        .from('products')
        .insert({
          name: input.name,
          slug,
          description: input.description || '',
          category_id: input.category_id || null,
          base_price: input.base_price,
          is_active: input.is_active !== undefined ? input.is_active : true,
          images: input.images || [],
          is_preorder: Boolean(input.is_preorder),
          preorder_message: input.preorder_message || null,
          preorder_target: input.preorder_target ? Number(input.preorder_target) : null,
        })
        .select()
        .single();

      if (error || !product) {
        return { success: false, error: error?.message || 'Failed to insert product' };
      }

      // Add variants if provided, or default variant with guaranteed unique SKU
      const variantsToInsert = (input.variants && input.variants.length > 0)
        ? input.variants.map((v, idx) => ({
            product_id: product.id,
            name: v.name || 'Standard',
            sku: v.sku?.trim() ? `${v.sku.trim()}-${Math.floor(100 + Math.random() * 900)}` : `${slug.toUpperCase().slice(0, 8)}-${(v.name || 'VAR').toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
            price_override: v.price_override || null,
            stock_quantity: v.stock_quantity ?? 10,
            is_active: v.is_active !== undefined ? v.is_active : true,
          }))
        : [{
            product_id: product.id,
            name: 'Standard',
            sku: `${slug.toUpperCase().slice(0, 10)}-STD-${Math.floor(100 + Math.random() * 900)}`,
            price_override: null,
            stock_quantity: 10,
            is_active: true,
          }];

      await admin.from('product_variants').insert(variantsToInsert);

      // Invisible Audit Trail
      await AuditService.recordLog({
        actor_id: actor?.id,
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'product.create',
        entity_type: 'product',
        entity_id: product.id,
        entity_name: product.name,
        changes: product,
      });

      return { success: true, product };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Updates an existing product with invisible audit logging and stock updates.
   */
  static async updateProduct(
    id: string,
    input: UpdateProductInput,
    actor?: { email?: string; role?: string; id?: string }
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      // Fetch current snapshot before update for diff
      const { data: beforeData } = await admin.from('products').select('*').eq('id', id).single();

      const { stock_quantity, variants, ...productFields } = input;

      const updateData: any = {
        ...productFields,
        updated_at: new Date().toISOString(),
      };

      if (input.is_preorder !== undefined) {
        updateData.is_preorder = Boolean(input.is_preorder);
      }
      if (input.preorder_message !== undefined) {
        updateData.preorder_message = input.preorder_message || null;
      }
      if (input.preorder_target !== undefined) {
        updateData.preorder_target = input.preorder_target ? Number(input.preorder_target) : null;
      }

      const { data, error } = await admin
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Handle variant updates if variants array is supplied
      if (variants && variants.length > 0) {
        const { data: existingVariants } = await admin
          .from('product_variants')
          .select('*')
          .eq('product_id', id);

        const currentVars = existingVariants || [];

        for (const v of variants) {
          const safeStock = Math.max(0, v.stock_quantity ?? 0);
          if (v.id) {
            await admin
              .from('product_variants')
              .update({
                name: v.name,
                stock_quantity: safeStock,
                price_override: v.price_override || null,
                is_active: v.is_active !== undefined ? v.is_active : true,
              })
              .eq('id', v.id);
          } else {
            // Check if variant with same name exists for this product
            const match = currentVars.find((cv) => cv.name.toLowerCase() === v.name.toLowerCase());
            if (match) {
              await admin
                .from('product_variants')
                .update({
                  stock_quantity: safeStock,
                  price_override: v.price_override || null,
                  is_active: true,
                })
                .eq('id', match.id);
            } else {
              // Insert new variant
              const sku = v.sku?.trim()
                ? `${v.sku.trim()}-${Math.floor(100 + Math.random() * 900)}`
                : `${(data.slug || id).toUpperCase().slice(0, 8)}-${v.name.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

              await admin.from('product_variants').insert({
                product_id: id,
                name: v.name,
                sku,
                stock_quantity: safeStock,
                price_override: v.price_override || null,
                is_active: true,
              });
            }
          }
        }
      } else if (stock_quantity !== undefined) {
        // Fallback: update variant stock if single stock_quantity was supplied
        const safeStock = Math.max(0, stock_quantity);
        const { data: existingVariants } = await admin
          .from('product_variants')
          .select('id')
          .eq('product_id', id);

        if (existingVariants && existingVariants.length > 0) {
          await admin
            .from('product_variants')
            .update({ stock_quantity: safeStock })
            .eq('product_id', id);
        } else {
          await admin.from('product_variants').insert({
            product_id: id,
            name: 'Standard',
            sku: `${(data.slug || id).toUpperCase().slice(0, 8)}-STD-${Math.floor(100 + Math.random() * 900)}`,
            price_override: null,
            stock_quantity: safeStock,
            is_active: true,
          });
        }
      }

      // Invisible Audit Trail
      await AuditService.recordLog({
        actor_id: actor?.id,
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'product.update',
        entity_type: 'product',
        entity_id: id,
        entity_name: data.name,
        changes: {
          before: beforeData,
          after: data,
          updated_fields: input,
        },
      });

      return { success: true, product: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Deletes a product by ID with invisible audit logging.
   */
  static async deleteProduct(
    id: string,
    actor?: { email?: string; role?: string; id?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const admin = getSupabaseAdminClient();
    try {
      const { data: existing } = await admin.from('products').select('*').eq('id', id).single();

      const { error } = await admin.from('products').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }

      // Invisible Audit Trail
      await AuditService.recordLog({
        actor_id: actor?.id,
        actor_email: actor?.email || 'admin@dissafyt.com',
        actor_role: actor?.role || 'admin',
        action: 'product.delete',
        entity_type: 'product',
        entity_id: id,
        entity_name: existing?.name || id,
        changes: existing,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Lists all categories.
   */
  static async listCategories(): Promise<ProductCategory[]> {
    const admin = getSupabaseAdminClient();
    const { data } = await admin.from('categories').select('*').order('name');
    return data || [];
  }

  /**
   * Creates a new category.
   */
  static async createCategory(name: string, description?: string): Promise<{ success: boolean; category?: ProductCategory; error?: string }> {
    const admin = getSupabaseAdminClient();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data, error } = await admin.from('categories').insert({ name, slug, description }).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, category: data };
  }
}
