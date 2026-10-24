'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@dissafyt/ui';
import { ShoppingBag, Plus, Trash2, CheckCircle, CheckCircle2, Play, Lock, XCircle, Tag, Layers, RefreshCw, Package, Pencil, Copy, Check, ExternalLink, Share2, HelpCircle, Upload, Image as ImageIcon, Palette, Loader2, Sparkles, X, MessageSquare, TrendingUp, Percent, AlertCircle, Phone, Send, DollarSign, BarChart3, Vote, Sliders, History, Calendar, CheckSquare, Square, Archive } from 'lucide-react';

import { adminFetch } from '@/lib/operator';

interface Variant {
  id?: string;
  name: string;
  sku: string;
  stock_quantity: number;
  price_override?: number | null;
  is_active?: boolean;
  color?: string | null;
  color_hex?: string | null;
  size?: string | null;
  image_url?: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  cost_price?: number | null;
  supplier_name?: string | null;
  supplier_sku?: string | null;
  batch_status?: string | null;
  category_id?: string;
  category_name?: string;
  is_active: boolean;
  images: string[];
  is_preorder?: boolean;
  preorder_message?: string | null;
  preorder_target?: number | null;
  preorder_deposit_pct?: number | null;
  preorder_claimed_count?: number | null;
  variants: Variant[];
}

