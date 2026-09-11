'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, PayfastProductButton } from '@dissafyt/ui';
import { ShoppingBag, ArrowLeft, Check, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

interface Variant {
  id: string;
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
  category_name?: string;
  images: string[];
  variants: Variant[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/products/${slug}`, { cache: 'no-store' });
        if (res.ok) {
          const data: Product = await res.json();
          setProduct(data);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        }
      } catch (e) {
        console.error('Failed to load product:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  function handleAddToCart() {
    if (!product) return;
    const cartItem = {
      productId: product.id,
      variantId: selectedVariant?.id || null,
      productName: product.name,
      variantName: selectedVariant?.name || 'Standard',
      price: selectedVariant?.price_override || product.base_price,
      quantity,
      image: product.images?.[0] || '',
    };

    const existingCart = JSON.parse(localStorage.getItem('dissafyt_cart') || '[]');
    const existingIndex = existingCart.findIndex(
      (item: any) => item.productId === cartItem.productId && item.variantId === cartItem.variantId
    );

    if (existingIndex > -1) {
      existingCart[existingIndex].quantity += quantity;
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem('dissafyt_cart', JSON.stringify(existingCart));
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push('/checkout');
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-20 text-center text-zinc-500">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Product Not Found</h1>
        <p className="text-zinc-400">The product you are looking for may have been retired or renamed.</p>
        <Link href="/shop">
          <Button variant="outline" className="border-zinc-700 text-zinc-300">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const effectivePrice = selectedVariant?.price_override || product.base_price;
  const currentStock = selectedVariant?.stock_quantity ?? 10;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 space-y-8">
      <Link href="/shop" className="inline-flex items-center text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Clothing Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Media */}
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
            {product.images && product.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-600 space-y-2">
                <ShoppingBag className="h-16 w-16 text-zinc-700" />
                <span className="text-sm font-medium">Dissafyt Original Apparel</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Details & Purchase Form */}
        <div className="space-y-6">
          <div>
            {product.category_name && (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 uppercase tracking-wider border border-amber-500/20">
                {product.category_name}
              </span>
            )}
            <h1 className="text-3xl font-extrabold text-white mt-3">{product.name}</h1>
            <div className="mt-3 flex items-baseline space-x-3">
              <span className="text-3xl font-extrabold text-amber-400">
                R {Number(effectivePrice).toFixed(2)}
              </span>
              <span className="text-xs text-zinc-500 font-medium">ZAR incl. VAT</span>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-zinc-300 text-sm leading-relaxed">
              {product.description || 'Crafted with premium heavyweight cotton, custom embroidery, and signature Dissafyt streetwear styling.'}
            </p>
          </div>

          {/* Sizing & Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-zinc-200">Select Size / Style:</span>
                <span className="text-xs text-zinc-400">
                  {currentStock > 0 ? `${currentStock} available` : 'Out of Stock'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`rounded-md px-4 py-2 text-sm font-semibold border transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-sm'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            {addedNotice && (
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300 flex items-center">
                <Check className="mr-2 h-4 w-4" /> Added to your shopping cart!
              </div>
            )}

            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-zinc-800 rounded-md bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-zinc-400 hover:text-white"
                >
                  -
                </button>
                <span className="px-3 py-2 text-sm font-semibold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="px-3 py-2 text-zinc-400 hover:text-white"
                >
                  +
                </button>
              </div>

              <Button
                type="button"
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-200 hover:bg-zinc-800 font-semibold"
              >
                Add to Cart
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleBuyNow}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-11"
            >
              Checkout with PayFast (R {(effectivePrice * quantity).toFixed(2)})
            </Button>
          </div>

          {/* Logistics assurance */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-800/80 text-xs text-zinc-400">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-amber-500" />
              <span>Door-to-door Delivery across South Africa</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <span>Verified PayFast 256-bit Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
