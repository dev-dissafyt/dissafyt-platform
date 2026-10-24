'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@dissafyt/ui';
import { Sparkles, CheckCircle2, Lock, ShieldCheck, Truck, ArrowLeft, Clock, Store, AlertCircle } from 'lucide-react';

export default function PreorderPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderNumber = searchParams.get('order');
  const token = searchParams.get('token');
  const cancelled = searchParams.get('cancelled');

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [settlementOption, setSettlementOption] = useState<'full' | 'deposit_50'>('full');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) {
        setErrorMsg('Missing order reference.');
        setLoading(false);
        return;
      }

      try {
        const query = new URLSearchParams({
          order: orderNumber,
          ...(token ? { token } : {}),
        });
        const res = await fetch(`/api/orders/batch-settle?${query.toString()}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load order.');
        }

        const data = await res.json();
        setOrderData(data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Unable to retrieve order details.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderNumber, token]);

  async function handleSettlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/orders/batch-settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          token,
          settlementOption,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.payfast) {
        throw new Error(data.error || 'Failed to initialize payment.');
      }

      // Submit PayFast form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.payfast.action;

      for (const [key, value] of Object.entries(data.payfast.fields)) {
        if (value !== undefined && value !== null) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initiation failed.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20 text-center text-zinc-400">
        Loading batch settlement details...
      </div>
    );
  }

  if (errorMsg && !orderData) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 space-y-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="text-2xl font-bold text-white">Order Lookup Failed</h1>
        <p className="text-sm text-zinc-400">{errorMsg}</p>
        <Link href="/shop">
          <Button variant="outline" className="border-zinc-800 text-zinc-300">
            Return to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const { order, total, depositAmount, isAlreadyPaid } = orderData;
  const currentPayable = settlementOption === 'deposit_50' ? depositAmount : total;
  const balanceRemaining = settlementOption === 'deposit_50' ? Math.max(0, total - depositAmount) : 0;

  if (isAlreadyPaid) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Order Fully Settled
          </h1>
          <p className="text-sm text-zinc-400">
            Order <strong className="text-white font-mono">#{order.order_number}</strong> is fully paid and queued for printing & packaging.
          </p>
        </div>
        <Link href="/account">
          <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
            View in My Account
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12 space-y-8">
      <Link href="/shop" className="inline-flex items-center text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Catalog
      </Link>

      {cancelled && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
          Your payment was cancelled. Your batch reservation remains saved. You can complete settlement below whenever you are ready.
        </div>
      )}

      {/* Hero Announcement */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-zinc-900/60 to-zinc-950 p-6 sm:p-8 space-y-3">
        <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-mono font-bold uppercase text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Batch Goal Reached &bull; Factory Ready</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Settle Your Drop Pre-Order
        </h1>
        <p className="text-sm text-zinc-300 max-w-xl leading-relaxed">
          The batch target for your reserved drop garments has been unlocked! Choose how you would like to settle your order to begin custom manufacturing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settlement Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
            <h2 className="text-lg font-bold text-white">Select Settlement Plan</h2>

            <div className="space-y-3">
              {/* Option 1: 100% Full Payment */}
              <div
                onClick={() => setSettlementOption('full')}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  settlementOption === 'full'
                    ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>100% Full Settlement (Recommended)</span>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        Priority Dispatch
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Pays the full balance today. Your order dispatches immediately upon completion with zero remaining balance.
                    </p>
                  </div>
                  <div className="text-right pl-4">
                    <span className="font-mono text-base font-black text-amber-400">
                      R {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Option 2: 50% Production Deposit */}
              <div
                onClick={() => setSettlementOption('deposit_50')}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  settlementOption === 'deposit_50'
                    ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/50'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">
                      50% Production Deposit
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Pay 50% now to unlock printing. The remaining R {depositAmount.toFixed(2)} is payable before courier dispatch or upon studio collection.
                    </p>
                  </div>
                  <div className="text-right pl-4">
                    <span className="font-mono text-base font-black text-amber-400">
                      R {depositAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <Button
              type="button"
              onClick={handleSettlePayment}
              disabled={submitting}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold h-12 text-base shadow-lg shadow-amber-500/10"
            >
              {submitting ? (
                'Connecting to PayFast...'
              ) : (
                <span className="flex items-center justify-center">
                  <Lock className="mr-2 h-4 w-4" /> Settle with PayFast &bull; R {currentPayable.toFixed(2)}
                </span>
              )}
            </Button>

            <div className="flex items-center justify-center space-x-2 text-xs text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>256-bit Encrypted PayFast &bull; Instant Confirmation</span>
            </div>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-900/60 p-5 space-y-4 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-xs border-b border-zinc-800 pb-2">
              Reserved Garments
            </h3>

            <div className="space-y-3">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-medium text-white">{item.product_name}</div>
                    <div className="text-zinc-500">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-mono text-zinc-300">
                    R {Number(item.total_price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-3 space-y-1.5 text-zinc-400">
              <div className="flex justify-between">
                <span>Total Garment Value</span>
                <span className="font-mono text-white">R {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fulfillment</span>
                <span className="text-zinc-300">
                  {order.fulfillment_choice === 'studio_collection'
                    ? 'Free Studio Pickup'
                    : 'The Courier Guy (Separate Link)'}
                </span>
              </div>
              {order.fulfillment_choice !== 'studio_collection' && (
                <div className="text-[10px] text-zinc-500 text-right -mt-0.5">
                  * Courier fee worked out on The Courier Guy platform &amp; billed separately
                </div>
              )}
              {settlementOption === 'deposit_50' && (
                <div className="flex justify-between text-amber-400 font-mono text-[11px] pt-1">
                  <span>Balance Due Later</span>
                  <span>R {balanceRemaining.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-zinc-800">
                <span>Amount Due Today</span>
                <span className="text-amber-400 font-mono">R {currentPayable.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