interface BatchOrderData {
  product: Product;
  orders: any[];
  sizeBreakdown: Record<string, number>;
  colorBreakdown: Record<string, number>;
  totalUnits: number;
  totalCommittedValue: number;
  target: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SurveyTierData {
  tierKey: string;
  customerDisplay: string;
  price: number;
  marginPct: number;
  markupPct: number;
  unitProfit: number;
}

interface ProductSurveyInsight {
  product: Product;
  tiers: {
    cost: number;
    currentRetail: number;
    tiers: SurveyTierData[];
  };
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

interface SurveySubmission {
  id: string;
  respondent_name?: string | null;
  respondent_email?: string | null;
  respondent_phone?: string | null;
  general_feedback?: string | null;
  source?: string;
  created_at: string;
  votes?: {
    id: string;
    product_id: string;
    selected_price: number;
    tier_selected: string;
    margin_percentage: number;
    feedback_note?: string | null;
    created_at: string;
  }[];
}

interface SurveyRun {
  id: string;
  title: string;
  description?: string | null;
  status: 'active' | 'completed' | 'archived' | 'draft';
  product_ids: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  created_by?: string | null;
  totalResponses?: number;
  totalVotesCast?: number;
  products?: Product[];
}

interface SurveyAnalyticsSummary {
  totalResponses: number;
  totalVotesCast: number;
  productInsights: ProductSurveyInsight[];
  recentSubmissions: SurveySubmission[];
  activeRun?: SurveyRun | null;
  selectedRun?: SurveyRun | null;
  runs?: SurveyRun[];
}


interface StreetwearColorway {
  name: string;
  hex: string;
}

const PRESET_COLORWAYS: StreetwearColorway[] = [
  { name: 'Onyx Black', hex: '#111111' },
  { name: 'Washed Bone', hex: '#EBE7DE' },
  { name: 'Vintage Olive', hex: '#4F523A' },
  { name: 'Charcoal Grey', hex: '#373737' },
  { name: 'Rich Burgundy', hex: '#581825' },
  { name: 'Sand / Khaki', hex: '#C2B280' },
];

const DEFAULT_STREETWEAR_SIZES = ['S', 'M', 'L', 'XL', '2XL'];

export default function AdminCommercePage() {
  const pathname = usePathname();
  const basePrefix = pathname.startsWith('/admin') ? '/admin' : '';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMetaSyncModal, setShowMetaSyncModal] = useState(false);

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editSupplierName, setEditSupplierName] = useState('');
  const [editSupplierSku, setEditSupplierSku] = useState('');
  const [editBatchStatus, setEditBatchStatus] = useState('accumulating');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editStockQuantity, setEditStockQuantity] = useState('25');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsPreorder, setEditIsPreorder] = useState(false);
  const [editPreorderMessage, setEditPreorderMessage] = useState('');
  const [editPreorderTarget, setEditPreorderTarget] = useState('');
  const [editPreorderDepositPct, setEditPreorderDepositPct] = useState('50');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editManualUrl, setEditManualUrl] = useState('');
  const [editUploadingImages, setEditUploadingImages] = useState(false);
  const [editIsDragging, setEditIsDragging] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [editSelectedColorways, setEditSelectedColorways] = useState<StreetwearColorway[]>([]);
  const [editCustomColorName, setEditCustomColorName] = useState('');
  const [editCustomColorHex, setEditCustomColorHex] = useState('#222222');
  const [editShowCustomColorInput, setEditShowCustomColorInput] = useState(false);
  const [editVariants, setEditVariants] = useState<Variant[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Form State (Add Product)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierSku, setSupplierSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [manualUrl, setManualUrl] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stockQuantity, setStockQuantity] = useState('25');
  const [isPreorder, setIsPreorder] = useState(false);
  const [preorderMessage, setPreorderMessage] = useState('Batch 01: Ships 2–3 weeks from drop close');
  const [preorderTarget, setPreorderTarget] = useState('50');
  const [preorderDepositPct, setPreorderDepositPct] = useState('50');

  // Batch Orders & Sizing Drawer State
  const [selectedBatchProduct, setSelectedBatchProduct] = useState<Product | null>(null);
  const [batchData, setBatchData] = useState<BatchOrderData | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchNotifying, setBatchNotifying] = useState(false);
  const [batchNotifyMsg, setBatchNotifyMsg] = useState<string | null>(null);
  const [copiedSizing, setCopiedSizing] = useState(false);
  const [copiedLinkOrderId, setCopiedLinkOrderId] = useState<string | null>(null);

  // Subtab Navigation ('catalog' | 'survey_feedback')
  const [activeSubtab, setActiveSubtab] = useState<'catalog' | 'survey_feedback'>('catalog');
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyAnalyticsSummary | null>(null);
  const [applyingPriceProductId, setApplyingPriceProductId] = useState<string | null>(null);
  const [copiedSurveyUrl, setCopiedSurveyUrl] = useState(false);

  // Survey Runs & Product Selection Workflow State
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [showProductSelectionModal, setShowProductSelectionModal] = useState(false);
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [newRunTitle, setNewRunTitle] = useState('');
  const [newRunDescription, setNewRunDescription] = useState('');
  const [savingRunProducts, setSavingRunProducts] = useState(false);
  const [creatingRun, setCreatingRun] = useState(false);
  const [surveyActionMsg, setSurveyActionMsg] = useState<string | null>(null);


  // Colorways & Size Matrix (Add Product)
  const [selectedColorways, setSelectedColorways] = useState<StreetwearColorway[]>([]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#222222');
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);
  const [colorMatrix, setColorMatrix] = useState<Variant[]>([]);

  // Simple sizing fallback
  const [useStreetwearSizes, setUseStreetwearSizes] = useState(true);
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>({
    S: 10,
    M: 15,
    L: 20,
    XL: 12,
    '2XL': 8,
  });

  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  function getMarginMetrics(retailStr: string, costStr: string, targetStr: string) {
    const retail = parseFloat(retailStr) || 0;
    const cost = parseFloat(costStr) || 0;
    const target = parseInt(targetStr, 10) || 50;

    const unitGrossProfit = retail - cost;
    const marginPct = retail > 0 ? Math.round((unitGrossProfit / retail) * 100) : 0;
    const markupPct = cost > 0 ? Math.round((unitGrossProfit / cost) * 100) : 0;
    const totalCapitalNeeded = cost * target;
    const projectedGrossRevenue = retail * target;
    const projectedNetProfit = unitGrossProfit * target;
    const breakEvenUnits = retail > 0 ? Math.ceil(totalCapitalNeeded / retail) : 0;

    return {
      retail,
      cost,
      target,
      unitGrossProfit,
      marginPct,
      markupPct,
      totalCapitalNeeded,
      projectedGrossRevenue,
      projectedNetProfit,
      breakEvenUnits,
    };
  }

  async function openBatchModal(prod: Product) {
    setSelectedBatchProduct(prod);
    setBatchData(null);
    setBatchNotifyMsg(null);
    setBatchLoading(true);
    try {
      const res = await adminFetch(`/api/products/${prod.id}/batch`);
      if (res.ok) {
        const data = await res.json();
        setBatchData(data);
      } else {
        const err = await res.json();
        setBatchNotifyMsg(err.error || 'Failed to load batch data');
      }
    } catch {
      setBatchNotifyMsg('Network error while loading batch');
    } finally {
      setBatchLoading(false);
    }
  }

  async function handleNotifyBatchCustomers() {
    if (!selectedBatchProduct || !batchData) return;
    if (!confirm(`Dispatch batch unlock payment emails to all ${batchData.orders.length} customers in this drop?`)) return;
    setBatchNotifying(true);
    setBatchNotifyMsg(null);
    try {
      const res = await adminFetch(`/api/products/${selectedBatchProduct.id}/batch`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBatchNotifyMsg(`Sent unlock notification to ${data.notifiedCount} backer(s) with personal 100% full & 50% deposit payment links!`);
        const refreshRes = await adminFetch(`/api/products/${selectedBatchProduct.id}/batch`);
        if (refreshRes.ok) {
          setBatchData(await refreshRes.json());
        }
      } else {
        setBatchNotifyMsg(`Failed to notify: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setBatchNotifyMsg(`Network error: ${err.message}`);
    } finally {
      setBatchNotifying(false);
    }
  }

  function copySupplierSizing() {
    if (!batchData) return;
    const lines = [
      `Dissafyt Supplier Procurement Order`,
      `Product: ${batchData.product.name}`,
      `Supplier: ${batchData.product.supplier_name || 'Unspecified'} | Blank SKU: ${batchData.product.supplier_sku || 'N/A'}`,
      `Total Pre-ordered Units: ${batchData.totalUnits}`,
      `Batch Drop Goal: ${batchData.target} units`,
      ``,
      `Size Breakdown for Blanks:`,
      ...Object.entries(batchData.sizeBreakdown).map(([size, count]) => `  • Size ${size}: ${count} units`),
      ...(Object.keys(batchData.colorBreakdown).length > 0 ? [
        ``,
        `Color Breakdown:`,
        ...Object.entries(batchData.colorBreakdown).map(([color, count]) => `  • Color ${color}: ${count} units`)
      ] : []),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSizing(true);
    setTimeout(() => setCopiedSizing(false), 2500);
  }

  function copyOrderPaymentLink(orderNumber: string, url: string) {
    navigator.clipboard.writeText(url);
    setCopiedLinkOrderId(orderNumber);
    setTimeout(() => setCopiedLinkOrderId(null), 2500);
  }

  // Meta Commerce Feed State
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [showFeedGuide, setShowFeedGuide] = useState(false);

  function copyFeedUrl(format: 'xml' | 'csv' = 'xml') {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://admin.dissafyt.com';
    const feedUrl = format === 'csv'
      ? `${origin}/api/catalog/meta-feed?format=csv`
      : `${origin}/api/catalog/meta-feed`;
    navigator.clipboard.writeText(feedUrl);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2500);
  }

  async function uploadFilesToStorage(files: FileList | File[]): Promise<{ urls: string[]; telemetry?: string }> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const res = await adminFetch('/api/products/upload-image', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload image(s)');
    }
    const urls: string[] = data.urls || (data.url ? [data.url] : []);
    let telemetry = '';
    if (data.compression && data.compression.originalSizeBytes > 0) {
      const origMb = (data.compression.originalSizeBytes / (1024 * 1024)).toFixed(2);
      const compKb = Math.round(data.compression.compressedSizeBytes / 1024);
      telemetry = ` (optimized from ${origMb}MB to ${compKb}KB, -${data.compression.savingsPercent}%)`;
    }
    return { urls, telemetry };
  }

  async function handleAddImagesUpload(files: FileList | File[]) {
    try {
      setUploadingImages(true);
      setStatusMsg(null);
      const { urls, telemetry } = await uploadFilesToStorage(files);
      setImages((prev) => [...prev, ...urls]);
      setStatusMsg(`Uploaded ${urls.length} product image(s)${telemetry || ''} to Supabase Storage.`);
    } catch (err: any) {
      setStatusMsg(`Upload failed: ${err.message}`);
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleEditImagesUpload(files: FileList | File[]) {
    try {
      setEditUploadingImages(true);
      setStatusMsg(null);
      const { urls, telemetry } = await uploadFilesToStorage(files);
      setEditImages((prev) => [...prev, ...urls]);
      setStatusMsg(`Uploaded ${urls.length} product image(s)${telemetry || ''} to Supabase Storage.`);
    } catch (err: any) {
      setStatusMsg(`Upload failed: ${err.message}`);
    } finally {
      setEditUploadingImages(false);
    }
  }

  function toggleAddColorway(colorway: StreetwearColorway) {
    const exists = selectedColorways.some(
      (c) => c.name.toLowerCase() === colorway.name.toLowerCase()
    );
    let nextColorways: StreetwearColorway[];
    if (exists) {
      nextColorways = selectedColorways.filter(
        (c) => c.name.toLowerCase() !== colorway.name.toLowerCase()
      );
    } else {
      nextColorways = [...selectedColorways, colorway];
    }
    setSelectedColorways(nextColorways);

    // Rebuild matrix
    const prefix = (name || 'DROP').substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'DROP';
    const newMatrix: Variant[] = [];
    nextColorways.forEach((cw) => {
      const colorClean = cw.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'COL';
      DEFAULT_STREETWEAR_SIZES.forEach((sz) => {
        const existing = colorMatrix.find(
          (m) =>
            (m.color || '').toLowerCase() === cw.name.toLowerCase() &&
            (m.size || '').toLowerCase() === sz.toLowerCase()
        );
        newMatrix.push({
          name: `${cw.name} / ${sz}`,
          color: cw.name,
          color_hex: cw.hex,
          size: sz,
          sku: existing?.sku || `${prefix}-${colorClean}-${sz}-${Math.floor(100 + Math.random() * 900)}`,
          stock_quantity: existing ? existing.stock_quantity : (sizeStocks[sz] ?? 10),
          image_url: existing?.image_url || null,
        });
      });
    });
    setColorMatrix(newMatrix);
  }

  function handleAddCustomColorway() {
    if (!customColorName.trim()) return;
    const newCw: StreetwearColorway = {
      name: customColorName.trim(),
      hex: customColorHex || '#222222',
    };
    toggleAddColorway(newCw);
    setCustomColorName('');
    setShowCustomColorInput(false);
  }

  function updateColorMatrixStock(color: string, size: string, qty: number) {
    setColorMatrix((prev) =>
      prev.map((v) => {
        if (
          (v.color || '').toLowerCase() === color.toLowerCase() &&
          (v.size || '').toLowerCase() === size.toLowerCase()
        ) {
          return { ...v, stock_quantity: qty };
        }
        return v;
      })
    );
  }

  function assignImageToColorway(color: string, imageUrl: string) {
    setColorMatrix((prev) =>
      prev.map((v) => {
        if ((v.color || '').toLowerCase() === color.toLowerCase()) {
          return { ...v, image_url: imageUrl || null };
        }
        return v;
      })
    );
  }

  function toggleEditColorway(colorway: StreetwearColorway) {
    const exists = editSelectedColorways.some(
      (c) => c.name.toLowerCase() === colorway.name.toLowerCase()
    );
    let nextColorways: StreetwearColorway[];
    if (exists) {
      nextColorways = editSelectedColorways.filter(
        (c) => c.name.toLowerCase() !== colorway.name.toLowerCase()
      );
      // Remove variants belonging to this unselected color
      setEditVariants((prev) =>
        prev.filter((v) => (v.color || '').toLowerCase() !== colorway.name.toLowerCase())
      );
    } else {
      nextColorways = [...editSelectedColorways, colorway];
      // Automatically generate streetwear size variants for this newly added/selected color
      const prefix = (editSlug || editName || 'DROP').substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'DROP';
      const colorClean = colorway.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'COL';
      const newVariantsForColor: Variant[] = DEFAULT_STREETWEAR_SIZES.map((sz) => ({
        name: `${colorway.name} / ${sz}`,
        color: colorway.name,
        color_hex: colorway.hex,
        size: sz,
        sku: `${prefix}-${colorClean}-${sz}-${Math.floor(100 + Math.random() * 900)}`,
        stock_quantity: 15,
        image_url: null,
      }));
      setEditVariants((prev) => {
        // Strip out single generic 'Standard' placeholder if present
        const filtered = prev.filter((v) => v.name !== 'Standard' || v.color);
        return [...filtered, ...newVariantsForColor];
      });
    }
    setEditSelectedColorways(nextColorways);
  }

  function applyColorwaysMatrixToEdit() {
    if (editSelectedColorways.length === 0) return;
    const prefix = (editSlug || editName || 'DROP').substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'DROP';
    const updatedVariants: Variant[] = [];

    editSelectedColorways.forEach((cw) => {
      const colorClean = cw.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'COL';
      DEFAULT_STREETWEAR_SIZES.forEach((sz) => {
        const existing = editVariants.find(
          (v) =>
            (v.color || '').toLowerCase() === cw.name.toLowerCase() &&
            (v.size || v.name || '').toLowerCase() === sz.toLowerCase()
        );
        updatedVariants.push({
          id: existing?.id,
          name: `${cw.name} / ${sz}`,
          color: cw.name,
          color_hex: cw.hex,
          size: sz,
          sku: existing?.sku || `${prefix}-${colorClean}-${sz}-${Math.floor(100 + Math.random() * 900)}`,
          stock_quantity: existing ? existing.stock_quantity : 15,
          image_url: existing?.image_url || null,
        });
      });
    });
    setEditVariants(updatedVariants);
  }

  function updateEditVariantStock(idx: number, qty: number) {
    const updated = [...editVariants];
    updated[idx] = { ...updated[idx], stock_quantity: qty };
    setEditVariants(updated);
  }

  function assignEditVariantImage(color: string, imageUrl: string) {
    setEditVariants((prev) =>
      prev.map((v) => {
        if ((v.color || '').toLowerCase() === color.toLowerCase()) {
          return { ...v, image_url: imageUrl || null };
        }
        return v;
      })
    );
  }

  async function loadSurveyFeedback(runId?: string) {
    setSurveyLoading(true);
    setSurveyActionMsg(null);
    try {
      const url = runId ? `/api/products/survey?runId=${encodeURIComponent(runId)}` : '/api/products/survey';
      const res = await adminFetch(url);
      if (res.ok) {
        const data: SurveyAnalyticsSummary = await res.json();
        setSurveyData(data);
        if (data.selectedRun) {
          setSelectedRunId(data.selectedRun.id);
        } else if (data.activeRun) {
          setSelectedRunId(data.activeRun.id);
        }
      }
    } catch (err) {
      console.error('Failed to load survey feedback:', err);
    } finally {
      setSurveyLoading(false);
    }
  }

  function openProductSelectionModal() {
    const currentRun = surveyData?.selectedRun || surveyData?.activeRun;
    if (currentRun && Array.isArray(currentRun.product_ids) && currentRun.product_ids.length > 0) {
      setSelectedProductIds([...currentRun.product_ids]);
    } else {
      setSelectedProductIds(products.filter((p) => p.is_active).map((p) => p.id));
    }
    setSurveyActionMsg(null);
    setShowProductSelectionModal(true);
  }

  function openNewRunModalWithCurrentSelection() {
    setShowProductSelectionModal(false);
    setNewRunTitle(`Run #${(surveyData?.runs?.length || 0) + 1}: Catalog Drop Survey (${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`);
    setNewRunDescription('');
    setShowNewRunModal(true);
  }

  async function handleCompleteSurveyRun(runId?: string) {
    const targetId = runId || selectedRunId || surveyData?.activeRun?.id;
    if (!targetId) return;
    const targetRun = surveyData?.runs?.find((r) => r.id === targetId);
    const title = targetRun?.title || 'current run';
    if (targetRun?.status === 'completed' || targetRun?.status === 'archived') {
      alert(`Survey run "${title}" is already completed and permanently immutable.`);
      return;
    }
    if (!confirm(`Mark "${title}" as Complete? This will permanently LOCK this run as immutable (it can never be modified or reactivated) and DEACTIVATE the public survey storefront (/survey) until a new run is launched.`)) {
      return;
    }
    setSurveyLoading(true);
    setSurveyActionMsg(null);
    try {
      const res = await adminFetch('/api/products/survey', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: targetId,
          status: 'completed',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSurveyActionMsg(`Survey run "${title}" is now marked as COMPLETED & IMMUTABLE. The public survey is deactivated.`);
        await loadSurveyFeedback(targetId);
      } else {
        alert(data.error || 'Failed to complete survey run');
      }
    } catch (err: any) {
      alert(err.message || 'Error completing survey run');
    } finally {
      setSurveyLoading(false);
    }
  }

  async function handleActivateSurveyRun(runId: string) {
    const targetRun = surveyData?.runs?.find((r) => r.id === runId);
    const title = targetRun?.title || 'survey run';
    if (targetRun?.status === 'completed' || targetRun?.status === 'archived') {
      alert(`Survey run "${title}" is completed and immutable. Completed runs cannot be reactivated. Please use "Start New Run" or "Branch New Run" to launch an updated survey.`);
      return;
    }
    if (!confirm(`Reactivate "${title}" as the Live Survey? This will make its selected products available to customers at /survey and archive any currently active run.`)) {
      return;
    }
    setSurveyLoading(true);
    setSurveyActionMsg(null);
    try {
      const res = await adminFetch('/api/products/survey', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId,
          status: 'active',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSurveyActionMsg(`Survey run "${title}" is now LIVE on /survey.`);
        setSelectedRunId(runId);
        await loadSurveyFeedback(runId);
      } else {
        alert(data.error || 'Failed to activate survey run');
      }
    } catch (err: any) {
      alert(err.message || 'Error activating survey run');
    } finally {
      setSurveyLoading(false);
    }
  }

  function handleToggleProductInSelection(productId: string) {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }

  function handleSelectAllProducts() {
    setSelectedProductIds(products.map((p) => p.id));
  }

  function handleDeselectAllProducts() {
    setSelectedProductIds([]);
  }

  function handleSelectOnlyActiveProducts() {
    setSelectedProductIds(products.filter((p) => p.is_active).map((p) => p.id));
  }

  async function handleSaveRunProducts() {
    const targetRun = surveyData?.selectedRun || surveyData?.activeRun;
    if (!targetRun) {
      alert('No active or selected survey run to update.');
      return;
    }

    if (targetRun.status === 'completed' || targetRun.status === 'archived') {
      alert(`Survey run "${targetRun.title}" is ${targetRun.status} and immutable. It cannot be edited. Please click "Launch as New Run" to start an updated survey.`);
      return;
    }

    setSavingRunProducts(true);
    setSurveyActionMsg(null);
    try {
      const res = await adminFetch('/api/products/survey', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: targetRun.id,
          product_ids: selectedProductIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSurveyActionMsg(`Updated survey products for "${targetRun.title}" (${selectedProductIds.length} items selected). Public survey will now feature this exact set.`);
        setShowProductSelectionModal(false);
        await loadSurveyFeedback(targetRun.id);
      } else {
        alert(data.error || 'Failed to update survey products');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating survey products');
    } finally {
      setSavingRunProducts(false);
    }
  }

  async function handleCreateNewRun(e: React.FormEvent) {
    e.preventDefault();
    if (!newRunTitle.trim()) {
      alert('Please provide a title for the new survey run.');
      return;
    }

    setCreatingRun(true);
    setSurveyActionMsg(null);
    try {
      const res = await adminFetch('/api/products/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRunTitle.trim(),
          description: newRunDescription.trim() || undefined,
          product_ids: selectedProductIds,
          setAsActive: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSurveyActionMsg(`New survey run "${data.run.title}" activated with ${selectedProductIds.length} product(s). Previous run archived.`);
        setShowNewRunModal(false);
        setNewRunTitle('');
        setNewRunDescription('');
        await loadSurveyFeedback(data.run.id);
      } else {
        alert(data.error || 'Failed to create new survey run');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating survey run');
    } finally {
      setCreatingRun(false);
    }
  }

  async function handleApplySurveyPrice(productId: string, newPrice: number) {
    if (!confirm(`Apply R ${newPrice.toFixed(2)} as the official base price in the catalog?`)) {
      return;
    }
    setApplyingPriceProductId(productId);
    try {
      const res = await adminFetch('/api/products/survey/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, newPrice }),
      });
      if (res.ok) {
        setStatusMsg(`Product price updated to R ${newPrice.toFixed(2)} based on survey feedback.`);
        loadData();
        loadSurveyFeedback(selectedRunId || undefined);
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to update price');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating price');
    } finally {
      setApplyingPriceProductId(null);
    }
  }

  function getStorefrontSurveyUrl(): string {
    if (typeof window === 'undefined') return 'https://www.dissafyt.com/survey';
    const { protocol, host, port } = window.location;
    if (host.startsWith('admin.')) {
      return `${protocol}//${host.replace(/^admin\./, 'www.')}/survey`;
    }
    if (port === '3001') {
      return `${protocol}//${window.location.hostname}:3000/survey`;
    }
    return `${protocol}//${host}/survey`;
  }


  async function loadData() {
    setLoading(true);
    try {
      const [prodRes, catRes, surveyRes] = await Promise.all([
        adminFetch('/api/products', { cache: 'no-store' }),
        adminFetch('/api/categories', { cache: 'no-store' }),
        adminFetch('/api/products/survey', { cache: 'no-store' }).catch(() => null),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (surveyRes && surveyRes.ok) {
        const sData = await surveyRes.json();
        setSurveyData(sData);
        if (sData.selectedRun) {
          setSelectedRunId(sData.selectedRun.id);
        } else if (sData.activeRun) {
          setSelectedRunId(sData.activeRun.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);


  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      let variantsToSubmit: any[] = [];
      if (selectedColorways.length > 0) {
        variantsToSubmit = colorMatrix.map((v) => ({
          name: v.name,
          sku: v.sku,
          stock_quantity: Math.max(0, Number(v.stock_quantity) || 0),
          color: v.color,
          color_hex: v.color_hex,
          size: v.size,
          image_url: v.image_url || null,
        }));
      } else if (useStreetwearSizes) {
        variantsToSubmit = Object.entries(sizeStocks).map(([sizeName, qty]) => ({
          name: sizeName,
          sku: `${(name || 'DROP').substring(0, 4).toUpperCase()}-${sizeName}`,
          stock_quantity: Math.max(0, Number(qty) || 0),
          size: sizeName,
          color: null,
          color_hex: null,
          image_url: null,
        }));
      } else {
        variantsToSubmit = [
          {
            name: 'Standard',
            sku: `${(name || 'ITEM').substring(0, 4).toUpperCase()}-STD`,
            stock_quantity: parseInt(stockQuantity, 10) || 10,
            size: 'Standard',
            color: null,
            color_hex: null,
            image_url: null,
          },
        ];
      }

      const res = await adminFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          base_price: parseFloat(basePrice),
          cost_price: costPrice ? parseFloat(costPrice) : 0,
          supplier_name: supplierName || null,
          supplier_sku: supplierSku || null,
          batch_status: isPreorder ? 'accumulating' : null,
          category_id: categoryId || null,
          images: images,
          is_active: true,
          is_preorder: isPreorder,
          preorder_message: isPreorder ? preorderMessage : null,
          preorder_target: isPreorder && preorderTarget ? parseInt(preorderTarget, 10) : null,
          preorder_deposit_pct: isPreorder && preorderDepositPct ? parseInt(preorderDepositPct, 10) : 50,
          variants: variantsToSubmit,
        }),
      });

      if (res.ok) {
        setStatusMsg(`Product "${name}" created successfully with ${variantsToSubmit.length} variants and ${images.length} photos!`);
        setName('');
        setDescription('');
        setBasePrice('');
        setCostPrice('');
        setSupplierName('');
        setSupplierSku('');
        setImages([]);
        setManualUrl('');
        setSelectedColorways([]);
        setColorMatrix([]);
        setIsPreorder(false);
        setPreorderMessage('Batch 01: Ships 2–3 weeks from drop close');
        setPreorderTarget('50');
        setPreorderDepositPct('50');
        setShowAddModal(false);
        loadData();
      } else {
        const err = await res.json();
        setStatusMsg(`Failed: ${err.error}`);
      }
    } catch {
      setStatusMsg('Network error while saving product.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName) return;
    try {
      const res = await adminFetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
      });
      if (res.ok) {
        setCategoryName('');
        setShowCategoryModal(false);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function openEditModal(prod: Product) {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditSlug(prod.slug);
    setEditDescription(prod.description || '');
    setEditBasePrice(String(prod.base_price));
    setEditCostPrice(prod.cost_price != null ? String(prod.cost_price) : '');
    setEditSupplierName(prod.supplier_name || '');
    setEditSupplierSku(prod.supplier_sku || '');
    setEditBatchStatus(prod.batch_status || 'accumulating');
    const matchedCat = categories.find((c) => c.name === prod.category_name || c.id === prod.category_id);
    setEditCategoryId(matchedCat ? matchedCat.id : '');
    const stock = prod.variants?.reduce((acc, v) => acc + (v.stock_quantity || 0), 0) ?? 25;
    setEditStockQuantity(String(stock));
    setEditIsActive(prod.is_active);
    setEditIsPreorder(Boolean(prod.is_preorder));
    setEditPreorderMessage(prod.preorder_message || '');
    setEditPreorderTarget(prod.preorder_target ? String(prod.preorder_target) : '');
    setEditPreorderDepositPct(prod.preorder_deposit_pct ? String(prod.preorder_deposit_pct) : '50');
    setEditImages(prod.images || []);

    const existingColorways: StreetwearColorway[] = [];
    prod.variants?.forEach((v) => {
      if (v.color && !existingColorways.some((c) => c.name.toLowerCase() === v.color!.toLowerCase())) {
        existingColorways.push({
          name: v.color,
          hex: v.color_hex || PRESET_COLORWAYS.find((p) => p.name.toLowerCase() === v.color!.toLowerCase())?.hex || '#111111',
        });
      }
    });
    setEditSelectedColorways(existingColorways);

    setEditVariants(
      prod.variants && prod.variants.length > 0
        ? prod.variants.map((v) => ({ ...v }))
        : [{ name: 'Standard', stock_quantity: 10, sku: '' }]
    );
  }

  function applyStreetwearSizesToEdit() {
    setEditVariants(
      DEFAULT_STREETWEAR_SIZES.map((size) => {
        const existing = editVariants.find((v) => (v.size || v.name).toLowerCase() === size.toLowerCase());
        return {
          id: existing?.id,
          name: size,
          size: size,
          color: null,
          color_hex: null,
          sku: existing?.sku || `${(editSlug || 'ITEM').toUpperCase().slice(0, 4)}-${size}`,
          stock_quantity: existing ? existing.stock_quantity : 15,
        };
      })
    );
    setEditSelectedColorways([]);
  }

  async function handleSaveEditedProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    setEditSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await adminFetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          slug: editSlug,
          description: editDescription,
          base_price: parseFloat(editBasePrice) || 0,
          cost_price: editCostPrice ? parseFloat(editCostPrice) : null,
          supplier_name: editSupplierName || null,
          supplier_sku: editSupplierSku || null,
          batch_status: editIsPreorder ? editBatchStatus : null,
          category_id: editCategoryId || null,
          is_active: editIsActive,
          images: editImages,
          is_preorder: editIsPreorder,
          preorder_message: editIsPreorder ? editPreorderMessage : null,
          preorder_target: editIsPreorder && editPreorderTarget ? parseInt(editPreorderTarget, 10) : null,
          preorder_deposit_pct: editIsPreorder && editPreorderDepositPct ? parseInt(editPreorderDepositPct, 10) : 50,
          variants: editVariants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            stock_quantity: Math.max(0, Number(v.stock_quantity) || 0),
            price_override: v.price_override || null,
            color: v.color || null,
            color_hex: v.color_hex || null,
            size: v.size || v.name || null,
            image_url: v.image_url || null,
          })),
        }),
      });

      if (res.ok) {
        setStatusMsg(`Product "${editName}" updated successfully in catalog & logged to audit trail.`);
        setEditingProduct(null);
        loadData();
      } else {
        const data = await res.json();
        setStatusMsg(data.error || 'Failed to update product');
      }
    } catch {
      setStatusMsg('Network error while updating product');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function toggleProductStatus(product: Product) {
    try {
      await adminFetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !product.is_active }),
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await adminFetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setStatusMsg(err.error || 'Failed to delete product');
        return;
      }
      setStatusMsg('Product removed from catalog and logged to audit trail.');
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <ShoppingBag className="mr-3 h-8 w-8 text-amber-500" />
            Commerce Product Catalog
          </h1>
          <p className="text-sm text-stone-400">
            Create and maintain Dissafyt apparel items with PayFast checkout support.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link href={`${basePrefix}/commerce/batches`}>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-semibold shadow-sm"
            >
              <Layers className="h-4 w-4 mr-2 text-amber-400" />
              Pre-order Batches (R10k Pool)
            </Button>
          </Link>
          <Link href={`${basePrefix}/commerce/orders`}>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-semibold"
            >
              <Package className="mr-2 h-4 w-4" /> View Customer Orders
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMetaSyncModal(true)}
            className="border-amber-500/40 text-amber-300 hover:text-white hover:bg-amber-500/10 font-medium"
          >
            <Share2 className="mr-2 h-4 w-4 text-amber-400" /> Meta Sync
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-stone-700 text-stone-300 hover:bg-stone-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCategoryModal(true)}
            className="border-stone-700 text-stone-300 hover:bg-stone-800"
          >
            <Tag className="mr-2 h-4 w-4" /> Add Category
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
          {statusMsg}
        </div>
      )}

      {/* Subtab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-1">
        <button
          onClick={() => setActiveSubtab('catalog')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
            activeSubtab === 'catalog'
              ? 'border-amber-500 text-amber-400 bg-stone-900/80'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <ShoppingBag className="mr-2 h-4 w-4" /> Live Catalog &amp; Inventory ({products.length})
        </button>

        <button
          onClick={() => {
            setActiveSubtab('survey_feedback');
            loadSurveyFeedback();
          }}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
            activeSubtab === 'survey_feedback'
              ? 'border-amber-500 text-amber-400 bg-stone-900/80'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <BarChart3 className="mr-2 h-4 w-4 text-amber-500" /> Survey Feedback &amp; Pricing Insights
          {surveyData?.totalResponses ? (
            <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300 font-mono">
              {surveyData.totalResponses}
            </span>
          ) : null}
        </button>
      </div>

      {activeSubtab === 'catalog' && (
        <>
          {/* Category Modal */}
          {showCategoryModal && (

        <Card className="border-stone-700 bg-stone-900 p-6 max-w-md">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-lg text-white">Create New Category</CardTitle>
          </CardHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="space-y-1">
              <Label>Category Name</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Hoodies, Tees, Caps"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={() => setShowCategoryModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 text-black">
                Save
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Add Product Modal Form */}
      {showAddModal && (
        <Card className="border-stone-700 bg-stone-900/95 p-6 border shadow-2xl">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl text-white">Add New Clothing Item</CardTitle>
            <CardDescription>
              Products added here immediately appear in the public Dissafyt Storefront.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Product Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dissafyt Heavyweight Hoodie"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Base Price (ZAR - Retail to Customer)</Label>
              <Input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="e.g. 650.00"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Category</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-200"
              >
                <option value="">Select Category (Optional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier Cost & Live Economics Card */}
            <div className="md:col-span-2 rounded-xl border border-stone-800 bg-stone-950/70 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Supplier Cost &amp; Profit Margin Economics</span>
                </div>
                <span className="text-xs text-stone-400">Unit margins, supplier procurement cost, &amp; batch returns</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-stone-300">Supplier Cost Price (ZAR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="e.g. 185.00"
                    className="bg-stone-900 border-stone-700 text-xs text-stone-100"
                  />
                  <p className="text-[10px] text-stone-400">Blank manufacturing / printing cost per unit</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-stone-300">Supplier Name</Label>
                  <Input
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Vic Bay / Amrod / Baron"
                    className="bg-stone-900 border-stone-700 text-xs text-stone-100"
                  />
                  <p className="text-[10px] text-stone-400">Wholesale apparel manufacturer</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-stone-300">Supplier Blank SKU</Label>
                  <Input
                    value={supplierSku}
                    onChange={(e) => setSupplierSku(e.target.value)}
                    placeholder="e.g. VB-HVY-300GSM-BLK"
                    className="bg-stone-900 border-stone-700 text-xs font-mono text-stone-100"
                  />
                  <p className="text-[10px] text-stone-400">Manufacturer catalog reference</p>
                </div>
              </div>

              {/* Real-time Margin Economics calculation banner */}
              {(() => {
                const metrics = getMarginMetrics(basePrice, costPrice, preorderTarget);
                if (metrics.retail <= 0 && metrics.cost <= 0) return null;
                return (
                  <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Unit Gross Profit</span>
                      <span className={`text-base font-bold font-mono ${metrics.unitGrossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        R {metrics.unitGrossProfit.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400 block">per garment</span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[11px]">Gross Margin</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          metrics.marginPct >= 60 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          metrics.marginPct >= 40 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {metrics.marginPct}%
                        </span>
                        {metrics.markupPct > 0 && (
                          <span className="text-[10px] text-stone-400 font-mono">({metrics.markupPct}% markup)</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[11px]">Batch Capital Needed</span>
                      <span className="text-base font-bold font-mono text-amber-400">
                        R {metrics.totalCapitalNeeded.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400 block">Out-of-pocket for {metrics.target} units</span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[11px]">Projected Net Profit</span>
                      <span className={`text-base font-bold font-mono ${metrics.projectedNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        R {metrics.projectedNetProfit.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400 block">Break-even at {metrics.breakEvenUnits} units</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Product Media Dropzone & Lookbook Photos */}
            <div className="md:col-span-2 rounded-xl border border-stone-800 bg-stone-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-amber-500" />
                    <span>Product Media & Lookbook ({images.length} photos)</span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Direct device upload. The first image serves as the main storefront cover.
                  </p>
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.length) {
                    await handleAddImagesUpload(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-stone-800 hover:border-amber-500/50 bg-stone-900/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={async (e) => {
                    if (e.target.files?.length) {
                      await handleAddImagesUpload(e.target.files);
                    }
                  }}
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                />
                {uploadingImages ? (
                  <div className="flex flex-col items-center justify-center space-y-2 py-2">
                    <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
                    <span className="text-xs font-semibold text-amber-300">
                      Uploading to Supabase Storage CDN...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="h-10 w-10 rounded-full bg-stone-800 flex items-center justify-center text-amber-400 mb-1">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium text-stone-200">
                      <span className="text-amber-400 underline font-semibold">Click to upload photos</span> or drag & drop files here
                    </p>
                    <p className="text-[11px] text-stone-500 font-mono">
                      JPG, PNG, WEBP, AVIF &bull; Up to 10MB per image
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Thumbnails Strip */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                  {images.map((url, idx) => (
                    <div
                      key={url + idx}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-stone-800 bg-stone-900 shadow-inner"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 rounded bg-amber-500 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-black shadow">
                          Cover
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const reordered = [url, ...images.filter((_, i) => i !== idx)];
                              setImages(reordered);
                            }}
                            className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-[9px] font-bold text-amber-300"
                            title="Set as main cover"
                          >
                            Cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImages(images.filter((_, i) => i !== idx));
                          }}
                          className="p-1 rounded-full bg-red-600/90 hover:bg-red-600 text-white"
                          title="Remove photo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual URL Input Fallback */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="Or paste external image URL..."
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="bg-stone-900 border-stone-800 text-xs h-8"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (manualUrl.trim()) {
                      setImages([...images, manualUrl.trim()]);
                      setManualUrl('');
                    }
                  }}
                  disabled={!manualUrl.trim()}
                  className="text-xs shrink-0 h-8 border-stone-700 text-stone-300 hover:text-white"
                >
                  + Add URL
                </Button>
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fabric weight, embroidery details, sizing fit..."
              />
            </div>

            {/* Pre-order Drop Controls */}
            <div className="md:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPreorder}
                  onChange={(e) => setIsPreorder(e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-500"
                />
                <span className="text-sm font-bold text-amber-400">
                  Mark as Pre-order Batch Product
                </span>
                <span className="text-xs text-stone-400">
                  (R0.00 upfront reservation &bull; Unlocks 100% full or 50% deposit link once batch filled)
                </span>
              </label>

              {isPreorder && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-500/20">
                  <div className="space-y-1">
                    <Label className="text-xs text-stone-300">Estimated Dispatch Notice</Label>
                    <Input
                      value={preorderMessage}
                      onChange={(e) => setPreorderMessage(e.target.value)}
                      placeholder="e.g. Batch 01: Ships 2–3 weeks from drop close"
                      className="bg-stone-950 border-stone-700 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-stone-300">Batch Target Units (Goal to Unlock Production)</Label>
                    <Input
                      type="number"
                      value={preorderTarget}
                      onChange={(e) => setPreorderTarget(e.target.value)}
                      placeholder="e.g. 50"
                      className="bg-stone-950 border-stone-700 text-xs"
                    />
                  </div>
                  <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between col-span-1 md:col-span-2">
                    <span className="text-[10px] text-stone-400">Master Budget Pool:</span>
                    <Link
                      href={`${basePrefix}/commerce/batches?edit=true`}
                      className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3 text-amber-400" />
                      Edit Working Capital Pool &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Colorways and Sizing Matrix Configuration */}
            <div className="md:col-span-2 rounded-xl border border-stone-800 bg-stone-950/60 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette className="h-4 w-4 text-amber-500" />
                    <span>Garment Colorways & Sizes Matrix</span>
                    {selectedColorways.length > 0 && (
                      <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                        {selectedColorways.length} Colorways &bull; {colorMatrix.length} Size Variants
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400">
                    Select streetwear colorways to generate a Colors &times; Sizes inventory matrix.
                  </p>
                </div>

                {selectedColorways.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedColorways([]);
                      setColorMatrix([]);
                    }}
                    className="text-xs text-stone-400 hover:text-white border-stone-800 h-7"
                  >
                    Clear Colors (Standard Sizes Only)
                  </Button>
                )}
              </div>

              {/* Preset Palette Chips */}
              <div className="space-y-2 pt-1 border-t border-stone-800/80">
                <div className="text-xs font-semibold text-stone-300">Choose Dissafyt Streetwear Palette:</div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORWAYS.map((preset) => {
                    const isSelected = selectedColorways.some(
                      (c) => c.name.toLowerCase() === preset.name.toLowerCase()
                    );
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => toggleAddColorway(preset)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/15 text-white shadow-sm ring-1 ring-amber-500/40'
                            : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-white/30 shadow-inner shrink-0"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.name}</span>
                        {isSelected && <Check className="h-3 w-3 text-amber-400 ml-0.5" />}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowCustomColorInput(!showCustomColorInput)}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border border-dashed border-stone-700 text-stone-300 hover:border-amber-500 hover:text-amber-400 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Custom Color</span>
                  </button>
                </div>

                {/* Custom Color Input Form */}
                {showCustomColorInput && (
                  <div className="flex items-center gap-2 pt-2 bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                    <input
                      type="color"
                      value={customColorHex}
                      onChange={(e) => setCustomColorHex(e.target.value)}
                      className="h-8 w-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <Input
                      placeholder="Colorway Name (e.g. Washed Sage Green)"
                      value={customColorName}
                      onChange={(e) => setCustomColorName(e.target.value)}
                      className="h-8 bg-stone-950 border-stone-800 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomColorway}
                      disabled={!customColorName.trim()}
                      className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold h-8"
                    >
                      Add Color
                    </Button>
                  </div>
                )}
              </div>

              {/* Matrix Breakdown when colors are active */}
              {selectedColorways.length > 0 ? (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                    <span>Stock Allocation per Colorway &amp; Size:</span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      Total Units: {colorMatrix.reduce((acc, v) => acc + (v.stock_quantity || 0), 0)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedColorways.map((cw) => {
                      const variantsForThisColor = colorMatrix.filter(
                        (v) => (v.color || '').toLowerCase() === cw.name.toLowerCase()
                      );
                      return (
                        <div
                          key={cw.name}
                          className="bg-stone-900/70 border border-stone-800 rounded-xl p-3 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-4 w-4 rounded-full border border-white/30 shrink-0"
                                style={{ backgroundColor: cw.hex }}
                              />
                              <span className="font-bold text-sm text-white">{cw.name}</span>
                            </div>

                            {/* Optional: assign photo for this colorway */}
                            {images.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-stone-400">Color photo:</span>
                                <select
                                  value={variantsForThisColor[0]?.image_url || ''}
                                  onChange={(e) => assignImageToColorway(cw.name, e.target.value)}
                                  className="rounded bg-stone-950 border border-stone-800 px-2 py-1 text-[11px] text-stone-300"
                                >
                                  <option value="">Default Cover</option>
                                  {images.map((img, i) => (
                                    <option key={img} value={img}>
                                      Photo {i + 1}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Size stock inputs */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {variantsForThisColor.map((v) => (
                              <div
                                key={v.size || v.name}
                                className="bg-stone-950 p-2 rounded-lg border border-stone-800/80"
                              >
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className="font-bold font-mono text-amber-400">Size {v.size}</span>
                                  <span className="text-[9px] text-stone-500 font-mono truncate max-w-[55px]">
                                    {v.sku}
                                  </span>
                                </div>
                                <Input
                                  type="number"
                                  min="0"
                                  value={v.stock_quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10) || 0;
                                    updateColorMatrixStock(v.color || cw.name, v.size || '', val);
                                  }}
                                  className="bg-stone-900 border-stone-700 text-xs text-center font-mono font-semibold h-7"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Fallback single-color sizing */
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-300">Single-Color Size Curve (S-2XL):</span>
                    <label className="flex items-center space-x-2 cursor-pointer text-xs text-stone-300">
                      <input
                        type="checkbox"
                        checked={useStreetwearSizes}
                        onChange={(e) => setUseStreetwearSizes(e.target.checked)}
                        className="h-3.5 w-3.5 accent-amber-500 rounded"
                      />
                      <span>Enable Multi-Size Breakdown</span>
                    </label>
                  </div>

                  {useStreetwearSizes ? (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      {DEFAULT_STREETWEAR_SIZES.map((size) => (
                        <div key={size} className="space-y-1 bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
                          <Label className="text-xs text-amber-400 font-mono font-bold">Size {size}</Label>
                          <Input
                            type="number"
                            min="0"
                            value={sizeStocks[size] ?? 10}
                            onChange={(e) =>
                              setSizeStocks({
                                ...sizeStocks,
                                [size]: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="bg-stone-950 border-stone-700 text-xs text-center font-mono font-semibold h-8"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1 pt-1">
                      <Label className="text-xs text-stone-400">Flat Inventory Quantity</Label>
                      <Input
                        type="number"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        placeholder="Initial inventory count"
                        required
                        className="bg-stone-900 border-stone-700 text-xs h-8"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-stone-800">
              <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                {submitting ? 'Creating Product...' : 'Publish Product to Shop'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit Product Right Drawer Menu */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setEditingProduct(null)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-12">
            <div className="w-screen max-w-2xl bg-stone-900 border-l border-amber-500/30 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
              {/* Drawer Sticky Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/95 backdrop-blur-sm sticky top-0 z-20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Edit Product
                    </h2>
                    <p className="text-xs text-stone-400 truncate max-w-xs sm:max-w-md">
                      {editingProduct.name}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingProduct(null)}
                  className="text-stone-400 hover:text-white hover:bg-stone-800 h-8 w-8 p-0 rounded-lg"
                  title="Close editor"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>

              {/* Form wrapping scrollable content & sticky footer */}
              <form onSubmit={handleSaveEditedProduct} className="flex flex-col flex-1 min-h-0">
                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-xs text-amber-300/90 leading-relaxed">
                      Updates to pricing, category, cost margins, and inventory are tracked in the database audit log.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Product Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Dissafyt Heavyweight Hoodie"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>URL Slug</Label>
              <Input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="e.g. dissafyt-heavyweight-hoodie"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Category</Label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>Base Price (ZAR - Retail to Customer)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editBasePrice}
                onChange={(e) => setEditBasePrice(e.target.value)}
                placeholder="e.g. 550.00"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                  <input
                    type="radio"
                    checked={editIsActive}
                    onChange={() => setEditIsActive(true)}
                    className="accent-amber-500"
                  />
                  <span>Active (Live on Store)</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                  <input
                    type="radio"
                    checked={!editIsActive}
                    onChange={() => setEditIsActive(false)}
                    className="accent-amber-500"
                  />
                  <span>Inactive (Draft / Hidden)</span>
                </label>
              </div>
            </div>

            {/* Edit Supplier Cost & Live Economics Card */}
            <div className="md:col-span-2 rounded-xl border border-stone-800 bg-stone-950/70 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Supplier Cost &amp; Profit Margin Economics</span>
                </div>
                <span className="text-xs text-stone-400">Unit margins, supplier procurement cost, &amp; batch returns</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-stone-300">Supplier Cost Price (ZAR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(e.target.value)}
                    placeholder="e.g. 185.00"
                    className="bg-stone-900 border-stone-700 text-xs text-stone-100"
                  />
                  <p className="text-[10px] text-stone-400">Blank manufacturing / printing cost per unit</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-stone-300">Supplier Name</Label>
                  <Input
                    value={editSupplierName}
                    onChange={(e) => setEditSupplierName(e.target.value)}
                    placeholder="e.g. Vic Bay / Amrod / Baron"
                    className="bg-stone-900 border-stone-700 text-xs text-stone-100"
                  />
                  <p className="text-[10px] text-stone-400">Wholesale apparel manufacturer</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-stone-300">Supplier Blank SKU</Label>
                  <Input
                    value={editSupplierSku}
                    onChange={(e) => setEditSupplierSku(e.target.value)}
                    placeholder="e.g. VB-HVY-300GSM-BLK"
                    className="bg-stone-900 border-stone-700 text-xs font-mono text-stone-100"
                  />
                  <p className="text-[10px] text-stone-400">Manufacturer catalog reference</p>
                </div>
              </div>

              {/* Real-time Margin Economics calculation banner */}
              {(() => {
                const metrics = getMarginMetrics(editBasePrice, editCostPrice, editPreorderTarget);
                if (metrics.retail <= 0 && metrics.cost <= 0) return null;
                return (
                  <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[11px]">Unit Gross Profit</span>
                      <span className={`text-base font-bold font-mono ${metrics.unitGrossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        R {metrics.unitGrossProfit.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400 block">per garment</span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[11px]">Gross Margin</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          metrics.marginPct >= 60 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          metrics.marginPct >= 40 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {metrics.marginPct}%
                        </span>
                        {metrics.markupPct > 0 && (
                          <span className="text-[10px] text-stone-400 font-mono">({metrics.markupPct}% markup)</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[11px]">Batch Capital Needed</span>
                      <span className="text-base font-bold font-mono text-amber-400">
                        R {metrics.totalCapitalNeeded.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400 block">Out-of-pocket for {metrics.target} units</span>
                    </div>

                    <div>
                      <span className="text-stone-400 block text-[11px]">Projected Net Profit</span>
                      <span className={`text-base font-bold font-mono ${metrics.projectedNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        R {metrics.projectedNetProfit.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-stone-400 block">Break-even at {metrics.breakEvenUnits} units</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Edit Product Media Dropzone & Photos */}
            <div className="md:col-span-2 rounded-xl border border-stone-800 bg-stone-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-amber-500" />
                    <span>Product Media & Lookbook ({editImages.length} photos)</span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Direct device upload. The first image serves as the main storefront cover.
                  </p>
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setEditIsDragging(true);
                }}
                onDragLeave={() => setEditIsDragging(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setEditIsDragging(false);
                  if (e.dataTransfer.files?.length) {
                    await handleEditImagesUpload(e.dataTransfer.files);
                  }
                }}
                onClick={() => editFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                  editIsDragging
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-stone-800 hover:border-amber-500/50 bg-stone-900/40'
                }`}
              >
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={async (e) => {
                    if (e.target.files?.length) {
                      await handleEditImagesUpload(e.target.files);
                    }
                  }}
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                />
                {editUploadingImages ? (
                  <div className="flex flex-col items-center justify-center space-y-2 py-2">
                    <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
                    <span className="text-xs font-semibold text-amber-300">
                      Uploading to Supabase Storage CDN...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="h-10 w-10 rounded-full bg-stone-800 flex items-center justify-center text-amber-400 mb-1">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium text-stone-200">
                      <span className="text-amber-400 underline font-semibold">Click to upload photos</span> or drag & drop files here
                    </p>
                    <p className="text-[11px] text-stone-500 font-mono">
                      JPG, PNG, WEBP, AVIF &bull; Up to 10MB per image
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Thumbnails Strip */}
              {editImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                  {editImages.map((url, idx) => (
                    <div
                      key={url + idx}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-stone-800 bg-stone-900 shadow-inner"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 rounded bg-amber-500 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-black shadow">
                          Cover
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const reordered = [url, ...editImages.filter((_, i) => i !== idx)];
                              setEditImages(reordered);
                            }}
                            className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-[9px] font-bold text-amber-300"
                            title="Set as main cover"
                          >
                            Cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditImages(editImages.filter((_, i) => i !== idx));
                          }}
                          className="p-1 rounded-full bg-red-600/90 hover:bg-red-600 text-white"
                          title="Remove photo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual URL Input Fallback */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="Or paste external image URL..."
                  value={editManualUrl}
                  onChange={(e) => setEditManualUrl(e.target.value)}
                  className="bg-stone-900 border-stone-800 text-xs h-8"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editManualUrl.trim()) {
                      setEditImages([...editImages, editManualUrl.trim()]);
                      setEditManualUrl('');
                    }
                  }}
                  disabled={!editManualUrl.trim()}
                  className="text-xs shrink-0 h-8 border-stone-700 text-stone-300 hover:text-white"
                >
                  + Add URL
                </Button>
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Description</Label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Fabric weight, embroidery details, sizing fit..."
              />
            </div>

            {/* Pre-order Drop Settings */}
            <div className="md:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsPreorder}
                  onChange={(e) => setEditIsPreorder(e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-500"
                />
                <span className="text-sm font-bold text-amber-400">
                  Mark as Pre-order Batch Product
                </span>
                <span className="text-xs text-stone-400">
                  (R0.00 upfront reservation &bull; Unlocks 100% full or 50% deposit link once batch filled)
                </span>
              </label>

              {editIsPreorder && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-amber-500/20">
                  <div className="space-y-1">
                    <Label className="text-xs text-stone-300">Estimated Dispatch Notice</Label>
                    <Input
                      value={editPreorderMessage}
                      onChange={(e) => setEditPreorderMessage(e.target.value)}
                      placeholder="e.g. Batch 01: Ships 2–3 weeks from drop close"
                      className="bg-stone-950 border-stone-700 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-stone-300">Batch Target Units (Goal)</Label>
                    <Input
                      type="number"
                      value={editPreorderTarget}
                      onChange={(e) => setEditPreorderTarget(e.target.value)}
                      placeholder="e.g. 50"
                      className="bg-stone-950 border-stone-700 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-amber-400 font-bold">Batch Production Status</Label>
                    <select
                      value={editBatchStatus}
                      onChange={(e) => setEditBatchStatus(e.target.value)}
                      className="w-full rounded-md border border-amber-500/40 bg-stone-950 px-2.5 py-2 text-xs text-amber-300 font-medium focus:outline-none"
                    >
                      <option value="accumulating">Accumulating (R0 Upfront)</option>
                      <option value="batch_filled">Batch Filled (Payment Unlocked)</option>
                      <option value="in_production">In Production / Sourcing</option>
                      <option value="completed">Completed / Dispatched</option>
                    </select>
                  </div>
                  <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between col-span-1 md:col-span-3">
                    <span className="text-[10px] text-stone-400">Master Budget Pool:</span>
                    <Link
                      href={`${basePrefix}/commerce/batches?edit=true`}
                      className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3 text-amber-400" />
                      Edit Working Capital Pool &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sizing & Colorways Configuration */}
            <div className="md:col-span-2 rounded-xl border border-stone-800 bg-stone-950/60 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette className="h-4 w-4 text-amber-500" />
                    <span>Colorways & Sizes Inventory</span>
                    <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                      {editVariants.length} Variants Configured
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Allocate blanks or target units per colorway and size.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyColorwaysMatrixToEdit}
                    disabled={editSelectedColorways.length === 0}
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs shrink-0"
                  >
                    Generate Colors &times; Sizes (S-2XL)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyStreetwearSizesToEdit}
                    className="border-stone-700 text-stone-300 hover:bg-stone-800 text-xs shrink-0"
                  >
                    Standard Sizing (S-2XL)
                  </Button>
                </div>
              </div>

              {/* Colorways Selector */}
              <div className="space-y-2 pt-1 border-t border-stone-800/80">
                <div className="text-xs font-semibold text-stone-300">Garment Colorways:</div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORWAYS.map((preset) => {
                    const isSelected = editSelectedColorways.some(
                      (c) => c.name.toLowerCase() === preset.name.toLowerCase()
                    );
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => toggleEditColorway(preset)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/15 text-white shadow-sm ring-1 ring-amber-500/40'
                            : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-white/30 shadow-inner shrink-0"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.name}</span>
                        {isSelected && <Check className="h-3 w-3 text-amber-400 ml-0.5" />}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setEditShowCustomColorInput(!editShowCustomColorInput)}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border border-dashed border-stone-700 text-stone-300 hover:border-amber-500 hover:text-amber-400 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Custom Color</span>
                  </button>
                </div>

                {/* Custom Color Input Form */}
                {editShowCustomColorInput && (
                  <div className="flex items-center gap-2 pt-2 bg-stone-900/80 p-3 rounded-xl border border-stone-800">
                    <input
                      type="color"
                      value={editCustomColorHex}
                      onChange={(e) => setEditCustomColorHex(e.target.value)}
                      className="h-8 w-8 rounded cursor-pointer bg-transparent border-0"
                    />
                    <Input
                      placeholder="Colorway Name (e.g. Vintage Charcoal)"
                      value={editCustomColorName}
                      onChange={(e) => setEditCustomColorName(e.target.value)}
                      className="h-8 bg-stone-950 border-stone-800 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (editCustomColorName.trim()) {
                          toggleEditColorway({
                            name: editCustomColorName.trim(),
                            hex: editCustomColorHex || '#222222',
                          });
                          setEditCustomColorName('');
                          setEditShowCustomColorInput(false);
                        }
                      }}
                      disabled={!editCustomColorName.trim()}
                      className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold h-8"
                    >
                      Add Color
                    </Button>
                  </div>
                )}
              </div>

              {/* Grouped variants or flat variants */}
              {editSelectedColorways.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {editSelectedColorways.map((cw) => {
                    const variantsForThisColor = editVariants
                      .map((v, originalIdx) => ({ ...v, originalIdx }))
                      .filter((v) => (v.color || '').toLowerCase() === cw.name.toLowerCase());

                    return (
                      <div
                        key={cw.name}
                        className="bg-stone-900/70 border border-stone-800 rounded-xl p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-4 w-4 rounded-full border border-white/30 shrink-0"
                              style={{ backgroundColor: cw.hex }}
                            />
                            <span className="font-bold text-sm text-white">{cw.name}</span>
                          </div>

                          {editImages.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-stone-400">Color photo:</span>
                              <select
                                value={variantsForThisColor[0]?.image_url || ''}
                                onChange={(e) => assignEditVariantImage(cw.name, e.target.value)}
                                className="rounded bg-stone-950 border border-stone-800 px-2 py-1 text-[11px] text-stone-300"
                              >
                                <option value="">Default Cover</option>
                                {editImages.map((img, i) => (
                                  <option key={img} value={img}>
                                    Photo {i + 1}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {variantsForThisColor.map((v) => (
                            <div
                              key={v.id || v.size || v.name}
                              className="bg-stone-950 p-2 rounded-lg border border-stone-800/80"
                            >
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-bold font-mono text-amber-400">
                                  Size {v.size || v.name}
                                </span>
                                {v.sku && (
                                  <span className="text-[9px] text-stone-500 font-mono truncate max-w-[55px]">
                                    {v.sku}
                                  </span>
                                )}
                              </div>
                              <Input
                                type="number"
                                min="0"
                                value={v.stock_quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  updateEditVariantStock(v.originalIdx, val);
                                }}
                                className="bg-stone-900 border-stone-700 text-xs text-center font-mono font-semibold h-7"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-stone-800">
                  {editVariants.map((v, idx) => (
                    <div
                      key={v.id || v.name || idx}
                      className="space-y-1 bg-stone-900/60 p-2.5 rounded-lg border border-stone-800"
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-amber-400 font-mono font-bold">
                          Size {v.name}
                        </Label>
                        {v.sku && (
                          <span className="text-[9px] text-stone-500 font-mono truncate max-w-[65px]">
                            {v.sku}
                          </span>
                        )}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={v.stock_quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          updateEditVariantStock(idx, val);
                        }}
                        className="bg-stone-950 border-stone-700 text-xs text-center font-mono font-semibold h-8"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="bg-stone-900/95 backdrop-blur-sm px-6 py-4 border-t border-stone-800 flex items-center justify-between z-20 shrink-0">
                  <span className="text-[11px] text-stone-500 hidden sm:inline">
                    Changes sync across the catalog and feeds.
                  </span>
                  <div className="flex items-center space-x-3 ml-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditingProduct(null)}
                      className="text-stone-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={editSubmitting}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-lg shadow-amber-500/10"
                    >
                      {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Meta Commerce & WhatsApp Catalog Sync Modal */}
      {showMetaSyncModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMetaSyncModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-amber-500/30 bg-stone-900 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Share2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Meta Commerce & WhatsApp Catalog Feed</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase font-semibold">
                      Live Sync Ready
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Automated scheduled data feed link for Facebook Shops, Instagram Shopping, and WhatsApp Product Catalog.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMetaSyncModal(false)}
                className="text-stone-400 hover:text-white p-1 h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body: Feed URL, Actions, Metrics & Setup Guide */}
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-stone-400 text-xs">
                  <span className="font-medium text-stone-300">Scheduled Data Feed URL (XML / RSS 2.0 Standard):</span>
                  <span className="font-mono text-[11px] text-amber-400">Updates dynamically on each fetch</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-amber-300 truncate select-all">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/api/catalog/meta-feed`
                      : 'https://admin.dissafyt.com/api/catalog/meta-feed'}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => copyFeedUrl('xml')}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shrink-0 flex items-center gap-1.5"
                  >
                    {copiedFeed ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Feed Link</span>
                      </>
                    )}
                  </Button>
                  <a
                    href="/api/catalog/meta-feed"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-stone-700 bg-stone-800/80 hover:bg-stone-800 text-stone-200 text-xs font-medium transition shrink-0 gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                    <span>Preview XML</span>
                  </a>
                  <a
                    href="/api/catalog/meta-feed?format=csv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-stone-700 bg-stone-800/80 hover:bg-stone-800 text-stone-200 text-xs font-medium transition shrink-0 gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                    <span>CSV Feed</span>
                  </a>
                </div>
              </div>

              {/* Quick Stats Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-800/60 font-mono text-[11px] text-stone-400">
                <div className="bg-stone-950/60 border border-stone-800/80 rounded-lg p-2.5">
                  <span className="text-stone-500 block">Active Products Synced:</span>
                  <span className="text-white font-bold text-sm">{products.filter((p) => p.is_active).length} Products</span>
                </div>
                <div className="bg-stone-950/60 border border-stone-800/80 rounded-lg p-2.5">
                  <span className="text-stone-500 block">Catalog Currency:</span>
                  <span className="text-emerald-400 font-bold text-sm">ZAR (South African Rand)</span>
                </div>
                <div className="bg-stone-950/60 border border-stone-800/80 rounded-lg p-2.5">
                  <span className="text-stone-500 block">Supported Channels:</span>
                  <span className="text-amber-400 font-bold text-sm">WhatsApp • IG • FB Shop</span>
                </div>
              </div>

              {/* Setup Guide Accordion / Toggle */}
              <div className="pt-2">
                <div className="flex items-center justify-between pb-2">
                  <span className="font-semibold text-stone-300">Integration Instructions:</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowFeedGuide(!showFeedGuide)}
                    className="text-stone-400 hover:text-white text-xs h-7 px-2 flex items-center gap-1"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                    <span>{showFeedGuide ? 'Hide Instructions' : 'View Instructions'}</span>
                  </Button>
                </div>

                {showFeedGuide && (
                  <div className="border border-stone-800 bg-stone-950/60 p-4 rounded-xl space-y-2 text-stone-300">
                    <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <span>Connecting to Meta Commerce Manager (Step-by-Step):</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-stone-400 text-xs leading-relaxed">
                      <li>
                        Open <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">Meta Commerce Manager</a> and select your Dissafyt catalog.
                      </li>
                      <li>
                        In the left navigation, go to <strong className="text-white">Catalog</strong> &rarr; <strong className="text-white">Data Sources</strong> &rarr; click <strong className="text-white">Add Items</strong>.
                      </li>
                      <li>
                        Select <strong className="text-white">Data Feed</strong> &rarr; <strong className="text-white">Set a schedule</strong>.
                      </li>
                      <li>
                        Paste the <strong className="text-amber-400 font-mono">Scheduled Data Feed URL</strong> above into the feed URL field.
                      </li>
                      <li>
                        Set the schedule to <strong className="text-white">Hourly</strong> or <strong className="text-white">Daily</strong>, and confirm the default currency is <strong className="text-white">ZAR</strong>.
                      </li>
                      <li>
                        Click <strong className="text-white">Save and Upload</strong>. Meta will fetch all products, prices, images, and live inventory directly from your database!
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetaSyncModal(false)}
                className="border-stone-700 text-stone-300 hover:bg-stone-800"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Products Table */}
      <Card className="border-stone-800 bg-stone-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Live Catalog ({products.length})</CardTitle>
          <CardDescription>
            All clothing and commerce items stored in Dissafyt Cloud Ledger.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-stone-500">Loading catalog...</div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-stone-500 space-y-3">
              <Layers className="mx-auto h-8 w-8 text-stone-600" />
              <p>No products found in the catalog yet.</p>
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="bg-amber-500 text-black"
              >
                Add Your First Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-300">
                <thead className="border-b border-stone-800 text-xs uppercase text-stone-500">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Pricing &amp; Margin</th>
                    <th className="py-3 px-4">Stock &amp; Batch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {products.map((product) => {
                    const totalStock = product.variants?.reduce(
                      (acc, v) => acc + (v.stock_quantity || 0),
                      0
                    );
                    return (
                      <tr key={product.id} className="hover:bg-stone-800/40">
                        <td className="py-3 px-4 font-medium text-white">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-stone-900 border border-stone-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {product.images && product.images.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ShoppingBag className="h-5 w-5 text-stone-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span>{product.name}</span>
                                {product.is_preorder && (
                                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/40">
                                    Pre-order
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-stone-500 font-mono">{product.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-stone-400">
                          {product.category_name || 'Uncategorized'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-amber-400">
                            R {Number(product.base_price).toFixed(2)}
                          </div>
                          <div className="text-[11px] text-stone-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {product.cost_price != null ? (
                              <>
                                <span>Cost: R{Number(product.cost_price).toFixed(2)}</span>
                                {product.base_price > 0 && (() => {
                                  const margin = Math.round(((product.base_price - product.cost_price) / product.base_price) * 100);
                                  return (
                                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                      margin >= 60 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                                      margin >= 40 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                                      'bg-red-500/15 text-red-400 border border-red-500/30'
                                    }`}>
                                      {margin}% margin
                                    </span>
                                  );
                                })()}
                              </>
                            ) : (
                              <span className="text-stone-500">Cost: —</span>
                            )}
                          </div>
                          {product.supplier_name && (
                            <div className="text-[10px] text-stone-500 font-mono truncate max-w-[120px]">
                              {product.supplier_name}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                                product.is_preorder
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : totalStock > 0
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}
                            >
                              {product.is_preorder
                                ? `Drop: ${product.preorder_claimed_count || 0}/${product.preorder_target || 50} Claimed`
                                : `${totalStock} in stock`}
                            </span>

                            {product.is_preorder && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openBatchModal(product)}
                                className="h-6 px-2 text-[10px] border-amber-500/40 text-amber-300 hover:bg-amber-500/15 font-semibold"
                                title="Open batch sizing matrix and customer reservation list"
                              >
                                <Package className="mr-1 h-3 w-3" /> Batch Orders
                              </Button>
                            )}
                          </div>

                          {product.is_preorder && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                                product.batch_status === 'batch_filled'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : product.batch_status === 'in_production'
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                  : product.batch_status === 'completed'
                                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {product.batch_status === 'batch_filled'
                                  ? 'Target Reached 🎉'
                                  : product.batch_status === 'in_production'
                                  ? 'In Production 🧵'
                                  : product.batch_status === 'completed'
                                  ? 'Dispatched / Done'
                                  : 'Accumulating'}
                              </span>
                            </div>
                          )}

                          {/* Colorway badges */}
                          {(() => {
                            const colors = Array.from(
                              new Set((product.variants || []).map((v) => v.color).filter(Boolean))
                            ) as string[];
                            if (colors.length > 0) {
                              return (
                                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                  {colors.map((c) => {
                                    const matchingVar = product.variants?.find((v) => v.color === c);
                                    return (
                                      <span
                                        key={c}
                                        className="inline-flex items-center gap-1 rounded bg-stone-950 px-1.5 py-0.5 text-[10px] font-mono text-stone-300 border border-stone-800"
                                      >
                                        {matchingVar?.color_hex && (
                                          <span
                                            className="h-2 w-2 rounded-full border border-white/20"
                                            style={{ backgroundColor: matchingVar.color_hex }}
                                          />
                                        )}
                                        <span>{c}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {product.variants && product.variants.length > 1 && (
                            <div className="flex flex-wrap gap-1 mt-1 text-[10px] font-mono text-stone-400">
                              {product.variants.map((v) => (
                                <span key={v.id || v.name} className="bg-stone-950 px-1.5 py-0.5 rounded border border-stone-800">
                                  {v.name}: {v.stock_quantity}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleProductStatus(product)}
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              product.is_active
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-stone-800 text-stone-500'
                            }`}
                          >
                            {product.is_active ? (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" /> Active
                              </>
                            ) : (
                              <>
                                <XCircle className="mr-1 h-3 w-3" /> Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {product.is_preorder && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openBatchModal(product)}
                              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                              title="Manage Batch Orders & Sizing Matrix"
                            >
                              <Layers className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(product)}
                            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                            title="Edit Product Details"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Orders & Supplier Sizing Drawer / Modal */}
      {selectedBatchProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-amber-500/40 bg-stone-900 shadow-2xl p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-stone-950 border border-stone-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {selectedBatchProduct.images && selectedBatchProduct.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedBatchProduct.images[0]}
                      alt={selectedBatchProduct.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-6 w-6 text-stone-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedBatchProduct.name}</h2>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-400 border border-amber-500/40">
                      Batch Management
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-mono mt-0.5">
                    Supplier: {selectedBatchProduct.supplier_name || 'Unspecified'} &bull; SKU: {selectedBatchProduct.supplier_sku || 'N/A'} &bull; Retail: R {Number(selectedBatchProduct.base_price).toFixed(2)} &bull; Cost: R {Number(selectedBatchProduct.cost_price || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBatchProduct(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {batchLoading ? (
              <div className="py-16 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                <span>Aggregating customer pre-orders and sizing matrix...</span>
              </div>
            ) : batchData ? (
              <>
                {batchNotifyMsg && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center justify-between">
                    <span>{batchNotifyMsg}</span>
                    <button onClick={() => setBatchNotifyMsg(null)} className="text-stone-400 hover:text-white ml-2">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Batch Progress & Capital Economics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-950 p-4 rounded-xl border border-stone-800 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[11px]">Batch Progress</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-bold font-mono text-amber-400">
                        {batchData.totalUnits}
                      </span>
                      <span className="text-stone-500 font-mono">/ {batchData.target} units</span>
                    </div>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.round((batchData.totalUnits / (batchData.target || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[11px]">Out-of-Pocket Production Capital</span>
                    <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                      R {((Number(selectedBatchProduct.cost_price || 0)) * batchData.totalUnits).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      R {Number(selectedBatchProduct.cost_price || 0).toFixed(2)} &times; {batchData.totalUnits} units
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[11px]">Total Customer Commitment</span>
                    <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">
                      R {batchData.totalCommittedValue.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-stone-500">Across {batchData.orders.length} reserved order(s)</span>
                  </div>

                  <div>
                    <span className="text-stone-400 block text-[11px]">Projected Net Margin</span>
                    <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
                      R {(batchData.totalCommittedValue - ((Number(selectedBatchProduct.cost_price || 0)) * batchData.totalUnits)).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-stone-500">After 100% production cost recovery</span>
                  </div>
                </div>

                {/* Sizing Matrix for Procurement */}
                <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Package className="h-4 w-4 text-amber-400" />
                        <span>Supplier Blank Procurement Breakdown</span>
                      </h3>
                      <p className="text-xs text-stone-400">
                        Exact counts to send your wholesale blank distributor.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={copySupplierSizing}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs h-8"
                    >
                      {copiedSizing ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5" /> Copied Sizing Order!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Sizing for Supplier
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                    {Object.keys(batchData.sizeBreakdown).length === 0 ? (
                      <div className="col-span-6 text-center text-xs text-stone-500 py-3">
                        No pre-orders recorded yet.
                      </div>
                    ) : (
                      Object.entries(batchData.sizeBreakdown).map(([size, count]) => (
                        <div key={size} className="bg-stone-900 border border-stone-800 rounded-lg p-2.5 text-center">
                          <span className="text-xs font-mono font-bold text-amber-400 block">Size {size}</span>
                          <span className="text-lg font-bold font-mono text-white mt-0.5 block">{count}</span>
                          <span className="text-[10px] text-stone-500 font-mono">blanks</span>
                        </div>
                      ))
                    )}
                  </div>

                  {Object.keys(batchData.colorBreakdown).length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800/60 text-xs">
                      <span className="text-stone-400 font-mono text-[11px]">Color totals:</span>
                      {Object.entries(batchData.colorBreakdown).map(([color, count]) => (
                        <span key={color} className="rounded bg-stone-900 px-2 py-0.5 font-mono text-stone-200 border border-stone-800">
                          {color}: <strong className="text-amber-400">{count}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Batch Notification Action Strip */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Send className="h-4 w-4 text-amber-400" />
                      <span>Batch Settlement &amp; Payment Dispatch</span>
                    </h4>
                    <p className="text-xs text-stone-300 mt-0.5">
                      Notify customers via email with their personal link to pay either 100% full amount or 50% deposit before production.
                    </p>
                  </div>

                  <Button
                    onClick={handleNotifyBatchCustomers}
                    disabled={batchNotifying || batchData.orders.length === 0}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shrink-0"
                  >
                    {batchNotifying ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Dispatching Emails...
                      </>
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Notify {batchData.orders.length} Batch Customers
                      </>
                    )}
                  </Button>
                </div>

                {/* Customer Orders Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      Customer Pre-order Reservations ({batchData.orders.length})
                    </h3>
                    <span className="text-xs text-stone-400">
                      Direct WhatsApp message links &bull; No Meta automation required
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-stone-800">
                    <table className="w-full text-left text-xs text-stone-300">
                      <thead className="bg-stone-950/80 text-[11px] uppercase text-stone-400 border-b border-stone-800">
                        <tr>
                          <th className="py-2.5 px-3">Order</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Items &amp; Sizes</th>
                          <th className="py-2.5 px-3">Total / Balance</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Outreach</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800 bg-stone-900/40 font-mono">
                        {batchData.orders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-stone-500 font-sans">
                              No pre-orders placed yet.
                            </td>
                          </tr>
                        ) : (
                          batchData.orders.map((order: any) => (
                            <tr key={order.id} className="hover:bg-stone-800/50">
                              <td className="py-2.5 px-3 font-bold text-amber-400">
                                {order.order_number}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-sans font-medium text-white text-xs">
                                  {order.customer_name || 'Customer'}
                                </div>
                                <div className="text-[11px] text-stone-400 font-mono">
                                  {order.customer_email || '—'}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-stone-300">
                                {order.items?.map((it: any, i: number) => (
                                  <div key={i} className="text-[11px]">
                                    {it.quantity}x {it.product_name || 'Item'}
                                  </div>
                                ))}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="text-white font-bold">
                                  R {Number(order.total_price || 0).toFixed(2)}
                                </div>
                                <div className="text-[10px] text-stone-400">
                                  Bal: R {Number(order.balance_due || order.total_price || 0).toFixed(2)}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider ${
                                  order.status === 'paid' || order.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : order.status === 'batch_payment_requested'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : order.status === 'deposit_paid'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-stone-800 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {order.status === 'preorder_reserved' ? 'Reserved (R0)' : order.status}
                                </span>
                                {order.batch_notified_at && (
                                  <div className="text-[9px] text-stone-500 mt-0.5 font-sans">
                                    Notified: {new Date(order.batch_notified_at).toLocaleDateString()}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right space-x-1.5 font-sans">
                                {order.whatsappLink && (
                                  <a
                                    href={order.whatsappLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors shadow-sm"
                                    title="Open WhatsApp chat with prefilled payment link"
                                  >
                                    <Phone className="h-3 w-3" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}
                                {order.paymentUrl && (
                                  <button
                                    type="button"
                                    onClick={() => copyOrderPaymentLink(order.order_number, order.paymentUrl)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] transition-colors border border-stone-700"
                                    title="Copy customer payment link"
                                  >
                                    {copiedLinkOrderId === order.order_number ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-400" />
                                        <span>Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        <span>Link</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </Card>
        </div>
      )}
        </>
      )}

      {/* Subtab 2: Survey Feedback & Pricing Insights */}
      {activeSubtab === 'survey_feedback' && (
        <div className="space-y-6">
          {surveyActionMsg && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{surveyActionMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSurveyActionMsg(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Historical Run Banner (when viewing archived/completed runs) */}
          {surveyData?.selectedRun && surveyData.selectedRun.status !== 'active' && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <History className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-white uppercase tracking-wider text-[11px] block sm:inline mr-2">
                    Viewing Historical Run:
                  </span>
                  <span className="font-semibold text-amber-200">"{surveyData.selectedRun.title}"</span>
                  <span className="text-stone-400 text-[11px] ml-2 font-mono">
                    ({surveyData.selectedRun.status.toUpperCase()} &bull; Created {new Date(surveyData.selectedRun.created_at).toLocaleDateString()} &bull; {surveyData.totalResponses} respondents)
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (surveyData.activeRun) {
                    loadSurveyFeedback(surveyData.activeRun.id);
                  } else {
                    loadSurveyFeedback();
                  }
                }}
                className="border-amber-500/40 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 text-xs shrink-0 font-semibold"
              >
                Return to Live Active Run
              </Button>
            </div>
          )}

          {/* Survey Feedback Header & Quick Actions */}
          <Card className="border-amber-500/20 bg-stone-900/60 shadow-xl">
            <CardHeader className="border-b border-stone-800/60 pb-4">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white flex items-center gap-2 flex-wrap">
                      <span>Pricing Survey Feedback &amp; Demand Elasticity</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase font-semibold">
                        Blind Interval Engine (50% &bull; 75% &bull; 100%)
                      </span>
                      {surveyData?.selectedRun && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold border ${
                          surveyData.selectedRun.status === 'active'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-stone-800 border-stone-700 text-stone-300'
                        }`}>
                          Run: {surveyData.selectedRun.title}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-stone-400 mt-1">
                      Prospect responses test price sensitivity without revealing profit margin tiers. Review community votes and apply sweet-spot pricing before launching.
                    </CardDescription>
                  </div>
                </div>

                {/* Workflow Toolbar: Run switcher, product selection modal, new run, refresh, links */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Documented Run Switcher */}
                  <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1">
                    <History className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">Run:</span>
                    <select
                      value={selectedRunId || surveyData?.selectedRun?.id || surveyData?.activeRun?.id || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedRunId(val);
                        loadSurveyFeedback(val);
                      }}
                      className="bg-transparent text-xs text-stone-200 font-medium focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
                    >
                      {(surveyData?.runs || []).map((r) => (
                        <option key={r.id} value={r.id} className="bg-stone-900 text-stone-200">
                          {r.status === 'active' ? '🟢 LIVE: ' : r.status === 'completed' ? '🏁 COMPLETED (LOCKED): ' : '📜 ARCHIVED: '}
                          {r.title} ({r.totalResponses || 0} votes)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Action Button for Selected Run */}
                  {(() => {
                    const currentRun = surveyData?.selectedRun || surveyData?.activeRun;
                    if (!currentRun) return null;
                    if (currentRun.status === 'active') {
                      return (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteSurveyRun(currentRun.id)}
                          disabled={surveyLoading}
                          className="border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs font-semibold"
                          title="Mark this run as complete, permanently lock it as immutable, and deactivate the public survey storefront"
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-red-400" />
                          <span>Complete Run (Lock &amp; Deactivate)</span>
                        </Button>
                      );
                    } else if (currentRun.status === 'completed' || currentRun.status === 'archived') {
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-950 border border-amber-500/30 text-amber-300 font-mono">
                          <Lock className="h-3.5 w-3.5 text-amber-400" />
                          <span>Completed &bull; Immutable</span>
                        </span>
                      );
                    }
                    return null;
                  })()}

                  {/* Configure Products for Survey Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openProductSelectionModal}
                    className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold"
                    title="Select and deselect products featured in this survey run"
                  >
                    <Sliders className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                    <span>Select Products ({surveyData?.selectedRun?.product_ids?.length ?? surveyData?.activeRun?.product_ids?.length ?? products.filter(p => p.is_active).length}/{products.length})</span>
                  </Button>

                  {/* Start New Survey Run Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedProductIds(
                        surveyData?.selectedRun?.product_ids ||
                        surveyData?.activeRun?.product_ids ||
                        products.filter((p) => p.is_active).map((p) => p.id)
                      );
                      setNewRunTitle(`Run #${(surveyData?.runs?.length || 0) + 1}: Catalog Drop Survey (${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`);
                      setNewRunDescription('');
                      setShowNewRunModal(true);
                    }}
                    className="border-stone-700 bg-stone-800 text-stone-200 hover:text-white hover:bg-stone-700 text-xs font-semibold"
                    title="Start a new documented survey run to reset feedback for newly selected products"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5 text-stone-300" />
                    <span>New Run...</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadSurveyFeedback(selectedRunId || undefined)}
                    disabled={surveyLoading}
                    className="border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 text-xs"
                    title="Refresh survey feedback and votes"
                  >
                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${surveyLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      const url = getStorefrontSurveyUrl();
                      navigator.clipboard.writeText(url);
                      setCopiedSurveyUrl(true);
                      setTimeout(() => setCopiedSurveyUrl(false), 2000);
                    }}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold"
                  >
                    {copiedSurveyUrl ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </Button>

                  <a
                    href={getStorefrontSurveyUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-sm"
                  >
                    <span>Open Form</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {/* KPI Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3">
                  <span className="text-stone-500 block text-[11px]">Run Submissions:</span>
                  <span className="text-white font-bold text-lg">{surveyData?.totalResponses || 0}</span>
                </div>
                <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3">
                  <span className="text-stone-500 block text-[11px]">Total Item Votes:</span>
                  <span className="text-amber-400 font-bold text-lg">{surveyData?.totalVotesCast || 0}</span>
                </div>
                <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3">
                  <span className="text-stone-500 block text-[11px]">Public Survey Status:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {surveyData?.activeRun ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live &amp; Accepting Votes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        Deactivated / Closed
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-400 font-sans mt-1 truncate">
                    {surveyData?.selectedRun ? `Viewing: ${surveyData.selectedRun.title}` : 'No run selected'}
                  </div>
                </div>
                <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-3">
                  <span className="text-stone-500 block text-[11px]">Surveyed Garments:</span>
                  <span className="text-stone-300 font-bold text-sm">
                    {surveyData?.productInsights.length || 0} Selected ({products.length} in Catalog)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product-by-Product Insights */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Product Elasticity &amp; Sweet-Spot Pricing</span>
              <span className="text-xs font-mono text-stone-500">
                ({surveyData?.productInsights.length || 0} Products)
              </span>
            </h3>

            {surveyLoading ? (
              <div className="py-12 text-center text-stone-500 font-mono text-xs">
                Loading pricing insights &amp; votes...
              </div>
            ) : !surveyData || surveyData.productInsights.length === 0 ? (
              <Card className="border-stone-800 bg-stone-900/40 p-8 text-center text-stone-500">
                No survey feedback recorded yet. Share the survey link with prospects to collect data.
              </Card>
            ) : (
              <Card className="border-stone-800 bg-stone-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-800 bg-stone-950/60 text-[11px] font-mono text-stone-400 uppercase">
                      <tr>
                        <th className="py-3 px-4 min-w-[280px]">Product &amp; Economics</th>
                        <th className="py-3 px-3 text-center min-w-[140px]">
                          <div>Tier 1 (50% Margin)</div>
                        </th>
                        <th className="py-3 px-3 text-center min-w-[140px]">
                          <div>Tier 2 (75% Margin)</div>
                        </th>
                        <th className="py-3 px-3 text-center min-w-[140px]">
                          <div>Tier 3 (100% Margin)</div>
                        </th>
                        <th className="py-3 px-4 text-right min-w-[150px]">Optimal &amp; Sync</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60">
                      {surveyData.productInsights.map((insight) => {
                        const p = insight.product;
                        const isApplying = applyingPriceProductId === p.id;
                        const currentPrice = Number(p.base_price);
                        const isAtOptimal = Math.round(currentPrice) === Math.round(insight.optimalPrice);

                        return (
                          <tr key={p.id} className="hover:bg-stone-800/30 transition-colors">
                            {/* Product Info */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex items-start space-x-3">
                                <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-stone-950 border border-stone-800 shrink-0 mt-0.5">
                                  {p.images && p.images[0] ? (
                                    <img
                                      src={p.images[0]}
                                      alt={p.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-stone-700 text-[9px] font-mono">
                                      NO IMG
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] font-mono text-stone-400">
                                    <span>Catalog: <strong className="text-white">R {currentPrice.toFixed(0)}</strong></span>
                                    <span>&bull;</span>
                                    <span>Cost: <strong className="text-amber-400">R {(Number(p.cost_price) || insight.tiers.cost).toFixed(0)}</strong></span>
                                    <span>&bull;</span>
                                    <span className="text-stone-300 font-bold">{insight.totalVotes} votes</span>
                                  </div>
                                  <div className="flex items-start gap-1.5 mt-1 text-[11px] text-stone-300 max-w-sm">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <span className="leading-snug">{insight.recommendationReason}</span>
                                  </div>
                                  {insight.tierCounts.not_interested > 0 && (
                                    <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                                      * {insight.tierCounts.not_interested} flagged above budget ({insight.tierPercentages.not_interested}%)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Tier 1 (50%) */}
                            <td className={`py-3.5 px-3 align-top text-center ${insight.optimalTier === 'tier_50' ? 'bg-amber-500/5' : ''}`}>
                              <div className="space-y-1">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-base font-black text-white font-mono">
                                    {insight.tiers.tiers[0].customerDisplay}
                                  </span>
                                  {insight.optimalTier === 'tier_50' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-black font-mono">
                                      BEST
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-stone-400 font-mono">
                                  +{insight.tiers.tiers[0].unitProfit.toFixed(0)} / garment
                                </div>
                                <div className="mt-1 space-y-0.5 max-w-[110px] mx-auto">
                                  <div className="flex justify-between text-[10px] font-mono text-stone-400">
                                    <span>{insight.tierCounts.tier_50}v</span>
                                    <span className="text-white font-bold">{insight.tierPercentages.tier_50}%</span>
                                  </div>
                                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-amber-500 h-full rounded-full"
                                      style={{ width: `${insight.tierPercentages.tier_50}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="text-[10px] font-mono text-stone-500 pt-0.5">
                                  Net R {insight.projectedProfitPerBatch.tier_50.toLocaleString()}
                                </div>
                              </div>
                            </td>

                            {/* Tier 2 (75%) */}
                            <td className={`py-3.5 px-3 align-top text-center ${insight.optimalTier === 'tier_75' ? 'bg-amber-500/5' : ''}`}>
                              <div className="space-y-1">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-base font-black text-white font-mono">
                                    {insight.tiers.tiers[1].customerDisplay}
                                  </span>
                                  {insight.optimalTier === 'tier_75' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-black font-mono">
                                      BEST
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-stone-400 font-mono">
                                  +{insight.tiers.tiers[1].unitProfit.toFixed(0)} / garment
                                </div>
                                <div className="mt-1 space-y-0.5 max-w-[110px] mx-auto">
                                  <div className="flex justify-between text-[10px] font-mono text-stone-400">
                                    <span>{insight.tierCounts.tier_75}v</span>
                                    <span className="text-white font-bold">{insight.tierPercentages.tier_75}%</span>
                                  </div>
                                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-amber-500 h-full rounded-full"
                                      style={{ width: `${insight.tierPercentages.tier_75}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="text-[10px] font-mono text-stone-500 pt-0.5">
                                  Net R {insight.projectedProfitPerBatch.tier_75.toLocaleString()}
                                </div>
                              </div>
                            </td>

                            {/* Tier 3 (100%) */}
                            <td className={`py-3.5 px-3 align-top text-center ${insight.optimalTier === 'tier_100' ? 'bg-amber-500/5' : ''}`}>
                              <div className="space-y-1">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-base font-black text-white font-mono">
                                    {insight.tiers.tiers[2].customerDisplay}
                                  </span>
                                  {insight.optimalTier === 'tier_100' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-black font-mono">
                                      BEST
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-stone-400 font-mono">
                                  +{insight.tiers.tiers[2].unitProfit.toFixed(0)} / garment
                                </div>
                                <div className="mt-1 space-y-0.5 max-w-[110px] mx-auto">
                                  <div className="flex justify-between text-[10px] font-mono text-stone-400">
                                    <span>{insight.tierCounts.tier_100}v</span>
                                    <span className="text-white font-bold">{insight.tierPercentages.tier_100}%</span>
                                  </div>
                                  <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-amber-500 h-full rounded-full"
                                      style={{ width: `${insight.tierPercentages.tier_100}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="text-[10px] font-mono text-stone-500 pt-0.5">
                                  Net R {insight.projectedProfitPerBatch.tier_100.toLocaleString()}
                                </div>
                              </div>
                            </td>

                            {/* Optimal Price & Apply to Catalog Button */}
                            <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                              <div className="flex flex-col items-end gap-1.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-mono text-stone-400">Optimal:</span>
                                  <span className="text-xs font-black text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                                    R {insight.optimalPrice.toFixed(0)}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  disabled={isApplying || isAtOptimal}
                                  onClick={() => handleApplySurveyPrice(p.id, insight.optimalPrice)}
                                  className={`h-7 px-2.5 text-[11px] font-bold ${
                                    isAtOptimal
                                      ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                                      : 'bg-amber-500 hover:bg-amber-400 text-black shadow-sm'
                                  }`}
                                >
                                  {isApplying ? (
                                    'Applying...'
                                  ) : isAtOptimal ? (
                                    'Catalog Matched'
                                  ) : (
                                    `Apply R ${insight.optimalPrice.toFixed(0)}`
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* Recent Submissions Feed */}
          <Card className="border-stone-800 bg-stone-900/50">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center justify-between">
                <span>Recent Survey Submissions</span>
                <span className="text-xs font-mono text-stone-400 font-normal">
                  {surveyData?.recentSubmissions.length || 0} Submissions
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-stone-400">
                Prospect contacts, their selected price votes, and comments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!surveyData || surveyData.recentSubmissions.length === 0 ? (
                <div className="py-8 text-center text-stone-500 text-xs">
                  No submissions recorded yet. Share the survey form link with prospects.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-800 text-[11px] font-mono text-stone-400 uppercase">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Prospect</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Votes Cast</th>
                        <th className="py-3 px-4">Comments / Wishlist</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 font-mono">
                      {surveyData.recentSubmissions.map((sub) => {
                        const dateStr = new Date(sub.created_at).toLocaleDateString('en-ZA', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        const cleanPhone = sub.respondent_phone
                          ? sub.respondent_phone.replace(/[^0-9]/g, '')
                          : '';
                        const waPhone = cleanPhone.startsWith('0')
                          ? '27' + cleanPhone.slice(1)
                          : cleanPhone;

                        return (
                          <tr key={sub.id} className="hover:bg-stone-800/30">
                            <td className="py-3 px-4 text-stone-400 whitespace-nowrap">{dateStr}</td>
                            <td className="py-3 px-4 text-white font-sans font-medium">
                              {sub.respondent_name || 'Anonymous Prospect'}
                            </td>
                            <td className="py-3 px-4 text-stone-300">
                              <div>{sub.respondent_email || '—'}</div>
                              {sub.respondent_phone && (
                                <div className="text-[11px] text-stone-500">{sub.respondent_phone}</div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {(sub.votes || []).map((v) => (
                                  <span
                                    key={v.id}
                                    className="px-1.5 py-0.5 rounded text-[10px] bg-stone-800 text-amber-300 border border-stone-700"
                                  >
                                    {v.selected_price > 0 ? `R ${v.selected_price}` : 'Budget'}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-stone-400 font-sans max-w-xs truncate">
                              {sub.general_feedback || '—'}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {waPhone ? (
                                <a
                                  href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                                    `Hi ${sub.respondent_name || 'there'}! Thank you for voting in the Dissafyt pricing survey. Here is your VIP drop link:`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-sans hover:bg-emerald-600/30"
                                >
                                  <Phone className="h-3 w-3" /> WhatsApp
                                </a>
                              ) : (
                                <span className="text-stone-600 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documented Survey Runs History */}
          <Card className="border-stone-800 bg-stone-900/50">
            <CardHeader className="border-b border-stone-800/60 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <History className="h-4 w-4 text-amber-400" />
                    <span>Documented Survey Runs History</span>
                    <span className="text-xs font-mono text-stone-400 font-normal">
                      ({surveyData?.runs?.length || 0} Runs Documented)
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs text-stone-400 mt-0.5">
                    Audit trail of all pricing survey iterations, selected catalog garments, and community elasticity metrics.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedProductIds(
                      surveyData?.selectedRun?.product_ids ||
                      surveyData?.activeRun?.product_ids ||
                      products.filter((p) => p.is_active).map((p) => p.id)
                    );
                    setNewRunTitle(`Run #${(surveyData?.runs?.length || 0) + 1}: Catalog Drop Survey (${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`);
                    setNewRunDescription('');
                    setShowNewRunModal(true);
                  }}
                  className="border-stone-700 bg-stone-800 text-stone-200 hover:text-white hover:bg-stone-700 text-xs font-semibold"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-stone-300" />
                  <span>Start New Run</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {!surveyData || !surveyData.runs || surveyData.runs.length === 0 ? (
                <div className="py-8 text-center text-stone-500 text-xs">
                  No survey runs recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-stone-800 text-[11px] font-mono text-stone-400 uppercase bg-stone-950/60">
                      <tr>
                        <th className="py-3 px-4">Run Title &amp; Description</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Created / Archived</th>
                        <th className="py-3 px-3">Included Garments</th>
                        <th className="py-3 px-3 text-center">Submissions / Votes</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 font-mono">
                      {surveyData.runs.map((run) => {
                        const isCurrentSelected = (selectedRunId || surveyData.selectedRun?.id) === run.id;
                        const isLiveActive = run.status === 'active';
                        const createdStr = new Date(run.created_at).toLocaleDateString('en-ZA', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });

                        return (
                          <tr
                            key={run.id}
                            className={`hover:bg-stone-800/30 transition-colors ${
                              isCurrentSelected ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <td className="py-3.5 px-4 font-sans">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{run.title}</span>
                                {isCurrentSelected && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono">
                                    Current View
                                  </span>
                                )}
                              </div>
                              {run.description && (
                                <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                                  {run.description}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                  isLiveActive
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : run.status === 'completed'
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                    : 'bg-stone-800 text-stone-400 border-stone-700'
                                }`}
                              >
                                {isLiveActive ? (
                                  <>
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Live Active
                                  </>
                                ) : run.status === 'completed' ? (
                                  <>
                                    <Lock className="h-2.5 w-2.5 text-amber-400" />
                                    Completed (Locked)
                                  </>
                                ) : (
                                  run.status
                                )}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-stone-400 text-[11px]">
                              <div>{createdStr}</div>
                              {run.completed_at && (
                                <div className="text-[10px] text-stone-500">
                                  Ended: {new Date(run.completed_at).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="flex flex-wrap gap-1 max-w-xs font-sans">
                                {run.products && run.products.length > 0 ? (
                                  run.products.map((p) => (
                                    <span
                                      key={p.id}
                                      className="px-1.5 py-0.5 rounded text-[10px] bg-stone-800 text-stone-300 border border-stone-700"
                                    >
                                      {p.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-stone-400 font-mono">
                                    {run.product_ids?.length || 0} products
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <div className="font-bold text-white text-xs">
                                {run.totalResponses || 0} submissions
                              </div>
                              <div className="text-[10px] text-amber-400">
                                {run.totalVotesCast || 0} item votes
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5 font-sans whitespace-nowrap">
                              {run.status === 'active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCompleteSurveyRun(run.id)}
                                  className="text-xs h-7 px-2 border-red-500/30 text-red-300 hover:bg-red-500/20"
                                  title="Complete this run, permanently lock it as immutable, and deactivate public survey"
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3 text-red-400" />
                                  Complete &amp; Lock
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedProductIds(run.product_ids || []);
                                    setNewRunTitle(`Run #${(surveyData?.runs?.length || 0) + 1}: Based on ${run.title}`);
                                    setNewRunDescription('');
                                    setShowNewRunModal(true);
                                  }}
                                  className="text-xs h-7 px-2 border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800"
                                  title="Start a new documented survey run using garments from this completed run"
                                >
                                  <Plus className="mr-1 h-3 w-3 text-amber-400" />
                                  Branch New Run
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRunId(run.id);
                                  loadSurveyFeedback(run.id);
                                  window.scrollTo({ top: 300, behavior: 'smooth' });
                                }}
                                className={`text-xs h-7 px-2.5 ${
                                  isCurrentSelected
                                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                                    : 'border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800'
                                }`}
                              >
                                {isCurrentSelected ? 'Viewing' : 'View Data'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configure Survey Products Modal (Select / Deselect Products) */}
          {showProductSelectionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-amber-500/40 bg-stone-900 shadow-2xl">
                <CardHeader className="border-b border-stone-800 pb-3 flex-shrink-0">
                  <div className="flex items-start justify-between">
                  {(() => {
                    const modalRun = surveyData?.selectedRun || surveyData?.activeRun;
                    const isModalRunImmutable = modalRun?.status === 'completed' || modalRun?.status === 'archived';
                    return (
                      <div>
                        <div className="flex items-center gap-2">
                          <Sliders className="h-5 w-5 text-amber-400" />
                          <CardTitle className="text-lg text-white">Select Products for Survey</CardTitle>
                        </div>
                        <CardDescription className="text-xs text-stone-400 mt-1">
                          Select and deselect garments for pricing sensitivity testing.
                          {modalRun && (
                            <span className={`block font-mono mt-0.5 ${isModalRunImmutable ? 'text-amber-400 font-semibold' : 'text-stone-300'}`}>
                              {isModalRunImmutable ? '🔒 Viewing: ' : 'Target Run: '}
                              &ldquo;{modalRun.title}&rdquo; ({modalRun.status.toUpperCase()})
                            </span>
                          )}
                        </CardDescription>
                        {isModalRunImmutable && (
                          <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                            <span>
                              <strong>This Run is Completed &amp; Immutable:</strong> Historical votes cannot be altered. Choose garments here and click <strong>&ldquo;Launch as New Run&rdquo;</strong> to start an updated survey.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProductSelectionModal(false)}
                      className="text-stone-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Quick selection bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-1 border-t border-stone-800/60">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={handleSelectAllProducts}
                        className="h-7 text-[11px] border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800"
                      >
                        Select All ({products.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={handleDeselectAllProducts}
                        className="h-7 text-[11px] border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800"
                      >
                        Deselect All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={handleSelectOnlyActiveProducts}
                        className="h-7 text-[11px] border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800"
                      >
                        Only Active ({products.filter((p) => p.is_active).length})
                      </Button>
                    </div>
                    <div className="text-xs font-mono text-amber-400 font-semibold">
                      {selectedProductIds.length} of {products.length} Selected
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
                  {products.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 text-xs">
                      No products found in the catalog. Add garments first in the Catalog tab.
                    </div>
                  ) : (
                    products.map((product) => {
                      const isSelected = selectedProductIds.includes(product.id);
                      return (
                        <div
                          key={product.id}
                          onClick={() => handleToggleProductInSelection(product.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/40 text-white'
                              : 'bg-stone-950/40 border-stone-800 hover:border-stone-700 text-stone-400'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-amber-400 shrink-0">
                              {isSelected ? (
                                <CheckSquare className="h-5 w-5 text-amber-400" />
                              ) : (
                                <Square className="h-5 w-5 text-stone-600" />
                              )}
                            </div>
                            <div className="h-10 w-10 rounded-lg bg-stone-950 border border-stone-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {product.images && product.images[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ShoppingBag className="h-4 w-4 text-stone-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-stone-300'}`}>
                                  {product.name}
                                </span>
                                {!product.is_active && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/30">
                                    Inactive
                                  </span>
                                )}
                                {product.is_preorder && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    Pre-order
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-stone-400 flex items-center gap-2 mt-0.5">
                                <span>Retail: R {Number(product.base_price).toFixed(2)}</span>
                                {product.cost_price != null && (
                                  <>
                                    <span>&bull;</span>
                                    <span>Cost: R {Number(product.cost_price).toFixed(2)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right font-mono text-xs pl-3">
                            {isSelected ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                                In Survey
                              </span>
                            ) : (
                              <span className="text-stone-600 text-[10px] uppercase">
                                Excluded
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>

                {(() => {
                  const modalRun = surveyData?.selectedRun || surveyData?.activeRun;
                  const isModalRunImmutable = modalRun?.status === 'completed' || modalRun?.status === 'archived';
                  return (
                    <div className="border-t border-stone-800 p-4 bg-stone-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                      <div className="text-xs text-stone-400">
                        {isModalRunImmutable ? (
                          <span className="text-amber-400 flex items-center gap-1.5 font-mono text-xs">
                            <Lock className="h-3.5 w-3.5 text-amber-400" />
                            Completed runs are immutable. Click &ldquo;Launch as New Run&rdquo; to test these garments.
                          </span>
                        ) : (
                          <span>Update current active run directly, or launch this selection as a brand new documented run.</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowProductSelectionModal(false)}
                          className="text-stone-400 hover:text-white text-xs"
                        >
                          Cancel
                        </Button>
                        {!isModalRunImmutable && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSaveRunProducts}
                            disabled={savingRunProducts}
                            className="border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
                            title="Update the product list of the currently active run"
                          >
                            {savingRunProducts ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <span>Save to Current Run ({selectedProductIds.length})</span>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={openNewRunModalWithCurrentSelection}
                          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md"
                          title="Branch these selected products into a brand new documented survey run"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          <span>Launch as New Run ({selectedProductIds.length})...</span>
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            </div>
          )}

          {/* Start New Survey Run Modal */}
          {showNewRunModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
              <Card className="w-full max-w-lg border-amber-500/40 bg-stone-900 shadow-2xl">
                <CardHeader className="border-b border-stone-800 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-amber-400" />
                        <CardTitle className="text-lg text-white">Start New Survey Run</CardTitle>
                      </div>
                      <CardDescription className="text-xs text-stone-400 mt-1">
                        Creates a new documented survey run. The previous run's responses are safely archived in your history, giving you clean demand testing for your selected garments.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewRunModal(false)}
                      className="text-stone-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <form onSubmit={handleCreateNewRun}>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="newRunTitle" className="text-xs text-stone-300 font-semibold">
                        Survey Run Title *
                      </Label>
                      <Input
                        id="newRunTitle"
                        value={newRunTitle}
                        onChange={(e) => setNewRunTitle(e.target.value)}
                        placeholder="e.g. Run #2: Winter 2026 Hoodies & Trackpants Drop"
                        required
                        className="bg-stone-950 border-stone-800 text-white text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="newRunDescription" className="text-xs text-stone-300 font-semibold">
                        Description / Objective (Optional)
                      </Label>
                      <Input
                        id="newRunDescription"
                        value={newRunDescription}
                        onChange={(e) => setNewRunDescription(e.target.value)}
                        placeholder="e.g. Testing willingness to pay for heavyweight fleece blanks"
                        className="bg-stone-950 border-stone-800 text-white text-xs"
                      />
                    </div>

                    <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-300">Selected Garments:</span>
                        <span className="font-mono text-amber-400 font-bold">{selectedProductIds.length} Products</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {products
                          .filter((p) => selectedProductIds.includes(p.id))
                          .map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 rounded text-[10px] bg-stone-800 text-stone-200 border border-stone-700"
                            >
                              {p.name}
                            </span>
                          ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewRunModal(false);
                          setShowProductSelectionModal(true);
                        }}
                        className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold pt-1"
                      >
                        <Sliders className="h-3 w-3" /> Adjust selected products
                      </button>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-300">
                      ✓ This new run will become the <strong>Active Live Survey</strong> on the public <code>/survey</code> storefront page. Past submissions remain intact in your history table.
                    </div>
                  </CardContent>

                  <div className="border-t border-stone-800 p-4 bg-stone-950/80 flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setShowNewRunModal(false)}
                      className="text-stone-400 hover:text-white text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      type="submit"
                      disabled={creatingRun || !newRunTitle.trim()}
                      className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md"
                    >
                      {creatingRun ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          <span>Creating Run...</span>
                        </>
                      ) : (
                        <span>Create &amp; Activate Run</span>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
