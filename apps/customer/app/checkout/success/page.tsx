'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Package, Truck, MessageSquare, ArrowRight, ShoppingBag, ShieldCheck, Store, MapPin } from 'lucide-react';
import { useCart } from '../../context/cart-context';

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
  fulfillment_choice?: 'courier' | 'studio_collection' | string;
  collection_location_id?: string;
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
  const { clearCart } = useCart();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear cart immediately upon successful checkout redirect
    clearCart();

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

  const isFounderPass = searchParams.get('type') === 'founder_pass' || Boolean(searchParams.get('pass_id'));
  const passNumber = searchParams.get('pass_number') || 'FP-FOUNDER';

  if (isFounderPass) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-20 text-center space-y-8">
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-[#ff5500]/15 border-2 border-[#ff5500]/40 text-[#ff5500] shadow-lg shadow-[#ff5500]/20">
          <CheckCircle2 className="h-12 w-12 text-[#ff5500] stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono tracking-widest text-[#ff5500] uppercase font-bold bg-[#ff5500]/10 border border-[#ff5500]/30 px-3 py-1 rounded-full">
            ✦ FOUNDER PATRON CIRCLE ACTIVATED ✦
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white tracking-tight pt-2">
            Welcome to the Founder's Circle!
          </h1>
          <p className="text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Your <strong>R1,200</strong> payment was successfully confirmed via PayFast. Your investment has been directly contributed to the physical buildout of our flagship studio at <strong>1 Norwalk Way, Bernadino Heights</strong>.
          </p>
        </div>

        {/* 3D Card Summary Box */}
        <div className="max-w-md mx-auto rounded-2xl border-2 border-[#ff5500]/50 bg-gradient-to-br from-zinc-950 via-[#181512] to-zinc-950 p-6 text-left space-y-4 shadow-2xl shadow-[#ff5500]/15">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#ff5500] font-black">
              FOUNDER'S PASS
            </span>
            <span className="font-mono text-xs font-bold bg-zinc-900 border border-zinc-700 px-2.5 py-0.5 rounded text-white">
              #{passNumber}
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">Total Cuts Entitled:</span>
              <span className="text-white font-bold">12 Master Haircuts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Balance Available Today:</span>
              <span className="text-emerald-400 font-black">12 / 12 Cuts Ready</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Validity:</span>
              <span className="text-white font-bold">1 Full Year (365 Days)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Physical Studio Plaque:</span>
              <span className="text-amber-400 font-bold">Name Laser-Engraved</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Streetwear Drop Perk:</span>
              <span className="text-[#ff5500] font-bold">15% Lifetime Discount</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/book"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#ff5500] to-amber-500 hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#ff5500]/20 flex items-center justify-center gap-2"
          >
            <span>Book Your First Haircut (R0.00)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-300 font-mono text-xs transition-all"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isPreorder = searchParams.get('type') === 'preorder';

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-20">
      {/* Hero Confirmation Banner */}
      <div className="text-center space-y-4 mb-12">
        <div className={`inline-flex h-20 w-20 items-center justify-center rounded-full border-2 mb-2 ${
          isPreorder
            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          <CheckCircle2 className={`h-10 w-10 stroke-[2.5] ${isPreorder ? 'text-orange-400' : 'text-amber-500'}`} />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-mono tracking-widest text-amber-500 uppercase font-bold">
            {isPreorder ? 'BATCH 01 SPOT SECURED // R0.00 DOWN' : 'PAYMENT CONFIRMED // DISPATCH QUEUED'}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
            {isPreorder ? 'Pre-Order Reserved' : 'Order Confirmed'}
          </h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            {isPreorder
              ? 'Your spot in Batch 01 has been locked into the Cape Town Garment Lab queue. We will notify you via WhatsApp & email with your PayFast settlement link prior to print dispatch.'
              : 'Your Cape Town streetwear order has been secured and logged into the fulfillment queue.'}
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
          {/* Dispatch / Collection Notice Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 space-y-4">
            {order?.fulfillment_choice === 'studio_collection' ? (
              <>
                <div className="flex items-center space-x-3 text-white font-bold text-base">
                  <Store className="h-5 w-5 text-amber-500" />
                  <span>Flagship Studio Collection</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your garments are prepared at our Cape Town flagship studio. We will send you an automated SMS and email notification as soon as your order is packaged and ready for in-person collection.
                </p>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2 text-xs">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>Flagship Studio Collection Point</span>
                  </div>
                  <div className="text-white font-medium">
                    Dissafyt Studio &bull; 1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570
                  </div>
                  <div className="text-zinc-400 text-[11px]">
                    Operating Hours: Mon – Sat 08:30 – 18:00 &bull; Sun 09:00 – 14:00
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-mono text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
                      Collector
                    </span>
                    <p className="text-white font-semibold">
                      {order.shipping_address?.recipient_name || order.customer_name || 'Collector'}
                    </p>
                    <p className="text-zinc-400">{order.shipping_address?.recipient_phone}</p>
                    <p className="text-zinc-400">{order.shipping_address?.recipient_email || order.customer_email}</p>
                  </div>
                  <div>
                    <span className="font-mono text-zinc-500 uppercase tracking-wider block text-[10px] mb-1">
                      Collection Instructions
                    </span>
                    <p className="text-zinc-300">
                      Present your order reference #{orderNumber || order.order_number} upon arrival at studio reception.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3 text-white font-bold text-base">
                  <Truck className="h-5 w-5 text-amber-500" />
                  <span>Door-to-Door Courier Delivery</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Garments are prepped at our Cape Town studio and dispatched directly to your door via express courier. You will receive automated SMS and email updates once your parcel is out for delivery.
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
              </>
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
                  <span>Fulfillment</span>
                  <span className="font-mono text-emerald-400">
                    {order.fulfillment_choice === 'studio_collection' ? 'Free Studio Collection' : 'Door-to-Door Courier (Included)'}
                  </span>
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
