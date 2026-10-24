import {
  getSupabaseAdminClient,
  Product,
  ProductSurveyResponse,
  ProductSurveyVote,
  SurveyTierType,
  SurveyRun,
} from '@dissafyt/database';
import { AuditService } from '../audit/audit-service';
import { EmailService } from '../notifications/email-service';


export interface CalculatedSurveyTiers {
  cost: number;
  currentRetail: number;
  tiers: {
    tierKey: SurveyTierType;
    customerDisplay: string; // e.g. "R 450.00"
    price: number;
    marginPct: number; // 50, 75, 100
    markupPct: number;
    unitProfit: number;
  }[];
}

export interface SurveySubmissionInput {
  survey_run_id?: string;
  respondent_name?: string;
  respondent_email?: string;
  respondent_phone?: string;
  general_feedback?: string;
  source?: string;
  votes: {
    product_id: string;
    selected_price: number;
    tier_selected: SurveyTierType;
    notes?: string;
  }[];
}

export interface ProductSurveyInsight {
  product: Product;
  tiers: CalculatedSurveyTiers;
  totalVotes: number;
  interestedVotes: number;
  tierCounts: {
    tier_50: number;
    tier_75: number;
    tier_100: number;
    not_interested: number;
  };
  tierPercentages: {
    tier_50: number;
    tier_75: number;
    tier_100: number;
    not_interested: number;
  };
  averageWillingnessToPay: number;
  optimalTier: 'tier_50' | 'tier_75' | 'tier_100';
  optimalPrice: number;
  recommendationReason: string;
  projectedProfitPerBatch: {
    tier_50: number;
    tier_75: number;
    tier_100: number;
  };
}

export interface SurveyAnalyticsSummary {
  activeRun: SurveyRun | null;
  selectedRun: SurveyRun | null;
  runs: SurveyRun[];
  totalResponses: number;
  totalVotesCast: number;
  productInsights: ProductSurveyInsight[];
  recentSubmissions: ProductSurveyResponse[];
}

export class SurveyService {
  /**
   * Calculates the 50%, 75%, and 100% margin price tiers based on product cost and base price.
   * If cost_price is 0 or unassigned, derives unit cost baseline from current base_price.
   */
  public static calculateTiers(product: {
    cost_price?: number | null;
    base_price: number;
  }): CalculatedSurveyTiers {
    const rawCost = Number(product.cost_price) || 0;
    const currentRetail = Number(product.base_price) || 0;

    let effectiveCost: number;
    let price50: number;
    let price75: number;
    let price100: number;

    if (rawCost > 0) {
      effectiveCost = rawCost;
      // 50%, 75%, and 100% markup on cost
      price50 = Math.round(effectiveCost * 1.50);
      price75 = Math.round(effectiveCost * 1.75);
      price100 = Math.round(effectiveCost * 2.00);
    } else {
      // If cost is unknown, treat current base_price as having a 50% profit margin over cost
      effectiveCost = Math.round(currentRetail / 1.50) || Math.round(currentRetail * 0.6);
      price50 = Math.round(currentRetail);
      // 25% increments from the 50% baseline
      price75 = Math.round(currentRetail * (1.75 / 1.50));
      price100 = Math.round(currentRetail * (2.00 / 1.50));
    }

    // Ensure strictly distinct ascending prices rounded to nice streetwear increments
    if (price75 <= price50) price75 = price50 + 50;
    if (price100 <= price75) price100 = price75 + 50;

    return {
      cost: effectiveCost,
      currentRetail,
      tiers: [
        {
          tierKey: 'tier_50',
          customerDisplay: `R ${price50.toFixed(0)}`,
          price: price50,
          marginPct: 50,
          markupPct: 50,
          unitProfit: price50 - effectiveCost,
        },
        {
          tierKey: 'tier_75',
          customerDisplay: `R ${price75.toFixed(0)}`,
          price: price75,
          marginPct: 75,
          markupPct: 75,
          unitProfit: price75 - effectiveCost,
        },
        {
          tierKey: 'tier_100',
          customerDisplay: `R ${price100.toFixed(0)}`,
          price: price100,
          marginPct: 100,
          markupPct: 100,
          unitProfit: price100 - effectiveCost,
        },
      ],
    };
  }

