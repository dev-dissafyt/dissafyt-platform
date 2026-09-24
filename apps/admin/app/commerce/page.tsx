'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@dissafyt/ui';
import { ShoppingBag, Plus, Trash2, CheckCircle, XCircle, Tag, Layers, RefreshCw, Package, Pencil, Copy, Check, ExternalLink, Share2, HelpCircle } from 'lucide-react';
import { adminFetch } from '@/lib/operator';

interface Variant {
  id?: string;
  name: string;
  sku: string;
  stock_quantity: number;
  price_override?: number | null;
  is_active?: boolean;
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
  const [editVariants, setEditVariants] = useState<Variant[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Form State (Add Product)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stockQuantity, setStockQuantity] = useState('25');
  const [isPreorder, setIsPreorder] = useState(false);
  const [preorderMessage, setPreorderMessage] = useState('Batch 01: Ships 2–3 weeks from drop close');
  const [preorderTarget, setPreorderTarget] = useState('50');
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
      const variantsToSubmit = useStreetwearSizes
        ? Object.entries(sizeStocks).map(([sizeName, qty]) => ({
            name: sizeName,
            sku: `${(name || 'DROP').substring(0, 4).toUpperCase()}-${sizeName}`,
            stock_quantity: Math.max(0, Number(qty) || 0),
          }))
        : [
            {
              name: 'Standard',
              sku: `${(name || 'ITEM').substring(0, 4).toUpperCase()}-STD`,
              stock_quantity: parseInt(stockQuantity, 10) || 10,
            },
          ];

      const res = await adminFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          base_price: parseFloat(basePrice),
          category_id: categoryId || null,
          images: imageUrl ? [imageUrl] : [],
          is_active: true,
          is_preorder: isPreorder,
          preorder_message: isPreorder ? preorderMessage : null,
          preorder_target: isPreorder && preorderTarget ? parseInt(preorderTarget, 10) : null,
          variants: variantsToSubmit,
        }),
      });

      if (res.ok) {
        setStatusMsg(`Product "${name}" created successfully with ${variantsToSubmit.length} size variants!`);
        setName('');
        setDescription('');
        setBasePrice('');
        setImageUrl('');
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
    setEditVariants(
      prod.variants && prod.variants.length > 0
        ? prod.variants.map((v) => ({ ...v }))
        : [{ name: 'Standard', stock_quantity: 10, sku: '' }]
    );
  }

  function applyStreetwearSizesToEdit() {
    setEditVariants(
      DEFAULT_STREETWEAR_SIZES.map((size) => {
        const existing = editVariants.find((v) => v.name.toLowerCase() === size.toLowerCase());
        return {
          id: existing?.id,
          name: size,
          sku: existing?.sku || `${(editSlug || 'ITEM').toUpperCase().slice(0, 4)}-${size}`,
          stock_quantity: existing ? existing.stock_quantity : 15,
        };
      })
    );
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
          is_preorder: editIsPreorder,
          preorder_message: editIsPreorder ? editPreorderMessage : null,
          preorder_target: editIsPreorder && editPreorderTarget ? parseInt(editPreorderTarget, 10) : null,
          variants: editVariants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            stock_quantity: Math.max(0, Number(v.stock_quantity) || 0),
            price_override: v.price_override || null,
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

            <div className="space-y-1">
              <Label>Image URL (Optional)</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
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

            {/* Sizing & Stock Curve Configuration */}
            <div className="md:col-span-2 rounded-xl border border-stone-800 bg-stone-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Streetwear Size Curve</span>
                    <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                      S to 2XL Standard
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Allocate blanks or target units per individual size.
                  </p>
                </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-stone-800">
                  {DEFAULT_STREETWEAR_SIZES.map((size) => (
                    <div key={size} className="space-y-1">
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
                        className="bg-stone-900 border-stone-700 text-xs text-center font-mono font-semibold"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1 pt-2 border-t border-stone-800">
                  <Label>Flat Inventory Quantity</Label>
                  <Input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="Initial inventory count"
                    required
                  />
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

            {/* Sizing & Stock Curve Configuration */}
            <div className="md:col-span-2 rounded-xl border border-stone-800 bg-stone-950/60 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Size Variants & Inventory</span>
                    <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                      {editVariants.length} Sizes Configured
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Manage stock allocation per size variant for blanks and drop orders.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyStreetwearSizesToEdit}
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs shrink-0"
                >
                  Apply Standard Sizes (S, M, L, XL, 2XL)
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-stone-800">
                {editVariants.map((v, idx) => (
                  <div key={v.id || v.name || idx} className="space-y-1 bg-stone-900/60 p-2.5 rounded-lg border border-stone-800">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-amber-400 font-mono font-bold">Size {v.name}</Label>
                      {v.sku && <span className="text-[9px] text-stone-500 font-mono truncate max-w-[65px]">{v.sku}</span>}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={v.stock_quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        const updated = [...editVariants];
                        updated[idx] = { ...updated[idx], stock_quantity: val };
                        setEditVariants(updated);
                      }}
                      className="bg-stone-950 border-stone-700 text-xs text-center font-mono font-semibold h-8"
                    />
                  </div>
                ))}
              </div>
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
                          <div className="flex items-center gap-2">
                            <span>{product.name}</span>
                            {product.is_preorder && (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/40">
                                Pre-order
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 font-mono">{product.slug}</div>
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
