'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle, Button, PayfastProductButton } from '@dissafyt/ui';
import { ShoppingBag, ArrowLeft, Tag, Sparkles, Truck, ShieldCheck, Layers } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  category_name?: string;
  images: string[];
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          setProducts(await res.json());
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 space-y-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white font-mono text-xs">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Flagship
          </Button>
        </Link>
        <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
          GARMENT LAB // CPT STUDIO
        </span>
      </div>

      {/* Editorial Drop Room Header */}
      <div className="space-y-6">
        <div className="inline-flex items-center space-x-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1 text-xs font-mono text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>CAPE TOWN GARMENT LAB &bull; BATCH 01</span>
        </div>

        <div className="max-w-3xl space-y-3">
          <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-white">
            The Streetwear Drop Room
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            High-density luxury streetwear engineered in Cape Town. 280GSM ring-spun cotton and French terry, printed with permanent direct-to-garment fidelity. Instant PayFast ZAR checkout and express Courier Guy door delivery.
          </p>
        </div>

        {/* Spec Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex items-center space-x-3">
            <Layers className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">280 GSM</div>
              <div className="text-[10px] text-zinc-500 font-mono">Heavyweight Fleece</div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex items-center space-x-3">
            <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">DTG Precision</div>
              <div className="text-[10px] text-zinc-500 font-mono">Crack-Resistant Prints</div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex items-center space-x-3">
            <Truck className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Courier Guy</div>
              <div className="text-[10px] text-zinc-500 font-mono">Nationwide Delivery</div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex items-center space-x-3">
            <ShieldCheck className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">PayFast ZAR</div>
              <div className="text-[10px] text-zinc-500 font-mono">Instant Secure Pay</div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Grid or Capsule Teaser */}
      {loading ? (
        <div className="py-24 text-center text-zinc-500 font-mono text-sm">
          Accessing Cape Town Studio Vault...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
              BATCH 01 // COMING VERY SOON
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
              Limited Creator Capsule Loading
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
              Our first 280GSM Cape Town streetwear drop is undergoing final print inspection. Garments created in the Admin Studio will drop live here with instant PayFast purchasing.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link
              href="/book"
              className="inline-flex items-center rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 text-xs font-extrabold uppercase tracking-wider transition-all"
            >
              Book Barber Chair in Cape Town
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card
              key={product.id}
              className="border-zinc-800 hover:border-zinc-700 bg-zinc-950/80 p-6 flex flex-col justify-between transition-all duration-300 rounded-2xl group shadow-lg"
            >
              <div>
                <div className="h-64 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600 mb-5 overflow-hidden relative border border-zinc-800/80">
                  {product.images && product.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500 text-xs p-4 text-center">
                      <ShoppingBag className="h-10 w-10 mb-2 text-zinc-700" />
                      <span className="font-mono text-[11px] uppercase tracking-wider">{product.name}</span>
                    </div>
                  )}
                  <span className="absolute top-3 right-3 rounded-full bg-black/80 backdrop-blur px-2.5 py-0.5 text-[10px] font-mono text-zinc-300 border border-zinc-700">
                    {product.category_name || 'STREETWEAR'}
                  </span>
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/80 backdrop-blur px-2.5 py-0.5 text-[10px] font-mono text-amber-400 border border-amber-500/30">
                    280GSM // CPT
                  </span>
                </div>

                <CardTitle className="font-display text-xl font-bold text-white tracking-tight uppercase">
                  {product.name}
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                  {product.description || 'Authentic Dissafyt heavyweight garment crafted in Cape Town.'}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-zinc-900 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    Price (incl. VAT)
                  </span>
                  <span className="font-display font-black text-2xl text-amber-400">
                    R {Number(product.base_price).toFixed(2)}
                  </span>
                </div>

                <PayfastProductButton
                  productName={product.name}
                  amount={product.base_price}
                  description={product.description}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
