'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardTitle, CardContent, Button } from '@dissafyt/ui';
import { CreditCard, ShieldCheck, Scissors, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

function PayContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const orderId = searchParams.get('order_id');
  const initialAmount = searchParams.get('amount') || '120.00';
  const initialItem = searchParams.get('item') || 'Ace of Fyt Haircut';
  const phone = searchParams.get('phone') || '';
  const name = searchParams.get('name') || '';
  const isCancelled = searchParams.get('cancelled') === '1';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    async function loadPaymentPayload() {
      try {
        const res = await fetch('/api/payments/payfast-payload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: bookingId,
            order_id: orderId,
            amount: initialAmount,
            item_name: initialItem,
            customer_name: name,
            customer_phone: phone,
          }),
        });

        const data = await res.json();
        if (res.ok && data.payfast) {
          setPaymentData(data);
        } else {
          setErrorMsg(data.error || 'Failed to initialize payment details.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Network error loading payment.');
      } finally {
        setLoading(false);
      }
    }

    loadPaymentPayload();
  }, [bookingId, orderId, initialAmount, initialItem, name, phone]);

  function handleProceed() {
    if (!paymentData?.payfast) return;
    setSubmitting(true);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.payfast.action;

    for (const [key, value] of Object.entries(paymentData.payfast.fields)) {
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
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-16 sm:py-24">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dissafyt
        </Link>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/90 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-zinc-800 px-3 py-1 text-[11px] font-mono text-amber-400">
            <Lock className="h-3 w-3" />
            <span>DISSAFYT SECURE PAY-ME</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-white uppercase">
            Complete Payment
          </h1>
          <p className="text-xs text-zinc-400">
            Powered by PayFast (Visa, Mastercard, Instant EFT, SnapScan, Masterpass)
          </p>
        </div>

        {isCancelled && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>Previous payment attempt was cancelled. You can retry below.</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">
            <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Securing payment link...
          </div>
        ) : errorMsg ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            {errorMsg}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 uppercase tracking-wider">Item / Service</span>
                <span className="font-semibold text-white">{paymentData.itemName}</span>
              </div>
              {bookingId && (
                <div className="flex justify-between items-center text-xs border-t border-zinc-800/80 pt-2">
                  <span className="text-zinc-400 uppercase tracking-wider">Reference</span>
                  <span className="font-mono text-zinc-300">{bookingId.slice(0, 8)}...</span>
                </div>
              )}
              <div className="flex justify-between items-baseline border-t border-zinc-800/80 pt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Amount Due</span>
                <span className="font-display text-3xl font-black text-amber-400">
                  R {Number(paymentData.amount).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              onClick={handleProceed}
              disabled={submitting}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20"
            >
              {submitting ? 'Connecting to PayFast...' : `Pay R ${Number(paymentData.amount).toFixed(2)} with PayFast`}
            </Button>

            <div className="pt-2 border-t border-zinc-800 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>256-bit encrypted checkout via PayFast South Africa</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">
                Dissafyt Studio Cape Town • Ace of Fyt Guild
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-lg p-12 text-center text-sm text-zinc-500">Loading payment portal...</div>}>
      <PayContent />
    </Suspense>
  );
}
