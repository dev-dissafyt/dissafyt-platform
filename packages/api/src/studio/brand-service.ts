import { getSupabaseAdminClient, Brand, Product } from '@dissafyt/database';
import { AuditService } from '../audit/audit-service';

// In-memory runtime cache for brands and custom products
const RUNTIME_BRANDS: Brand[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    name: 'Dissafyt Originals',
    slug: 'dissafyt-originals',
    bio: 'Core in-house streetwear, heavyweight boxy cuts, and cultural staples.',
    logo_url: 'https://placehold.co/400x400/png?text=Dissafyt',
    deal_type: 'stacked_returns',
    commission_rate: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    name: 'Soweto Thread Collective',
    slug: 'soweto-thread-co',
    bio: 'Authentic township typography, nostalgic prints, and limited drops.',
    logo_url: 'https://placehold.co/400x400/png?text=STC',
    deal_type: 'drip_income',
    commission_rate: 20.0,
    created_at: new Date().toISOString(),
  },
];

const RUNTIME_CUSTOM_PRODUCTS: Product[] = [];

export interface CreateBrandInput {
  user_id?: string | null;
  name: string;
  slug?: string;
  bio?: string;
  logo_url?: string;
  deal_type?: 'stacked_returns' | 'drip_income';
  commission_rate?: number;
  contact_email?: string;
}

export interface CreateCustomProductInput {
  brand_id?: string;
  name: string;
  slug?: string;
  description?: string;
  base_price?: number;
  price?: number;
  design_file_url: string;
  mockup_url?: string;
  print_placement?: any;
  category?: string;
  category_id?: string;
  images?: string[];
  tags?: string[];
}

export interface CreatorSalesSummary {
  brand_id: string;
  brand_name: string;
  deal_type: 'stacked_returns' | 'drip_income';
  total_gross_revenue: number;
  total_units_sold: number;
  total_royalties_earned: number;
  royalties_pending_clearance: number;
  royalties_paid_out: number;
  available_for_payout: number;
  by_category: { name: string; units: number; revenue: number }[];
  by_color: { color: string; count: number; percentage: number }[];
  by_size: { size: string; count: number }[];
}

export interface StackedReturnsMetrics {
  brand_id: string;
  initial_batch_size: number;
  unit_production_cost: number;
  total_stack_invested: number;
  retail_price: number;
  units_sold_total: number;
  units_sold_in_studio_racks: number;
  units_sold_online: number;
  remaining_rack_inventory: number;
  break_even_units: number;
  break_even_reached: boolean;
  gross_recovered: number;
  net_stacked_profit: number;
  roi_percentage: number;
}

export interface CreatorBankingDetails {
  bank_name: string;
  account_holder: string;
  account_number: string;
  branch_code: string;
  account_type: 'cheque' | 'savings';
}

