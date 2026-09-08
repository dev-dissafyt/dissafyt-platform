'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle, Button, PayfastProductButton } from '@dissafyt/ui';
import { ShoppingBag, ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';

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
    <div className="container mx-auto max-w-7xl px-4 py-16 space-y-10">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <ShoppingBag className="mr-3 h-8 w-8 text-amber-500" />
          DISSafyt Clothing Catalog
        </h1>
        <p className="text-zinc-400">
          Curated streetwear, limited drops, and lifestyle apparel. Instant checkout with PayFast.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500">Loading catalog...</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-zinc-500 space-y-3 border border-zinc-800 rounded-lg p-12 bg-zinc-900/30">
          <Tag className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="text-lg text-zinc-300">New collection drops launching soon!</p>
          <p className="text-sm text-zinc-500">
            Products created in the Admin portal will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="h-52 rounded-md bg-zinc-800/80 flex items-center justify-center text-zinc-600 mb-4 overflow-hidden relative">
                  {product.images && product.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500 text-xs">
                      <ShoppingBag className="h-8 w-8 mb-2 text-zinc-600" />
                      <span>{product.name}</span>
                    </div>
                  )}
                  {product.category_name && (
                    <span className="absolute top-2 right-2 rounded bg-zinc-950/80 px-2 py-0.5 text-xs text-zinc-300 border border-zinc-700">
                      {product.category_name}
                    </span>
                  )}
                </div>

                <CardTitle className="text-xl text-white">{product.name}</CardTitle>
                <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
                  {product.description || 'Authentic DISSafyt streetwear garment.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Price (incl. VAT)</span>
                  <span className="font-extrabold text-2xl text-amber-400">
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
