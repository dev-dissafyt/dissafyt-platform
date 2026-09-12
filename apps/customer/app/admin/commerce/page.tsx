'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@dissafyt/ui';
import { ShoppingBag, Plus, Trash2, CheckCircle, XCircle, Tag, Layers, RefreshCw, Package, Pencil } from 'lucide-react';
import { adminFetch } from '@/lib/operator';

interface Variant {
  id?: string;
  name: string;
  sku: string;
  stock_quantity: number;
  price_override?: number | null;
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
  variants: Variant[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

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
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stockQuantity, setStockQuantity] = useState('25');
  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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
          variants: [
            {
              name: 'Standard',
              sku: `${name.substring(0, 4).toUpperCase()}-STD`,
              stock_quantity: parseInt(stockQuantity, 10) || 10,
            },
          ],
        }),
      });

      if (res.ok) {
        setStatusMsg('Product created successfully!');
        setName('');
        setDescription('');
        setBasePrice('');
        setImageUrl('');
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
          stock_quantity: parseInt(editStockQuantity, 10) || 0,
          is_active: editIsActive,
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

        <div className="flex items-center space-x-3">
          <Link href="/commerce/orders">
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
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="Initial inventory count"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
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
              <Label>Inventory Stock Quantity</Label>
              <Input
                type="number"
                min="0"
                value={editStockQuantity}
                onChange={(e) => setEditStockQuantity(e.target.value)}
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


      {/* Products Table */}
      <Card className="border-stone-800 bg-stone-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Live Catalog ({products.length})</CardTitle>
          <CardDescription>
            All clothing and commerce items stored in Supabase PostgreSQL.
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
                          <div>{product.name}</div>
                          <div className="text-xs text-stone-500 font-mono">{product.slug}</div>
                        </td>
                        <td className="py-3 px-4 text-stone-400">
                          {product.category_name || 'Uncategorized'}
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-400">
                          R {Number(product.base_price).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-mono ${
                              totalStock > 0
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {totalStock} in stock
                          </span>
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