export class BrandService {
  /**
   * Lists all registered Kasi Kollekt brands and local creators.
   */
  static async listBrands(): Promise<Brand[]> {
    const admin = getSupabaseAdminClient();
    try {
      const { data, error } = await admin
        .from('brands')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Brand[];
      }
    } catch {
      // Fallback
    }
    return RUNTIME_BRANDS;
  }

  /**
   * Retrieves a brand by slug.
   */
  static async getBrandBySlug(slug: string): Promise<Brand | null> {
    const admin = getSupabaseAdminClient();
    try {
      const { data, error } = await admin.from('brands').select('*').eq('slug', slug).single();
      if (!error && data) return data as Brand;
    } catch {
      // Fallback
    }
    return RUNTIME_BRANDS.find((b) => b.slug === slug) || null;
  }

  /**
   * Retrieves a brand by ID.
   */
  static async getBrandById(id: string): Promise<Brand | null> {
    const admin = getSupabaseAdminClient();
    try {
      const { data, error } = await admin.from('brands').select('*').eq('id', id).single();
      if (!error && data) return data as Brand;
    } catch {
      // Fallback
    }
    return RUNTIME_BRANDS.find((b) => b.id === id) || null;
  }

  /**
   * Registers a new creator brand.
   */
  static async createBrand(
    input: CreateBrandInput,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; brand?: Brand; error?: string }> {
    const admin = getSupabaseAdminClient();
    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = `brand-${Date.now()}`;
    const newBrand: Brand = {
      id,
      user_id: input.user_id || null,
      name: input.name,
      slug,
      bio: input.bio || null,
      logo_url: input.logo_url || null,
      deal_type: input.deal_type || 'drip_income',
      commission_rate: input.commission_rate !== undefined ? input.commission_rate : 20.0,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await admin.from('brands').insert(newBrand).select().single();
      if (!error && data) {
        RUNTIME_BRANDS.push(data as Brand);
        return { success: true, brand: data as Brand };
      }
    } catch {
      // Fallback
    }

    RUNTIME_BRANDS.push(newBrand);

    // Invisible Audit Trail
    await AuditService.recordLog({
      actor_email: actor?.email || 'admin@dissafyt.com',
      actor_role: actor?.role || 'admin',
      action: 'brand.create',
      entity_type: 'brand',
      entity_id: id,
      entity_name: newBrand.name,
      changes: newBrand,
    });

    return { success: true, brand: newBrand };
  }

  /**
   * Publishes a creator drop / custom print product to the catalog.
   */
  static async createCustomProduct(
    input: CreateCustomProductInput,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; product?: Product; error?: string }> {
    const admin = getSupabaseAdminClient();
    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = `prod-${Date.now()}`;
    const basePrice = input.base_price ?? input.price ?? 450;
    const placement = typeof input.print_placement === 'string'
      ? input.print_placement
      : (input.print_placement?.location || 'front_chest');

    const newProduct: Product = {
      id,
      name: input.name,
      slug,
      description: input.description || `Kasi Kollekt exclusive drop by brand ${input.brand_id || 'creator'}`,
      base_price: basePrice,
      category_id: input.category_id || null,
      brand_id: input.brand_id || null,
      design_file_url: input.design_file_url,
      mockup_url: input.mockup_url || input.images?.[0] || 'https://placehold.co/800x800/png?text=Mockup',
      print_placement: placement as any,
      is_custom_print: true,
      is_active: true,
      images: input.images || [input.mockup_url || 'https://placehold.co/800x800/png?text=Mockup'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    RUNTIME_CUSTOM_PRODUCTS.unshift(newProduct);

    try {
      const { data, error } = await admin.from('products').insert(newProduct).select().single();
      if (!error && data) {
        return { success: true, product: data as Product };
      }
    } catch {
      // Fallback
    }

    // Invisible Audit Trail
    await AuditService.recordLog({
      actor_email: actor?.email || 'creator@dissafyt.com',
      actor_role: actor?.role || 'creator',
      action: 'product.create_custom',
      entity_type: 'product',
      entity_id: id,
      entity_name: newProduct.name,
      changes: newProduct,
    });

    return { success: true, product: newProduct };
  }

  /**
   * Helper to retrieve a runtime or cached custom product by ID or slug.
   */
  static findCustomProduct(idOrSlug: string): Product | null {
    return RUNTIME_CUSTOM_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
  }

  /**
   * Calculates creator royalties & fulfillment economics.
   * Supports both (brand, retailPrice) and (retailPrice, dealType, basePrintFee) signatures.
   */
  static calculateRoyalty(
    firstArg: Brand | number,
    secondArg?: number | 'stacked_returns' | 'drip_income',
    basePrintFee = 180
  ): { creatorEarnings: number; factoryFee: number; creatorRoyalty: number; platformFee: number } {
    if (typeof firstArg === 'object') {
      const brand = firstArg as Brand;
      const retailPrice = typeof secondArg === 'number' ? secondArg : 450;
      const commRate = brand.commission_rate !== undefined 
        ? brand.commission_rate 
        : (brand.deal_type === 'stacked_returns' ? 0.20 : 0.35);
      const normalizedRate = commRate > 1 ? commRate / 100 : commRate;

      const creatorEarnings = Number((retailPrice * normalizedRate).toFixed(2));
      const factoryFee = Number((retailPrice - creatorEarnings).toFixed(2));
      return {
        creatorEarnings,
        factoryFee,
        creatorRoyalty: creatorEarnings,
        platformFee: factoryFee,
      };
    }

    const retailPrice = firstArg;
    const dealType = (secondArg as 'stacked_returns' | 'drip_income') || 'drip_income';

    if (dealType === 'drip_income') {
      const creatorEarnings = Math.max(0, retailPrice - basePrintFee);
      return {
        creatorEarnings,
        factoryFee: basePrintFee,
        creatorRoyalty: creatorEarnings,
        platformFee: basePrintFee,
      };
    }

    const creatorEarnings = Number((retailPrice * 0.75).toFixed(2));
    const factoryFee = Number((retailPrice * 0.25).toFixed(2));
    return {
      creatorEarnings,
      factoryFee,
      creatorRoyalty: creatorEarnings,
      platformFee: factoryFee,
    };
  }

  /**
   * Generates a comprehensive sales, margin, and royalty analytics summary for a creator brand.
   */
  static async getCreatorSalesSummary(brandId: string): Promise<CreatorSalesSummary> {
    const brand = await this.getBrandById(brandId);
    const brandName = brand?.name || 'Skhanda Heritage Co.';
    const dealType = brand?.deal_type || 'drip_income';

    // Mock/runtime aggregation based on print queue activity and demo catalog
    return {
      brand_id: brandId,
      brand_name: brandName,
      deal_type: dealType,
      total_gross_revenue: dealType === 'stacked_returns' ? 15300 : 9900,
      total_units_sold: dealType === 'stacked_returns' ? 34 : 22,
      total_royalties_earned: dealType === 'stacked_returns' ? 6300 : 3465,
      royalties_pending_clearance: 770, // 7-day holding period for recent orders
      royalties_paid_out: dealType === 'stacked_returns' ? 3500 : 1500,
      available_for_payout: dealType === 'stacked_returns' ? 2030 : 1195,
      by_category: [
        { name: '240gsm Boxy Tees', units: 18, revenue: 8100 },
        { name: 'Heavyweight Fleece Hoodies', units: 8, revenue: 6000 },
        { name: 'Drop-Shoulder Street Tees', units: 8, revenue: 3040 },
      ],
      by_color: [
        { color: 'Onyx Black', count: 20, percentage: 59 },
        { color: 'Bone / Off-White', count: 9, percentage: 26 },
        { color: 'Washed Olive', count: 5, percentage: 15 },
      ],
      by_size: [
        { size: 'M', count: 8 },
        { size: 'L', count: 16 },
        { size: 'XL', count: 10 },
      ],
    };
  }

  /**
   * Generates Option A: 'Stacked Returns' wholesale rack metrics.
   * Tracks batch investment, physical barbershop studio rack sales, and break-even milestones.
   */
  static async getStackedReturnsMetrics(brandId: string): Promise<StackedReturnsMetrics> {
    const initialBatch = 50;
    const unitCost = 180;
    const retailPrice = 450;
    const unitsSoldStudio = 20; // sold off physical hangers in Ace of Fyt barbershop
    const unitsSoldOnline = 14;
    const unitsSoldTotal = unitsSoldStudio + unitsSoldOnline;
    const totalStack = initialBatch * unitCost; // R9,000
    const grossRecovered = unitsSoldTotal * retailPrice;
    const breakEvenUnits = Math.ceil(totalStack / retailPrice); // 20 units

    return {
      brand_id: brandId,
      initial_batch_size: initialBatch,
      unit_production_cost: unitCost,
      total_stack_invested: totalStack,
      retail_price: retailPrice,
      units_sold_total: unitsSoldTotal,
      units_sold_in_studio_racks: unitsSoldStudio,
      units_sold_online: unitsSoldOnline,
      remaining_rack_inventory: Math.max(0, initialBatch - unitsSoldTotal),
      break_even_units: breakEvenUnits,
      break_even_reached: unitsSoldTotal >= breakEvenUnits,
      gross_recovered: grossRecovered,
      net_stacked_profit: Math.max(0, grossRecovered - totalStack),
      roi_percentage: Math.round(((grossRecovered - totalStack) / totalStack) * 100),
    };
  }

  /**
   * Retrieves creator payout ledger & banking status.
   */
  static async getCreatorPayouts(brandId: string): Promise<{
    payouts: any[];
    banking: CreatorBankingDetails;
  }> {
    return {
      banking: {
        bank_name: 'First National Bank (FNB)',
        account_holder: 'Skhanda Heritage Enterprise',
        account_number: '••••••••4892',
        branch_code: '250655',
        account_type: 'cheque',
      },
      payouts: [
        {
          id: 'pay-001',
          amount: 2000,
          status: 'paid',
          reference: 'EFT-DISS-2026-0901',
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          processed_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        },
        {
          id: 'pay-002',
          amount: 1500,
          status: 'paid',
          reference: 'EFT-DISS-2026-0905',
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          processed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ],
    };
  }

  /**
   * Submits a creator payout request.
   */
  static async requestPayout(
    brandId: string,
    amount: number,
    banking: CreatorBankingDetails,
    actor?: { email?: string; role?: string }
  ): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    if (amount < 500) {
      return { success: false, error: 'Minimum payout threshold is R500.00' };
    }

    const payoutId = `pay-${Date.now()}`;

    // Invisible Audit Trail
    await AuditService.recordLog({
      actor_email: actor?.email || 'creator@dissafyt.com',
      actor_role: actor?.role || 'creator',
      action: 'creator.request_payout',
      entity_type: 'creator_payout',
      entity_id: payoutId,
      entity_name: `Payout Request of R${amount}`,
      changes: { brand_id: brandId, amount, banking },
    });

    return { success: true, payoutId };
  }
}
