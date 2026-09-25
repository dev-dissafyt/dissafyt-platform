'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, PayfastProductButton } from '@dissafyt/ui';
import { ShoppingBag, ArrowLeft, Check, ShieldCheck, Truck, RefreshCw, Ruler, Clock, Sparkles } from 'lucide-react';
import { useCart } from '../../context/cart-context';
import { LastUpdatedBadge } from '../../components/last-updated';
import { CopyButton } from '../../components/copy-button';
import { SizeGuideModal } from '../../components/size-guide-modal';

interface Variant {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  price_override?: number | null;
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
  category_name?: string;
  images: string[];
  is_preorder?: boolean;
  preorder_message?: string | null;
  preorder_target?: number | null;
  variants: Variant[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { addItem, openCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [activeHeroImage, setActiveHeroImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/products/${slug}`, { cache: 'no-store' });
        if (res.ok) {
          const data: Product = await res.json();
          setProduct(data);

          // Extract color options if available
          const colorList = Array.from(
            new Set((data.variants || []).map((v) => v.color).filter((c): c is string => Boolean(c)))
          );

          if (colorList.length > 0) {
            const initialColor = colorList[0];
            setSelectedColor(initialColor);
            const firstColorVar = data.variants.find((v) => v.color === initialColor) || data.variants[0];
            setSelectedVariant(firstColorVar);
            if (firstColorVar?.image_url) {
              setActiveHeroImage(firstColorVar.image_url);
            } else if (data.images && data.images.length > 0) {
              setActiveHeroImage(data.images[0]);
            }
          } else {
            setSelectedColor(null);
            if (data.variants && data.variants.length > 0) {
              setSelectedVariant(data.variants[0]);
            }
            if (data.images && data.images.length > 0) {
              setActiveHeroImage(data.images[0]);
            }
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

  // Consolidate all images from product.images and variant image_urls
  const allImages: string[] = product
    ? Array.from(
        new Set([
          ...(product.images || []),
          ...(product.variants || []).map((v) => v.image_url).filter((img): img is string => Boolean(img)),
        ])
      )
    : [];

  // Available unique colors with their hex codes
  const availableColors = product
    ? Array.from(
        new Map(
          (product.variants || [])
            .filter((v) => Boolean(v.color))
            .map((v) => [
              v.color as string,
              {
                name: v.color as string,
                hex: v.color_hex || '#111111',
                image_url: v.image_url || null,
              },
            ])
        ).values()
      )
    : [];

  // Variants filtered by current color (if colors are used)
  const displayedVariants = product
    ? selectedColor
      ? product.variants.filter((v) => v.color === selectedColor)
      : product.variants
    : [];

  function handleSelectColor(colorName: string) {
    setSelectedColor(colorName);
    const colorVars = (product?.variants || []).filter((v) => v.color === colorName);
    const currentSize = selectedVariant?.size || selectedVariant?.name;
    const matchSameSize = colorVars.find((v) => (v.size || v.name) === currentSize);
    const nextVar = matchSameSize || colorVars[0] || null;
    setSelectedVariant(nextVar);

    // Switch hero image if color or variant has an assigned image
    if (nextVar?.image_url) {
      setActiveHeroImage(nextVar.image_url);
    }
  }

  function handleSelectVariant(variant: Variant) {
    setSelectedVariant(variant);
    if (variant.image_url) {
      setActiveHeroImage(variant.image_url);
    }
  }

  function handleAddToCart(openDrawer: boolean = true) {
    if (!product) return;
    const heroImg = activeHeroImage || product.images?.[0] || selectedVariant?.image_url || '';
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id || null,
      productName: product.name,
      variantName: selectedVariant?.name || 'Standard',
      price: selectedVariant?.price_override || product.base_price,
      quantity,
      image: heroImg,
      slug: product.slug || slug,
      isPreorder: Boolean(product.is_preorder),
      preorderMessage: product.preorder_message || null,
      color: selectedVariant?.color || selectedColor || null,
      colorHex: selectedVariant?.color_hex || null,
      size: selectedVariant?.size || selectedVariant?.name || 'Standard',
    });

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);

    if (openDrawer) {
      openCart();
    }
  }

  function handleBuyNow() {
    handleAddToCart(false);
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
  const isPreorder = Boolean(product.is_preorder);
  const isBottoms =
    product.name.toLowerCase().includes('track') ||
    product.name.toLowerCase().includes('pant') ||
    product.name.toLowerCase().includes('short') ||
    (product.category_name && product.category_name.toLowerCase().includes('bottom'));

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 space-y-8">
      <Link href="/shop" className="inline-flex items-center text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Clothing Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Media */}
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden relative group">
            {isPreorder && (
              <div className="absolute top-4 left-4 z-10 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-black shadow-lg">
                Pre-order Drop
              </div>
            )}
            {selectedVariant?.color && (
              <div className="absolute bottom-4 left-4 z-10 rounded-full bg-black/80 backdrop-blur-md px-3 py-1 text-[11px] font-mono font-bold text-white border border-white/20 shadow-md flex items-center gap-1.5">
                {selectedVariant.color_hex && (
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-white/40"
                    style={{ backgroundColor: selectedVariant.color_hex }}
                  />
                )}
                <span>{selectedVariant.color}</span>
              </div>
            )}
            {(activeHeroImage || (product.images && product.images[0])) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeHeroImage || product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-600 space-y-2">
                <ShoppingBag className="h-16 w-16 text-zinc-700" />
                <span className="text-sm font-medium">Dissafyt Original Apparel</span>
              </div>
            )}
          </div>

          {/* Multi-image thumbnail strip */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pt-1">
              {allImages.map((img, idx) => {
                const isActive = (activeHeroImage || allImages[0]) === img;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveHeroImage(img)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 bg-zinc-900 relative transition-all ${
                      isActive
                        ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-md'
                        : 'border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${product.name} preview ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Form */}
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isPreorder ? (
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 uppercase tracking-wider border border-amber-500/40">
                  Pre-order Batch Drop
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 uppercase tracking-wider border border-emerald-500/20">
                  In Stock &bull; Ready to Ship
                </span>
              )}
              {product.category_name && (
                <span className="rounded-full bg-zinc-800/80 px-3 py-1 text-xs font-semibold text-zinc-300 uppercase tracking-wider border border-zinc-700">
                  {product.category_name}
                </span>
              )}
              <LastUpdatedBadge date="September 2026" prefix="Batch 01" />
              <CopyButton text={selectedVariant?.sku || product.slug || product.id} label="SKU" />
            </div>
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

          {/* Pre-order Batch Announcement Notice */}
          {isPreorder && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Clock className="h-4 w-4" />
                <span>Pre-order Production & Dispatch Timeline</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {product.preorder_message || 'Batch manufacturing will commence once the drop period closes. Door-to-door courier delivery estimated in 2–3 weeks.'}
              </p>
              {product.preorder_target && (
                <div className="pt-1 flex items-center space-x-2 text-[11px] font-mono text-amber-300/80">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Limited Batch Allocation: {product.preorder_target} total garments planned</span>
                </div>
              )}
            </div>
          )}

          {/* Colorway Selection */}
          {availableColors.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-zinc-200">
                  Select Color:{' '}
                  <span className="font-bold text-amber-400 font-mono ml-1">
                    {selectedColor || 'Default'}
                  </span>
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {availableColors.length} {availableColors.length === 1 ? 'colorway' : 'colorways'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {availableColors.map((c) => {
                  const isSelected = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleSelectColor(c.name)}
                      className={`group flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold border transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 text-white ring-1 ring-amber-500/40 shadow-sm'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-white/30 shadow-inner shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizing & Variant Selection */}
          {displayedVariants.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">Select Size:</span>
                  {selectedVariant && (
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {selectedVariant.size || selectedVariant.name}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="inline-flex items-center text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors gap-1.5"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  <span>Size & Fit Guide</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {displayedVariants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const isOutOfStock = !isPreorder && v.stock_quantity <= 0;
                  const label = v.size || v.name;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleSelectVariant(v)}
                      className={`min-w-[48px] rounded-lg px-4 py-2.5 text-sm font-bold border transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 text-amber-300 shadow-md ring-1 ring-amber-500/50'
                          : isOutOfStock
                          ? 'border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed line-through'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-zinc-400 pt-1 flex items-center justify-between">
                <span>
                  {isPreorder
                    ? 'Batch Drop: Custom manufactured to selected size blanks.'
                    : currentStock > 0
                    ? `${currentStock} units in Cape Town stock`
                    : 'Out of Stock in this size'}
                </span>
                <span className="text-[11px] text-zinc-500">Boxy Drop-Shoulder Streetwear Cut</span>
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            {addedNotice && (
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300 flex items-center">
                <Check className="mr-2 h-4 w-4" /> Added to your shopping bag!
              </div>
            )}

            <div className="flex items-center space-x-3">
              <div className="flex items-center border border-zinc-800 rounded-md bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-zinc-400 hover:text-white"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3 py-2 text-sm font-semibold text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(isPreorder ? quantity + 1 : Math.min(currentStock, quantity + 1))}
                  className="px-3 py-2 text-zinc-400 hover:text-white"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <Button
                type="button"
                onClick={() => handleAddToCart(true)}
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-200 hover:bg-zinc-800 font-semibold"
              >
                {isPreorder ? 'Add Pre-order to Bag' : 'Add to Cart'}
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleBuyNow}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold h-12 text-sm uppercase tracking-wider shadow-lg shadow-amber-500/10"
            >
              {isPreorder ? (
                <span>Pre-order Now &bull; R {(effectivePrice * quantity).toFixed(2)}</span>
              ) : (
                <span>Checkout with PayFast &bull; R {(effectivePrice * quantity).toFixed(2)}</span>
              )}
            </Button>
          </div>

          {/* Logistics assurance */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-800/80 text-xs text-zinc-400">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span>Door-to-door Courier Delivery across SA</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span>Verified PayFast 256-bit Encryption</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sizing Modal */}
      <SizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        defaultTab={isBottoms ? 'bottoms' : 'tops'}
      />
    </div>
  );
}
