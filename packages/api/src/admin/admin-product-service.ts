import { getSupabaseAdminClient, Product, ProductVariant, ProductCategory } from '@dissafyt/database';
import { AuditService } from '../audit/audit-service';

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  category_id?: string | null;
  base_price: number;
  is_active?: boolean;
  images?: string[];
  variants?: {
    name: string;
    sku: string;
    price_override?: number | null;
    stock_quantity: number;
  }[];
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
      variants: variants.filter((v) => v.product_id === p.id),
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
    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
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
        })
        .select()
        .single();

      if (error || !product) {
        return { success: false, error: error?.message || 'Failed to insert product' };
      }

      // Add variants if provided, or default variant
      const variantsToInsert = (input.variants && input.variants.length > 0)
        ? input.variants.map((v) => ({
            product_id: product.id,
            name: v.name,
            sku: v.sku,
            price_override: v.price_override || null,
            stock_quantity: v.stock_quantity,
            is_active: true,
          }))
        : [{
            product_id: product.id,
            name: 'Standard',
            sku: `${slug.toUpperCase()}-STD`,
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

      const { stock_quantity, ...productFields } = input;

      const { data, error } = await admin
        .from('products')
        .update({
          ...productFields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update variant stock if stock_quantity was supplied
      if (stock_quantity !== undefined) {
        await admin
          .from('product_variants')
          .update({ stock_quantity: Math.max(0, stock_quantity) })
          .eq('product_id', id);
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
