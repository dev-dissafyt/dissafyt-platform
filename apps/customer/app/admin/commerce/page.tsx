'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@dissafyt/ui';
import { ShoppingBag, Plus, Trash2, CheckCircle, XCircle, Tag, Layers, RefreshCw, Package, Pencil, Copy, Check, ExternalLink, Share2, HelpCircle, Upload, Image as ImageIcon, Palette, Loader2, Sparkles, X } from 'lucide-react';
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
  category_id?: string;
  category_name?: string;
  is_active: boolean;
  images: string[];
  is_preorder?: boolean;
  preorder_message?: string | null;
  preorder_target?: number | null;
  variants: Variant[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editStockQuantity, setEditStockQuantity] = useState('25');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsPreorder, setEditIsPreorder] = useState(false);
  const [editPreorderMessage, setEditPreorderMessage] = useState('');
  const [editPreorderTarget, setEditPreorderTarget] = useState('');
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

  async function uploadFilesToStorage(files: FileList | File[]): Promise<string[]> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const res = await fetch('/api/products/upload-image', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload image(s)');
    }
    return data.urls || (data.url ? [data.url] : []);
  }

  async function handleAddImagesUpload(files: FileList | File[]) {
    try {
      setUploadingImages(true);
      setStatusMsg(null);
      const urls = await uploadFilesToStorage(files);
      setImages((prev) => [...prev, ...urls]);
      setStatusMsg(`Uploaded ${urls.length} product image(s) to Supabase Storage.`);
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
      const urls = await uploadFilesToStorage(files);
      setEditImages((prev) => [...prev, ...urls]);
      setStatusMsg(`Uploaded ${urls.length} product image(s) to Supabase Storage.`);
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
    const prefix = (name || 'DROP').substring(0, 4).toUpperCase();
    const newMatrix: Variant[] = [];
    nextColorways.forEach((cw) => {
      const colorShort = cw.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
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
          sku: `${prefix}-${colorShort}-${sz}`,
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
    } else {
      nextColorways = [...editSelectedColorways, colorway];
    }
    setEditSelectedColorways(nextColorways);
  }

  function applyColorwaysMatrixToEdit() {
    if (editSelectedColorways.length === 0) return;
    const prefix = (editSlug || editName || 'DROP').substring(0, 4).toUpperCase();
    const updatedVariants: Variant[] = [];

    editSelectedColorways.forEach((cw) => {
      const colorShort = cw.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
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
          sku: existing?.sku || `${prefix}-${colorShort}-${sz}`,
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

  async function loadData() {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        adminFetch('/api/products', { cache: 'no-store' }),
        adminFetch('/api/categories', { cache: 'no-store' }),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
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
          category_id: categoryId || null,
          images: images,
          is_active: true,
          is_preorder: isPreorder,
          preorder_message: isPreorder ? preorderMessage : null,
          preorder_target: isPreorder && preorderTarget ? parseInt(preorderTarget, 10) : null,
          variants: variantsToSubmit,
        }),
      });

      if (res.ok) {
        setStatusMsg(`Product "${name}" created successfully with ${variantsToSubmit.length} variants and ${images.length} photos!`);
        setName('');
        setDescription('');
        setBasePrice('');
        setImages([]);
        setManualUrl('');
        setSelectedColorways([]);
        setColorMatrix([]);
        setIsPreorder(false);
        setPreorderMessage('Batch 01: Ships 2–3 weeks from drop close');
        setPreorderTarget('50');
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
    const matchedCat = categories.find((c) => c.name === prod.category_name || c.id === prod.category_id);
    setEditCategoryId(matchedCat ? matchedCat.id : '');
    const stock = prod.variants?.reduce((acc, v) => acc + (v.stock_quantity || 0), 0) ?? 25;
    setEditStockQuantity(String(stock));
    setEditIsActive(prod.is_active);
    setEditIsPreorder(Boolean(prod.is_preorder));
    setEditPreorderMessage(prod.preorder_message || '');
    setEditPreorderTarget(prod.preorder_target ? String(prod.preorder_target) : '');
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
          category_id: editCategoryId || null,
          is_active: editIsActive,
          images: editImages,
          is_preorder: editIsPreorder,
          preorder_message: editIsPreorder ? editPreorderMessage : null,
          preorder_target: editIsPreorder && editPreorderTarget ? parseInt(editPreorderTarget, 10) : null,
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
          <Link href="/admin/commerce/orders">
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
              <Label>Base Price (ZAR - Rands)</Label>
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
                  (Accepts customer preorders with batch manufacturing notification)
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
                    <Label className="text-xs text-stone-300">Batch Target Units (Gauge Drop Interest)</Label>
                    <Input
                      type="number"
                      value={preorderTarget}
                      onChange={(e) => setPreorderTarget(e.target.value)}
                      placeholder="e.g. 50"
                      className="bg-stone-950 border-stone-700 text-xs"
                    />
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

      {/* Edit Product Modal Form */}
      {editingProduct && (
        <Card className="border-amber-500/50 bg-stone-900/95 p-6 border shadow-2xl">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl text-white flex items-center">
              <Pencil className="mr-2 h-5 w-5 text-amber-500" />
              Edit Product: {editingProduct.name}
            </CardTitle>
            <CardDescription>
              Updates to pricing, category, and inventory are tracked in the database audit log.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSaveEditedProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label>Base Price (ZAR)</Label>
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
                  (Accepts customer preorders with batch manufacturing notification)
                </span>
              </label>

              {editIsPreorder && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-500/20">
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
                    <Label className="text-xs text-stone-300">Batch Target Units (Gauge Drop Interest)</Label>
                    <Input
                      type="number"
                      value={editPreorderTarget}
                      onChange={(e) => setEditPreorderTarget(e.target.value)}
                      placeholder="e.g. 50"
                      className="bg-stone-950 border-stone-700 text-xs"
                    />
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

            <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-stone-800">
              <Button type="button" variant="ghost" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editSubmitting}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      )}


      {/* Meta Commerce Manager & WhatsApp Catalog Data Feed Card */}
      <Card className="border-amber-500/20 bg-stone-900/60 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-stone-800/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <span>Meta Commerce & WhatsApp Catalog Feed</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase font-semibold">
                    Live Sync Ready
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-stone-400 mt-0.5">
                  Automated scheduled data feed link for Facebook Shops, Instagram Shopping, and WhatsApp Product Catalog.
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFeedGuide(!showFeedGuide)}
              className="border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 text-xs shrink-0 flex items-center gap-1.5"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>{showFeedGuide ? 'Hide Setup Guide' : 'Meta Setup Instructions'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs">
          {/* Feed URL Display & Copy Actions */}
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

          {/* Step-by-Step Meta Setup Guide (Collapsible) */}
          {showFeedGuide && (
            <div className="pt-3 border-t border-stone-800/80 space-y-2 text-stone-300 bg-stone-950/40 p-3.5 rounded-xl">
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
        </CardContent>
      </Card>

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
                    <th className="py-3 px-4">Price (ZAR)</th>
                    <th className="py-3 px-4">Stock</th>
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
                        <td className="py-3 px-4 font-bold text-amber-400">
                          R {Number(product.base_price).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <div>
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
                                ? `Pre-order Batch${product.preorder_target ? ` (${product.preorder_target} target)` : ''}`
                                : `${totalStock} in stock`}
                            </span>
                          </div>
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
    </div>
  );
}
