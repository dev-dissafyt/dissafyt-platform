'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Scissors,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Flame,
  User,
  Mail,
  Phone,
  Building,
  Award,
} from 'lucide-react';

interface PurchaseClientProps {
  pricePerPass: number;
  totalCuts: number;
  totalSpots: number;
  stats: {
    totalSpots: number;
    claimedSpots: number;
    totalCapitalTarget: number;
    currentCapital: number;
    pctFunded: number;
    remainingSpots: number;
  };
}

export function FounderPassPurchaseClient({
  pricePerPass,
  totalCuts,
  totalSpots,
  stats,
}: PurchaseClientProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pledgeType, setPledgeType] = useState<'pay_now' | 'pledge_waitlist'>('pay_now');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const claimed = stats?.claimedSpots || 0;
  const remaining = Math.max(0, totalSpots - claimed);
  const pct = Math.min(100, Math.round((claimed / (totalSpots || 1)) * 100));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please provide your WhatsApp or phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/founders-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          pledgeType,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit founder pass request');
      }

      if (pledgeType === 'pay_now' && data.payfast) {
        // Build and auto-submit PayFast form
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
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border-2 border-[#ff5500]/60 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-6 sm:p-8 shadow-[0_0_50px_rgba(255,85,0,0.15)] relative">
      {/* Decorative Corner Accents */}
      <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#ff5500]" />
      <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#ff5500]" />
      <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#ff5500]" />
      <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#ff5500]" />

      {/* Allocation Progress Tracker */}
      <div className="space-y-3 pb-6 border-b border-zinc-900">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#ff5500] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4" />
            <span>Allocation Pool</span>
          </span>
          <span className="text-zinc-400">
            <strong className="text-white">{claimed}</strong> / {totalSpots} spots claimed
          </span>
        </div>

        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-[#ff5500] via-amber-500 to-[#ff7700] rounded-full"
            style={{ width: `${Math.max(8, pct)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400">
          <span>{pct}% Allocation Funded</span>
          <span className="text-amber-400 font-bold">{remaining} Spots Remaining</span>
        </div>
      </div>

      {/* Pricing Showcase Card */}
      <div className="py-5 space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-mono text-zinc-400 uppercase">Upfront Patron Pass</span>
          <div className="text-3xl font-black text-white font-mono">
            R {pricePerPass.toFixed(0)}{' '}
            <span className="text-xs font-normal text-zinc-400">ZAR</span>
          </div>
        </div>
        <div className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
          <Scissors className="w-3.5 h-3.5" />
          <span>Includes {totalCuts} Master Cuts (R{(pricePerPass / totalCuts).toFixed(0)}/cut) &bull; 1 Year</span>
        </div>
      </div>

      {submitted ? (
        <div className="py-8 space-y-4 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-display text-xl font-bold uppercase text-white">
            Spot Reserved!
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto">
            Thank you, <strong>{name}</strong>. Your founding patron reservation has been recorded. Our team will reach out via WhatsApp at <strong>{phone}</strong> with confirmation details.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setName('');
              setEmail('');
              setPhone('');
            }}
            className="text-xs font-mono text-[#ff5500] hover:underline"
          >
            ← Register another patron
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-zinc-400 uppercase flex items-center gap-1">
              <User className="w-3 h-3 text-zinc-500" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chad Peterson"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#ff5500]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-zinc-400 uppercase flex items-center gap-1">
              <Mail className="w-3 h-3 text-zinc-500" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patron@dissafyt.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#ff5500]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-zinc-400 uppercase flex items-center gap-1">
              <Phone className="w-3 h-3 text-zinc-500" />
              <span>WhatsApp / Contact Number</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+27 82 123 4567"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#ff5500]"
              required
            />
          </div>

          {/* Payment Selection Mode */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-mono text-zinc-400 uppercase block">
              Commitment Option
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPledgeType('pay_now')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  pledgeType === 'pay_now'
                    ? 'border-[#ff5500] bg-[#ff5500]/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-bold font-mono">Pay Now (R{pricePerPass})</div>
                <div className="text-[10px] text-zinc-400">Immediate pass activation</div>
              </button>

              <button
                type="button"
                onClick={() => setPledgeType('pledge_waitlist')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  pledgeType === 'pledge_waitlist'
                    ? 'border-[#ff5500] bg-[#ff5500]/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-bold font-mono">Pledge Spot (R0)</div>
                <div className="text-[10px] text-zinc-400">Settle at launch</div>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff5500] via-amber-500 to-[#ff7700] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl shadow-[#ff5500]/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>
                {loading
                  ? 'Processing...'
                  : pledgeType === 'pay_now'
                  ? `Pay R${pricePerPass} & Activate Pass`
                  : 'Reserve Founding Spot'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center space-x-4 text-[10px] font-mono text-zinc-500 text-center">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>PayFast 256-Bit SSL</span>
            </span>
            <span>&bull;</span>
            <span>Zero Booking Fees</span>
          </div>
        </form>
      )}
    </div>
  );
}
