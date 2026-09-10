'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Package, Truck, MessageSquare, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  total: number;
  created_at: string;
  shipping_address?: {
    recipient_name?: string;
    recipient_phone?: string;
    recipient_email?: string;
    street_address?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postal_code?: string;
  };
  customer_name?: string;
  customer_email?: string;
  order_items?: OrderItem[];
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || searchParams.get('order_number') || searchParams.get('m_payment_id');

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear cart immediately upon successful checkout redirect
    try {
      localStorage.removeItem('dissafyt_cart');
    } catch {
      // Ignore
    }

    if (!orderNumber) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/lookup?orderNumber=${encodeURIComponent(orderNumber || '')}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error('Failed to fetch order details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderNumber]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-20">
      {/* Hero Confirmation Banner */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 mb-2">
          <CheckCircle2 className="h-10 w-10 text-amber-500 stroke-[2.5]" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-mono tracking-widest text-amber-500 uppercase font-bold">
            PAYMENT CONFIRMED // DISPATCH QUEUED
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
            Order Confirmed
          </h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Your Cape Town streetwear order has been secured and logged into the fulfillment queue.
          </p>
        </div>

        {orderNumber && (
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-mono text-zinc-300">
            <span className="text-zinc-500">Order Ref:</span>
            <span className="font-bold text-amber-400">#{orderNumber}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Dispatch Notice Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
            <div className="flex items-center space-x-3 text-white font-bold text-base">
              <Truck className="h-5 w-5 text-amber-500" />
              <span>Courier Guy Express Dispatch</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Garments are prepped at our Cape Town studio and dispatched directly via The Courier Guy. You will receive an automated SMS and email notification with your tracking waybill once parcel inspection is complete.
            </p>

            {order?.shipping_address && (
              <div className="pt-4 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-mono text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
                    Delivering To
                  </span>
                  <p className="text-white font-semibold">
                    {order.shipping_address.recipient_name || order.customer_name || 'Guest Customer'}
                  </p>
                  <p className="text-zinc-400">{order.shipping_address.recipient_phone}</p>
                  <p className="text-zinc-400">{order.shipping_address.recipient_email}</p>
                </div>
                <div>
                  <span className="font-mono text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
                    Destination Address
                  </span>
                  <p className="text-zinc-300">{order.shipping_address.street_address}</p>
                  <p className="text-zinc-400">
                    {order.shipping_address.suburb ? `${order.shipping_address.suburb}, ` : ''}
                    {order.shipping_address.city}
                  </p>
                  <p className="text-zinc-400">
                    {order.shipping_address.province} {order.shipping_address.postal_code}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Purchased Items Card */}
          {order?.order_items && order.order_items.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
              <div className="flex items-center justify-between text-white font-bold text-sm">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-amber-500" />
                  <span>Garment Breakdown</span>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  {order.order_items.length} {order.order_items.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              <div className="divide-y divide-zinc-900">
                {order.order_items.map((item) => (
                  <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-medium text-white">{item.product_name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-mono text-amber-400 font-semibold">
                      R {Number(item.total_price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-900 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">R {Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Nationwide Courier Guy</span>
                  <span className="font-mono text-emerald-400">Included</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-zinc-900">
                  <span>Total Paid (incl. VAT)</span>
                  <span className="font-mono text-amber-400 text-base">R {Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Actions & Support */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Next Steps
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Visiting Cape Town? Experience the flagship barbershop or browse more streetwear drops.
            </p>

            <div className="space-y-3 pt-2">
              <Link
                href="/book"
                className="w-full flex items-center justify-between rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all"
              >
                <span>Book Barber Chair</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/shop"
                className="w-full flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all"
              >
                <span>Return to Shop</span>
              </Link>
            </div>
          </div>

          {/* Concierge & Support Card */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-zinc-300 font-bold">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              <span>Customer Concierge</span>
            </div>
            <p className="text-zinc-500 leading-relaxed text-[11px]">
              Need help with sizing or delivery updates? Connect with our flagship team directly.
            </p>
            <div className="space-y-1 font-mono text-[11px] text-zinc-400 pt-1">
              <div>WhatsApp: <a href="https://wa.me/27818082570" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">+27 81 808 2570</a></div>
              <div>Email: <a href="mailto:info@dissafyt.com" className="text-zinc-300 hover:underline">info@dissafyt.com</a></div>
              <div className="text-[10px] text-zinc-600 pt-1">Cape Town Flagship • Mon–Sat 09:00–18:00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-4xl px-4 py-20 text-center text-zinc-500 font-mono text-xs">
          Loading order confirmation...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