  /**
   * Retrieves the currently active pricing survey run, or null if none active.
   */
  public static async getActiveSurveyRun(): Promise<SurveyRun | null> {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('survey_runs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[SurveyService.getActiveSurveyRun] DB error:', error);
      return null;
    }
    return data as SurveyRun | null;
  }

  /**
   * Lists all documented survey runs with aggregate response & vote counts and included product items.
   */
  public static async listSurveyRuns(): Promise<SurveyRun[]> {
    const supabase = getSupabaseAdminClient();
    const { data: runs, error } = await supabase
      .from('survey_runs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !runs) {
      console.error('[SurveyService.listSurveyRuns] DB error:', error);
      return [];
    }

    // Fetch response and vote aggregations
    const { data: responses } = await supabase
      .from('product_survey_responses')
      .select('id, survey_run_id');

    const { data: votes } = await supabase
      .from('product_survey_votes')
      .select('id, response_id');

    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name, slug, images, base_price, cost_price, is_active');

    const prodMap = new Map((allProducts || []).map((p) => [p.id, p]));

    const responseRunMap = new Map<string, string>();
    const responseCountByRun = new Map<string, number>();
    for (const r of responses || []) {
      if (r.survey_run_id) {
        responseRunMap.set(r.id, r.survey_run_id);
        responseCountByRun.set(
          r.survey_run_id,
          (responseCountByRun.get(r.survey_run_id) || 0) + 1
        );
      }
    }

    const votesCountByRun = new Map<string, number>();
    for (const v of votes || []) {
      const runId = responseRunMap.get(v.response_id);
      if (runId) {
        votesCountByRun.set(runId, (votesCountByRun.get(runId) || 0) + 1);
      }
    }

    return runs.map((run) => {
      const pIds = run.product_ids || [];
      const prods = pIds.map((id: string) => prodMap.get(id)).filter(Boolean) as Product[];
      return {
        ...run,
        totalResponses: responseCountByRun.get(run.id) || 0,
        totalVotesCast: votesCountByRun.get(run.id) || 0,
        products: prods,
      };
    });
  }

  /**
   * Creates a new documented survey run, optionally setting it as active (which archives previous active runs).
   */
  public static async createSurveyRun(
    input: {
      title: string;
      description?: string;
      product_ids: string[];
      setAsActive?: boolean;
    },
    actor?: { email?: string; role?: string }
  ): Promise<SurveyRun> {
    const supabase = getSupabaseAdminClient();

    if (!input.title?.trim()) {
      throw new Error('Survey Run title is required.');
    }

    const setAsActive = input.setAsActive !== false;

    // If setting as active, archive previously active runs
    if (setAsActive) {
      await supabase
        .from('survey_runs')
        .update({
          status: 'archived',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('status', 'active');
    }

    const { data: newRun, error } = await supabase
      .from('survey_runs')
      .insert({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        status: setAsActive ? 'active' : 'draft',
        product_ids: input.product_ids || [],
        created_by: actor?.email || 'admin',
      })
      .select('*')
      .single();

    if (error || !newRun) {
      console.error('[SurveyService.createSurveyRun] DB error:', error);
      throw new Error(error?.message || 'Failed to create survey run.');
    }

    await AuditService.recordLog({
      actor_email: actor?.email || 'admin@dissafyt.com',
      actor_role: actor?.role || 'admin',
      action: 'service.create' as any,
      entity_type: 'survey_run',
      entity_id: newRun.id,
      entity_name: newRun.title,
      changes: newRun,
    });

    return newRun as SurveyRun;
  }

  /**
   * Updates product selection (select/deselect) for a survey run.
   */
  public static async updateSurveyRunProducts(
    runId: string,
    product_ids: string[],
    actor?: { email?: string; role?: string }
  ): Promise<SurveyRun> {
    const supabase = getSupabaseAdminClient();

    // Verify run exists and is not immutable (completed or archived)
    const { data: existingRun } = await supabase
      .from('survey_runs')
      .select('id, title, status')
      .eq('id', runId)
      .maybeSingle();

    if (!existingRun) {
      throw new Error('Survey run not found.');
    }

    if (existingRun.status === 'completed' || existingRun.status === 'archived') {
      throw new Error(
        `Survey run "${existingRun.title}" is ${existingRun.status} and immutable. Its products cannot be modified. Please launch a new survey run.`
      );
    }

    const { data: updated, error } = await supabase
      .from('survey_runs')
      .update({
        product_ids,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId)
      .select('*')
      .single();

    if (error || !updated) {
      console.error('[SurveyService.updateSurveyRunProducts] DB error:', error);
      throw new Error(error?.message || 'Failed to update survey run products.');
    }

    await AuditService.recordLog({
      actor_email: actor?.email || 'admin@dissafyt.com',
      actor_role: actor?.role || 'admin',
      action: 'service.update' as any,
      entity_type: 'survey_run',
      entity_id: runId,
      entity_name: updated.title,
      changes: { product_ids },
    });

    return updated as SurveyRun;
  }

  /**
   * Updates survey run details (title, description, status).
   */
  public static async updateSurveyRun(
    runId: string,
    input: {
      title?: string;
      description?: string;
      status?: 'active' | 'completed' | 'archived' | 'draft';
      product_ids?: string[];
    },
    actor?: { email?: string; role?: string }
  ): Promise<SurveyRun> {
    const supabase = getSupabaseAdminClient();

    // Verify run exists and is not already immutable
    const { data: existingRun } = await supabase
      .from('survey_runs')
      .select('id, title, status')
      .eq('id', runId)
      .maybeSingle();

    if (!existingRun) {
      throw new Error('Survey run not found.');
    }

    // Once a run is marked completed or archived, it is permanently locked and cannot be edited or reactivated
    if (existingRun.status === 'completed' || existingRun.status === 'archived') {
      throw new Error(
        `Survey run "${existingRun.title}" is ${existingRun.status} and immutable. Completed runs cannot be edited or reactivated. Please start a new survey run.`
      );
    }

    // If making this run active, archive any other active runs
    if (input.status === 'active') {
      await supabase
        .from('survey_runs')
        .update({
          status: 'archived',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('status', 'active')
        .neq('id', runId);
    }

    const payload: any = {
      ...input,
      updated_at: new Date().toISOString(),
    };
    if (input.status === 'completed' || input.status === 'archived') {
      payload.completed_at = new Date().toISOString();
    } else if (input.status === 'active') {
      payload.completed_at = null;
    }

    const { data: updated, error } = await supabase
      .from('survey_runs')
      .update(payload)
      .eq('id', runId)
      .select('*')
      .single();

    if (error || !updated) {
      console.error('[SurveyService.updateSurveyRun] DB error:', error);
      throw new Error(error?.message || 'Failed to update survey run.');
    }

    await AuditService.recordLog({
      actor_email: actor?.email || 'admin@dissafyt.com',
      actor_role: actor?.role || 'admin',
      action: 'service.update' as any,
      entity_type: 'survey_run',
      entity_id: runId,
      entity_name: updated.title,
      changes: payload,
    });

    return updated as SurveyRun;
  }

  /**
   * Fetches active products formatted for the public customer pricing survey.
   * If a survey run is specified or active, filters ONLY to selected products for that run.
   * If no survey run is active (e.g. marked complete), indicates that the survey is closed.
   */
  public static async getPublicSurveyProducts(runId?: string): Promise<{
    active: boolean;
    status: string;
    runId: string | null;
    runTitle: string | null;
    products: any[];
  }> {
    const supabase = getSupabaseAdminClient();

    let targetRun: SurveyRun | null = null;
    if (runId) {
      const { data } = await supabase
        .from('survey_runs')
        .select('*')
        .eq('id', runId)
        .maybeSingle();
      if (data) targetRun = data as SurveyRun;
    }

    if (!targetRun) {
      targetRun = await this.getActiveSurveyRun();
    }

    // If no run found or the run is NOT active, public survey is deactivated/closed
    if (!targetRun || targetRun.status !== 'active') {
      return {
        active: false,
        status: targetRun?.status || 'completed',
        runId: targetRun?.id || null,
        runTitle: targetRun?.title || null,
        products: [],
      };
    }

    // If targetRun has no products selected, survey is active but has no products yet
    if (!targetRun.product_ids || targetRun.product_ids.length === 0) {
      return {
        active: true,
        status: 'active',
        runId: targetRun.id,
        runTitle: targetRun.title,
        products: [],
      };
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, description, base_price, cost_price, images, is_preorder, preorder_message, category_id')
      .eq('is_active', true)
      .in('id', targetRun.product_ids)
      .order('created_at', { ascending: false });

    if (error || !products) {
      return {
        active: true,
        status: 'active',
        runId: targetRun.id,
        runTitle: targetRun.title,
        products: [],
      };
    }

    const formattedProducts = products.map((prod) => {
      const tierData = this.calculateTiers(prod);
      return {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        images: prod.images || [],
        is_preorder: prod.is_preorder,
        preorder_message: prod.preorder_message,
        // Customer-facing price choices (BLIND - no margin percentage shown)
        priceOptions: [
          {
            tier: 'tier_50',
            label: tierData.tiers[0].customerDisplay,
            price: tierData.tiers[0].price,
          },
          {
            tier: 'tier_75',
            label: tierData.tiers[1].customerDisplay,
            price: tierData.tiers[1].price,
          },
          {
            tier: 'tier_100',
            label: tierData.tiers[2].customerDisplay,
            price: tierData.tiers[2].price,
          },
          {
            tier: 'not_interested',
            label: "Above my budget / Wouldn't buy",
            price: 0,
          },
        ],
      };
    });

    return {
      active: true,
      status: 'active',
      runId: targetRun.id,
      runTitle: targetRun.title,
      products: formattedProducts,
    };
  }

  /**
   * Submits prospect pricing survey responses and votes to the database,
   * linking them to the active survey run.
   */
  public static async submitSurveyResponse(input: SurveySubmissionInput) {
    const supabase = getSupabaseAdminClient();

    if (!input.votes || input.votes.length === 0) {
      throw new Error('At least one product price vote is required.');
    }

    // Resolve survey_run_id and enforce active survey
    let targetRun: SurveyRun | null = null;
    if (input.survey_run_id) {
      const { data } = await supabase
        .from('survey_runs')
        .select('*')
        .eq('id', input.survey_run_id)
        .maybeSingle();
      if (data) targetRun = data as SurveyRun;
    }
    if (!targetRun) {
      targetRun = await this.getActiveSurveyRun();
    }

    if (!targetRun || targetRun.status !== 'active') {
      throw new Error('The pricing survey is currently closed. No submissions are being accepted at this time.');
    }

    const runId = targetRun.id;

    // 1. Insert parent survey response record
    const { data: responseData, error: respError } = await supabase
      .from('product_survey_responses')
      .insert({
        survey_run_id: runId,
        respondent_name: input.respondent_name?.trim() || null,
        respondent_email: input.respondent_email?.trim() || null,
        respondent_phone: input.respondent_phone?.trim() || null,
        general_feedback: input.general_feedback?.trim() || null,
        source: input.source || 'web',
      })
      .select('id, created_at')
      .single();

    if (respError || !responseData) {
      console.error('[SurveyService] Failed to insert survey response:', respError);
      throw new Error(respError?.message || 'Failed to record survey response.');
    }

    const responseId = responseData.id;

    // 2. Fetch products to calculate margin and unit profit for each vote
    const productIds = input.votes.map((v) => v.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('id, cost_price, base_price')
      .in('id', productIds);

    const productMap = new Map((products || []).map((p) => [p.id, p]));

    // 3. Prepare votes records
    const voteRows = input.votes.map((v) => {
      const prod = productMap.get(v.product_id);
      let marginPct = 0;
      let estProfit = 0;

      if (v.tier_selected === 'tier_50') marginPct = 50;
      else if (v.tier_selected === 'tier_75') marginPct = 75;
      else if (v.tier_selected === 'tier_100') marginPct = 100;

      if (prod && v.selected_price > 0) {
        const cost = Number(prod.cost_price) || Math.round(Number(prod.base_price) / 1.5);
        estProfit = Math.max(0, v.selected_price - cost);
      }

      return {
        response_id: responseId,
        product_id: v.product_id,
        selected_price: Number(v.selected_price) || 0,
        tier_selected: v.tier_selected,
        margin_percentage: marginPct,
        estimated_profit: estProfit,
        feedback_note: v.notes?.trim() || null,
      };
    });

    const { error: votesError } = await supabase
      .from('product_survey_votes')
      .insert(voteRows);

    if (votesError) {
      console.error('[SurveyService] Failed to record survey votes:', votesError);
      throw new Error(votesError.message || 'Failed to record votes.');
    }

    // 4. Dispatch R20 voucher email with promo code 'firstbuy26' if email is provided
    if (input.respondent_email && input.respondent_email.includes('@')) {
      try {
        await EmailService.sendSurveyVoucherNotice({
          customerName: input.respondent_name,
          customerEmail: input.respondent_email,
          voucherCode: 'firstbuy26',
          discountAmount: 20,
        });
      } catch (emailErr) {
        console.error('[SurveyService] Failed to send survey voucher email:', emailErr);
      }
    }

    return {
      success: true,
      responseId,
    };
  }

  /**
   * Retrieves comprehensive survey feedback analytics and product insights for the admin dashboard.
   * Supports filtering by a specific survey run ID to review historical runs or view the current active run.
   */
  public static async getSurveyAnalytics(runId?: string): Promise<SurveyAnalyticsSummary> {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch runs history
    const allRuns = await this.listSurveyRuns();
    const activeRun = allRuns.find((r) => r.status === 'active') || null;

    let selectedRun: SurveyRun | null = null;
    if (runId && runId !== 'active') {
      selectedRun = allRuns.find((r) => r.id === runId) || null;
    }
    if (!selectedRun) {
      selectedRun = activeRun || allRuns[0] || null;
    }

    // 2. Fetch products to include in analytics
    let productQuery = supabase.from('products').select('*');
    if (selectedRun && selectedRun.product_ids && selectedRun.product_ids.length > 0) {
      productQuery = productQuery.in('id', selectedRun.product_ids);
    }
    const { data: products, error: prodError } = await productQuery.order('created_at', { ascending: false });

    // 3. Fetch responses filtered by selected run
    let respQuery = supabase.from('product_survey_responses').select('*');
    if (selectedRun) {
      respQuery = respQuery.eq('survey_run_id', selectedRun.id);
    }
    const { data: responses } = await respQuery.order('created_at', { ascending: false }).limit(100);

    const allResponses = responses || [];
    const responseIds = allResponses.map((r) => r.id);

    // 4. Fetch votes belonging to those responses
    let allVotes: ProductSurveyVote[] = [];
    if (responseIds.length > 0) {
      const { data: votes } = await supabase
        .from('product_survey_votes')
        .select('*')
        .in('response_id', responseIds)
        .order('created_at', { ascending: false });
      allVotes = votes || [];
    }

    if (prodError || !products || products.length === 0) {
      return {
        activeRun,
        selectedRun,
        runs: allRuns,
        totalResponses: allResponses.length,
        totalVotesCast: allVotes.length,
        productInsights: [],
        recentSubmissions: allResponses,
      };
    }

    // Group votes by product
    const votesByProduct = new Map<string, ProductSurveyVote[]>();
    for (const v of allVotes) {
      const list = votesByProduct.get(v.product_id) || [];
      list.push(v);
      votesByProduct.set(v.product_id, list);
    }

    // Group votes by response_id for recent submissions
    const votesByResponse = new Map<string, ProductSurveyVote[]>();
    for (const v of allVotes) {
      const list = votesByResponse.get(v.response_id) || [];
      list.push(v);
      votesByResponse.set(v.response_id, list);
    }

    const enhancedResponses = allResponses.map((r) => ({
      ...r,
      votes: votesByResponse.get(r.id) || [],
    }));

    // Build insights per product
    const productInsights: ProductSurveyInsight[] = products.map((prod) => {
      const pVotes = votesByProduct.get(prod.id) || [];
      const totalVotes = pVotes.length;
      const tiers = this.calculateTiers(prod);

      const tierCounts = {
        tier_50: pVotes.filter((v) => v.tier_selected === 'tier_50').length,
        tier_75: pVotes.filter((v) => v.tier_selected === 'tier_75').length,
        tier_100: pVotes.filter((v) => v.tier_selected === 'tier_100').length,
        not_interested: pVotes.filter((v) => v.tier_selected === 'not_interested').length,
      };

      const tierPercentages = {
        tier_50: totalVotes > 0 ? Math.round((tierCounts.tier_50 / totalVotes) * 100) : 0,
        tier_75: totalVotes > 0 ? Math.round((tierCounts.tier_75 / totalVotes) * 100) : 0,
        tier_100: totalVotes > 0 ? Math.round((tierCounts.tier_100 / totalVotes) * 100) : 0,
        not_interested: totalVotes > 0 ? Math.round((tierCounts.not_interested / totalVotes) * 100) : 0,
      };

      const interestedVotes = tierCounts.tier_50 + tierCounts.tier_75 + tierCounts.tier_100;
      const sumPrices = pVotes
        .filter((v) => v.selected_price > 0)
        .reduce((acc, curr) => acc + Number(curr.selected_price), 0);
      const averageWillingnessToPay =
        interestedVotes > 0 ? Math.round(sumPrices / interestedVotes) : tiers.currentRetail;

      // Batch size for profit modeling
      const batchTarget = prod.preorder_target || 50;
      const price50 = tiers.tiers[0].price;
      const price75 = tiers.tiers[1].price;
      const price100 = tiers.tiers[2].price;
      const unitCost = tiers.cost;

      // Acceptance at each tier (those who accept higher tiers would also buy at lower tiers)
      const accept50 = interestedVotes; // everyone willing to buy at 50, 75, or 100
      const accept75 = tierCounts.tier_75 + tierCounts.tier_100;
      const accept100 = tierCounts.tier_100;

      const conversion50 = totalVotes > 0 ? accept50 / totalVotes : 0.8;
      const conversion75 = totalVotes > 0 ? accept75 / totalVotes : 0.6;
      const conversion100 = totalVotes > 0 ? accept100 / totalVotes : 0.4;

      const projectedProfit50 = Math.round((price50 - unitCost) * batchTarget * conversion50);
      const projectedProfit75 = Math.round((price75 - unitCost) * batchTarget * conversion75);
      const projectedProfit100 = Math.round((price100 - unitCost) * batchTarget * conversion100);

      // Determine optimal tier
      let optimalTier: 'tier_50' | 'tier_75' | 'tier_100' = 'tier_50';
      let optimalPrice = price50;
      let recommendationReason = 'Initial 50% margin recommended for launch volume.';

      if (totalVotes === 0) {
        optimalTier = 'tier_50';
        optimalPrice = price50;
        recommendationReason = 'Awaiting survey votes for this run. 50% markup provides low entry barrier for launch.';
      } else if (projectedProfit75 >= projectedProfit50 && projectedProfit75 >= projectedProfit100) {
        optimalTier = 'tier_75';
        optimalPrice = price75;
        recommendationReason = `${tierPercentages.tier_75 + tierPercentages.tier_100}% of respondents willing to pay R ${price75}+, maximizing batch net profit (R ${projectedProfit75.toLocaleString()}).`;
      } else if (projectedProfit100 >= projectedProfit50 && projectedProfit100 >= projectedProfit75 && tierPercentages.tier_100 >= 30) {
        optimalTier = 'tier_100';
        optimalPrice = price100;
        recommendationReason = `Strong premium positioning: ${tierPercentages.tier_100}% voted for R ${price100}, delivering highest margin without killing demand.`;
      } else {
        optimalTier = 'tier_50';
        optimalPrice = price50;
        recommendationReason = `High price sensitivity detected: R ${price50} ensures maximum ${tierPercentages.tier_50}% conversion to fill batch quickly.`;
      }

      return {
        product: prod,
        tiers,
        totalVotes,
        interestedVotes,
        tierCounts,
        tierPercentages,
        averageWillingnessToPay,
        optimalTier,
        optimalPrice,
        recommendationReason,
        projectedProfitPerBatch: {
          tier_50: projectedProfit50,
          tier_75: projectedProfit75,
          tier_100: projectedProfit100,
        },
      };
    });

    return {
      activeRun,
      selectedRun,
      runs: allRuns,
      totalResponses: allResponses.length,
      totalVotesCast: allVotes.length,
      productInsights,
      recentSubmissions: enhancedResponses,
    };
  }

  /**
   * Applies the surveyed price directly to the catalog product as its new base_price.
   */
  public static async applyPriceToProduct(
    productId: string,
    newPrice: number,
    adminUser: { id: string; email?: string }
  ) {
    const supabase = getSupabaseAdminClient();

    const { data: existing, error: getErr } = await supabase
      .from('products')
      .select('id, name, base_price')
      .eq('id', productId)
      .single();

    if (getErr || !existing) {
      throw new Error('Product not found.');
    }

    const oldPrice = existing.base_price;

    const { error: updateErr } = await supabase
      .from('products')
      .update({
        base_price: newPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (updateErr) {
      throw new Error(updateErr.message || 'Failed to update product base price.');
    }

    await AuditService.recordLog({
      actor_id: adminUser.id,
      actor_email: adminUser.email || 'admin@dissafyt.com',
      action: 'product:update_pricing_from_survey',
      entity_type: 'product',
      entity_id: productId,
      entity_name: existing.name,
      changes: {
        old_base_price: oldPrice,
        new_base_price: newPrice,
        reason: 'Applied survey sweet-spot price recommendation',
      },
    });


    return {
      success: true,
      productId,
      newPrice,
      oldPrice,
    };
  }
}
