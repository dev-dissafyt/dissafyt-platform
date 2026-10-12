'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Tag,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Share2,
  Lock,
  Layers,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';

interface SurveyProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  is_preorder?: boolean;
  preorder_message?: string;
  priceOptions: {
    tier: string;
    label: string;
    price: number;
  }[];
}

export default function PricingSurveyPage() {
  const [products, setProducts] = useState<SurveyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  // Form State
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [respondentPhone, setRespondentPhone] = useState('');
  const [generalFeedback, setGeneralFeedback] = useState('');

  // Selected votes: { [productId]: { tier: string, price: number, notes?: string } }
  const [votes, setVotes] = useState<
    Record<string, { tier: string; price: number; notes?: string }>
  >({});

  useEffect(() => {
    async function loadSurvey() {
      try {
        const res = await fetch('/api/survey');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
          // Initialize empty votes map
          const initialVotes: Record<
            string,
            { tier: string; price: number; notes?: string }
          > = {};
          data.forEach((p: SurveyProduct) => {
            // Default to empty selection so customer explicitly chooses
            initialVotes[p.id] = { tier: '', price: 0, notes: '' };
          });
          setVotes(initialVotes);
        } else {
          setErrorMsg('Failed to load catalogue. Please refresh.');
        }
      } catch (err: any) {
        setErrorMsg('Network error loading survey.');
      } finally {
        setLoading(false);
      }
    }
    loadSurvey();
  }, []);

  function handleSelectPrice(productId: string, tierKey: string) {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const opt = prod.priceOptions.find((o) => o.tier === tierKey);
    const price = opt ? opt.price : 0;

    setVotes((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        tier: tierKey,
        price,
      },
    }));
  }

  function handleNoteChange(productId: string, note: string) {
    setVotes((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { tier: '', price: 0 }),
        notes: note,
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    // Format valid votes (only those with a selected tier)
    const validVotes = Object.entries(votes)
      .filter(([_, v]) => v.tier && v.tier !== '')
      .map(([productId, v]) => ({
        product_id: productId,
        selected_price: v.price,
        tier_selected: v.tier,
        notes: v.notes || undefined,
      }));

    if (validVotes.length === 0) {
      setErrorMsg('Please select a price vote for at least one garment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent_name: respondentName,
          respondent_email: respondentEmail,
          respondent_phone: respondentPhone,
          general_feedback: generalFeedback,
          source: 'web_survey',
          votes: validVotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit response.');
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const votedCount = Object.values(votes).filter((v) => v.tier !== '').length;

  function copySurveyUrl() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  function copyVoucherCode() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText('firstbuy26');
      setCopiedVoucher(true);
      setTimeout(() => setCopiedVoucher(false), 2500);
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-black">
      {/* Top Bar */}
      <header className="border-b border-stone-800 bg-stone-900/60 backdrop-blur sticky top-0 z-30">
        <div className="container mx-auto max-w-5xl px-4 py-3.5 flex items-center justify-between">
          <Link
            href="/shop"
            className="flex items-center text-xs font-mono text-stone-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Storefront
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              COMMUNITY PRICING ADVISORY
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12 space-y-10">
        {/* Hero Section */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 text-xs font-mono tracking-widest text-stone-400 uppercase">
            <span>DISSAFYT APPAREL LAB</span>
            <span>&bull;</span>
            <span className="text-amber-400 font-bold">PRE-RELEASE VOTE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none">
            Help Us Set the Drop Price
          </h1>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Before we begin bulk blank production and screenprinting for our upcoming drops, we want to know what feels fair to our community. Review the pieces below and select what you would comfortably pay for each garment.
          </p>

          <div className="p-4 rounded-xl border border-stone-800 bg-stone-900/40 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-stone-300 leading-relaxed">
              <strong className="text-amber-300 font-semibold block mb-0.5">
                Priority VIP Access + R20 Voucher
              </strong>
              Submitting your honest feedback guarantees early access before the public drop sells out, plus an exclusive R20 discount voucher (<code className="text-amber-400 font-mono font-bold">firstbuy26</code>) sent to your email.
            </div>
          </div>
        </div>

        {/* Success Confirmation State */}
        {submitted ? (
          <div className="rounded-2xl border border-amber-500/40 bg-stone-900/80 p-8 sm:p-12 text-center space-y-6 shadow-2xl backdrop-blur">
            <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                Feedback Recorded!
              </h2>
              <p className="text-stone-300 text-sm leading-relaxed">
                Thank you for voting on our upcoming catalogue. Your responses have been added to our pricing advisory ledger to determine the official release prices.
              </p>
            </div>

            {/* Exclusive Promo Voucher Card */}
            <div className="max-w-md mx-auto p-5 sm:p-6 rounded-2xl border-2 border-dashed border-amber-500/70 bg-stone-950/90 space-y-4 shadow-2xl text-left">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Exclusive Reward Voucher
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                  R 20.00 OFF
                </span>
              </div>

              <div className="py-3 text-center bg-black/80 rounded-xl border border-stone-800">
                <div className="text-[10px] uppercase font-mono tracking-widest text-stone-500 mb-1">PROMO CODE</div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-amber-400 select-all">
                  firstbuy26
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyVoucherCode}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/10"
                >
                  {copiedVoucher ? (
                    <>
                      <Check className="h-4 w-4" /> Copied firstbuy26!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy Promo Code
                    </>
                  )}
                </button>
                <Link
                  href="/checkout?promo=firstbuy26"
                  className="inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-lg border border-amber-500/40 text-amber-300 hover:text-white hover:bg-amber-500/10 text-xs font-semibold transition-colors"
                >
                  Redeem &rarr;
                </Link>
              </div>

              <p className="text-[11px] text-stone-400 text-center leading-relaxed">
                {respondentEmail ? (
                  <>We have dispatched your voucher to <strong className="text-stone-200">{respondentEmail}</strong>.</>
                ) : (
                  <>Apply code <strong className="text-white">firstbuy26</strong> during checkout for R20.00 off.</>
                )}
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-xl border border-stone-800 bg-stone-950/80 space-y-2 text-left">
              <div className="text-[11px] font-mono uppercase text-amber-400 font-bold">
                Your VIP Registration:
              </div>
              <div className="text-xs text-stone-300">
                {respondentEmail ? (
                  <span>
                    Linked to: <strong className="text-white">{respondentEmail}</strong>
                  </span>
                ) : (
                  <span>Anonymous submission recorded</span>
                )}
              </div>
              <p className="text-[11px] text-stone-400">
                You will receive a notification link as soon as Batch 01 goes live!
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={copySurveyUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-stone-700 bg-stone-800 text-stone-200 text-xs font-semibold hover:bg-stone-700 hover:text-white transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" /> Copied Survey Link!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 text-amber-400" /> Share Survey with Friends
                  </>
                )}
              </button>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors"
              >
                View Live Shop <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="py-20 text-center space-y-3 text-stone-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <p className="font-mono text-xs">Loading catalogue pieces...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-stone-800 bg-stone-900/40 text-stone-400 space-y-3">
            <Layers className="mx-auto h-8 w-8 text-stone-600" />
            <p>No active garments available for review right now.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Progress indicator */}
            <div className="sticky top-14 z-20 py-2.5 px-4 rounded-xl border border-stone-800/80 bg-stone-900/90 backdrop-blur flex items-center justify-between text-xs">
              <span className="text-stone-300 font-mono">
                Progress:{' '}
                <strong className="text-amber-400">
                  {votedCount} of {products.length}
                </strong>{' '}
                voted
              </span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-stone-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{
                      width: `${(votedCount / products.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="font-mono text-[11px] text-stone-400">
                  {Math.round((votedCount / products.length) * 100)}%
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl border border-red-500/40 bg-red-950/40 text-red-300 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Product Cards Grid */}
            <div className="space-y-8">
              {products.map((product, idx) => {
                const currentVote = votes[product.id] || { tier: '', price: 0, notes: '' };
                const hasVoted = Boolean(currentVote.tier);

                return (
                  <div
                    key={product.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      hasVoted
                        ? 'border-amber-500/50 bg-stone-900/70 shadow-lg shadow-black/40'
                        : 'border-stone-800 bg-stone-900/40 hover:border-stone-700'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 sm:p-7">
                      {/* Product Image Column */}
                      <div className="md:col-span-4 flex flex-col justify-between">
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-950 border border-stone-800">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-stone-600 font-mono text-xs">
                              [Catalogue Image]
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5">
                            <span className="rounded bg-black/80 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-stone-300 border border-stone-700">
                              Item #{idx + 1}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Product Information & Voting Form */}
                      <div className="md:col-span-8 flex flex-col justify-between space-y-5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white">
                              {product.name}
                            </h3>
                            {hasVoted && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3" /> Voted
                              </span>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed line-clamp-3">
                              {product.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-stone-400">
                            <span className="px-2 py-0.5 rounded bg-stone-800/80 border border-stone-700/60">
                              300 GSM Heavyweight
                            </span>
                            <span className="px-2 py-0.5 rounded bg-stone-800/80 border border-stone-700/60">
                              Direct-to-Garment / Screenprint
                            </span>
                          </div>
                        </div>

                        {/* Interactive Price Dropdown */}
                        <div className="pt-3 border-t border-stone-800/80 space-y-3">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                            What are you willing to pay for this piece? *
                          </label>

                          <div className="relative">
                            <select
                              value={currentVote.tier}
                              onChange={(e) => handleSelectPrice(product.id, e.target.value)}
                              className="w-full appearance-none rounded-xl border border-stone-700 bg-stone-950 px-4 py-3.5 text-sm font-semibold text-white transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                            >
                              <option value="" disabled>
                                — Select what you'd pay —
                              </option>
                              {product.priceOptions.map((opt) => (
                                <option key={opt.tier} value={opt.tier} className="bg-stone-900 py-2">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-400">
                              <ChevronRight className="h-4 w-4 rotate-90" />
                            </div>
                          </div>

                          {/* Quick selection pill buttons for fast mobile voting */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {product.priceOptions.map((opt) => {
                              const isSelected = currentVote.tier === opt.tier;
                              return (
                                <button
                                  key={opt.tier}
                                  type="button"
                                  onClick={() => handleSelectPrice(product.id, opt.tier)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                                    isSelected
                                      ? 'bg-amber-500 text-black font-bold shadow-sm'
                                      : 'bg-stone-800/60 text-stone-300 hover:bg-stone-800 border border-stone-700/60'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Optional sizing or styling feedback note */}
                          <div className="pt-2">
                            <input
                              type="text"
                              value={currentVote.notes || ''}
                              onChange={(e) => handleNoteChange(product.id, e.target.value)}
                              placeholder="Any specific comments on this garment? (e.g. want oversized fit, neutral colors...)"
                              className="w-full rounded-lg border border-stone-800 bg-stone-950/60 px-3.5 py-2 text-xs text-stone-200 placeholder-stone-500 focus:border-stone-600 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Respondent Contact Card & General Feedback */}
            <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-6 sm:p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Claim Priority VIP Access & R20 Voucher
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Enter your details below to receive your confirmation, early drop access link, and your R20 discount voucher (<span className="text-amber-400 font-mono font-bold">firstbuy26</span>).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-stone-300">Your Full Name</label>
                  <input
                    type="text"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="e.g. Sipho Ndlovu"
                    className="w-full rounded-lg border border-stone-800 bg-stone-950 px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-stone-300">
                    Email Address <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={respondentEmail}
                    onChange={(e) => setRespondentEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full rounded-lg border border-stone-800 bg-stone-950 px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-stone-300">
                    WhatsApp Number (Optional for Drop Alerts)
                  </label>
                  <input
                    type="tel"
                    value={respondentPhone}
                    onChange={(e) => setRespondentPhone(e.target.value)}
                    placeholder="e.g. 082 123 4567"
                    className="w-full rounded-lg border border-stone-800 bg-stone-950 px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-stone-300">
                    Style Wishlist / General Comments
                  </label>
                  <input
                    type="text"
                    value={generalFeedback}
                    onChange={(e) => setGeneralFeedback(e.target.value)}
                    placeholder="What other pieces do you want to see? (e.g. caps, trackpants, vests)"
                    className="w-full rounded-lg border border-stone-800 bg-stone-950 px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-stone-500" />
                  Your pricing input is confidential and sets the inaugural drop prices.
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {submitting ? 'Recording Responses...' : 'Submit Pricing Feedback & Unlock VIP'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
