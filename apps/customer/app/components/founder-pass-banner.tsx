'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Scissors,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  X,
  Phone,
  Mail,
  User,
  Flame,
  Building,
} from 'lucide-react';

export function FounderPassBanner() {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pledgeType, setPledgeType] = useState<'pay_now' | 'pledge_waitlist'>('pledge_waitlist');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initial simulated progress: 28 of 50 claimed
  const totalSpots = 50;
  const claimedSpots = 29;
  const totalCapitalTarget = 60000;
  const currentCapital = claimedSpots * 1200;
  const pctFunded = Math.round((currentCapital / totalCapitalTarget) * 100);

  async function handleSubmitPledge(e: React.FormEvent) {
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
        throw new Error(data.error || 'Failed to submit pledge');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 1. FOUNDER CAPITAL BUILDOUT BANNER */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/30 p-6 sm:p-10 shadow-2xl shadow-amber-500/10">
          {/* Ambient Gold Glow Backdrop */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Offer & Vision */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-[11px] font-mono font-black text-amber-400 uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Physical Barbershop Buildout // Invested Capital</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
                  1 Norwalk Way, Bernadino Heights
                </span>
              </div>

              <div>
                <h2 className="font-display text-3xl sm:text-5xl font-black uppercase text-white tracking-tight leading-[0.95]">
                  FOUNDER PASS: <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">R1,200 FOR 12 CUTS</span> PER YEAR
                </h2>
                <p className="text-sm sm:text-base font-semibold text-amber-300/90 mt-2 font-mono">
                  Only R100 Per Master Haircut &bull; Save Up to 45% &bull; Valid for 1 Full Year
                </p>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
                We are raising invested capital to physically build out our flagship barbershop and garment printing lab in Bernadino Heights. We are releasing <strong>only 50 Founder Passes</strong>: pay R1,200 upfront to fund our Belmont chairs and custom mirror stations, and lock in 1 fresh cut every month for a whole year.
              </p>

              {/* Perks Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="rounded-xl border border-zinc-800 bg-black/40 p-3 space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-amber-400" />
                    <span>12 Fresh Cuts</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    1 cut/month (R100/cut)
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-black/40 p-3 space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-400" />
                    <span>Founder Wall</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    Name engraved in studio
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-black/40 p-3 space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>VIP Streetwear</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    15% off all drops
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Capital Progress & CTA */}
            <div className="lg:col-span-5 space-y-5 rounded-2xl border border-amber-500/30 bg-black/60 p-6 backdrop-blur">
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    Physical Buildout Funding
                  </div>
                  <div className="font-display text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                    R {currentCapital.toLocaleString()}{' '}
                    <span className="text-zinc-500 text-sm font-normal">/ R {totalCapitalTarget.toLocaleString()}</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                  {pctFunded}% FUNDED
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 transition-all duration-700 shadow-lg shadow-orange-500/40"
                    style={{ width: `${pctFunded}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span><strong>{claimedSpots}</strong> of 50 Backers Secured</span>
                  <span className="text-amber-400 font-bold">{totalSpots - claimedSpots} Passes Remaining</span>
                </div>
              </div>

              {/* Call to Action Button */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>Claim Your Founder Pass (R1,200)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-center text-zinc-500 font-mono">
                  Instant PayFast reservation or pledge your spot before buildout commences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE FOUNDER PASS INTEREST / PLEDGE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                setModalOpen(false);
                setSubmitted(false);
                setErrorMsg(null);
              }}
              className="absolute top-5 right-5 text-zinc-500 hover:text-white p-1 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                    FOUNDER PATRON #{claimedSpots + 1} CONFIRMED
                  </span>
                  <h3 className="font-display text-2xl font-black uppercase text-white">
                    Welcome to the Founder Circle!
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Thank you <strong>{name}</strong>! Your pledge for the <strong>12-Cut Founder Pass (R1,200)</strong> has been secured. We have sent a confirmation email to <strong>{email}</strong> and will contact you directly on WhatsApp ({phone}) with construction milestones.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-left text-xs space-y-2">
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>Physical Studio:</span>
                    <span className="text-white font-bold">1 Norwalk Way, Bernadino Heights</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>Allocated Cuts:</span>
                    <span className="text-emerald-400 font-bold">12 Master Haircuts (1 Year)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400 font-mono">
                    <span>Status:</span>
                    <span className="text-amber-400 font-bold">Pledged Backer</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      setSubmitted(false);
                    }}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Done & Return to Homepage
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitPledge} className="space-y-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Founder Circle &bull; 50 Spots Only
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-black uppercase text-white mt-1">
                    Reserve Your Founder Pass
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Secure 12 Master Cuts for R1,200 (R100/cut) and directly fund the physical barbershop buildout in Bernadino Heights.
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-500" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chad Johnson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        <span>Email Address</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <span>WhatsApp Number</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="082 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Pledge Mode Selector */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-zinc-300 block">
                      Investment Preference:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPledgeType('pledge_waitlist')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          pledgeType === 'pledge_waitlist'
                            ? 'border-amber-500 bg-amber-500/10 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="font-bold text-xs">Pledge Interest Spot</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Pay upon shop buildout commencement</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPledgeType('pay_now')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          pledgeType === 'pay_now'
                            ? 'border-amber-500 bg-amber-500/10 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="font-bold text-xs text-amber-400">Ready to Pay R1,200 Now</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Immediate capital commitment via PayFast</div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300 block">
                      Message / Notes for Founder (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Excited for the new shop in Bernie!"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                    {errorMsg}
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Submitting Pledge...' : pledgeType === 'pay_now' ? 'Proceed to Pay R1,200 Founder Pass' : 'Confirm Free Founder Spot Pledge'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
