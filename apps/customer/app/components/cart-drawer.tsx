'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/cart-context';
import { Button } from '@dissafyt/ui';

export function CartDrawer() {
  const { items, totalCount, subtotal, isOpen, closeCart, updateQuantity, removeItem } = useCart();

  // Handle ESC key to close drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        closeCart();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <aside
        className="relative z-50 flex h-full w-full max-w-md flex-col bg-zinc-950 border-l border-zinc-800 shadow-2xl text-zinc-100 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Your Shopping Bag</h2>
              <span className="text-[11px] font-mono text-zinc-400">
                {totalCount} {totalCount === 1 ? 'item' : 'items'} in order
              </span>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Courier dispatch note */}
        <div className="bg-zinc-900/60 border-b border-zinc-800 px-6 py-2.5 flex items-center space-x-2 text-xs text-zinc-400">
          <Truck className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>Door-to-door express delivery across South Africa via The Courier Guy</span>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-800/80">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-16 space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="text-base font-bold text-white">Your bag is empty</p>
                <p className="text-xs text-zinc-400">
                  Discover our Cape Town 280GSM streetwear drops, heavyweight hoodies, and limited capsules.
                </p>
              </div>
              <Link href="/shop" onClick={closeCart}>
                <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg">
                  Explore Streetwear Drops
                </Button>
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="py-4 flex space-x-4">
                {/* Item Thumbnail */}
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 relative">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={item.slug ? `/shop/${item.slug}` : `/shop/${item.productId}`}
                        onClick={closeCart}
                        className="text-xs font-bold uppercase tracking-tight text-white hover:text-amber-400 transition-colors line-clamp-1"
                      >
                        {item.productName}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-0.5"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="inline-block rounded border border-zinc-700/80 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono uppercase text-zinc-300">
                        {item.variantName || 'Standard'}
                      </span>
                      {item.isPreorder && (
                        <span className="inline-block rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                          Pre-order
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-zinc-400">
                        R {item.price.toFixed(2)} ea
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Line Total */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900/80">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[28px] text-center font-mono text-xs font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="font-display text-sm font-extrabold text-amber-400">
                      R {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-zinc-800/80 bg-zinc-950 p-6 space-y-4">
            {/* Subtotal row */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono">
                  Subtotal (incl. VAT)
                </span>
                <span className="font-display text-2xl font-black text-amber-400">
                  R {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>Door-to-door Courier Delivery</span>
                <span>The Courier Guy</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Link href="/checkout" onClick={closeCart} className="block w-full">
                <Button className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2">
                  <span>Proceed to PayFast Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="w-full py-2.5 text-center text-xs text-zinc-400 hover:text-white transition-colors font-medium"
              >
                Continue Shopping
              </button>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center justify-center space-x-2 pt-1 text-[10px] text-zinc-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Verified PayFast 256-bit Encryption &bull; Instant EFT & Cards</span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
