'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
  ChevronDown,
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

  // 3D Graphic Card Interactive Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  // Live stats from database
  const [stats, setStats] = useState({
    totalSpots: 50,
    claimedSpots: 0,
    remainingSpots: 50,
    pricePerPass: 1200,
    totalCuts: 12,
  });

  const { totalSpots, claimedSpots, remainingSpots } = stats;

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.setProperty('--shine-x', '50%');
      cardRef.current.style.setProperty('--shine-y', '50%');
    }

    async function loadStats() {
      try {
        const res = await fetch('/api/founders-pass');
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.warn('Failed to load live founder pass stats:', err);
      }
    }
    loadStats();
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current || !sceneRef.current) return;
    const card = cardRef.current;
    const scene = sceneRef.current;

    // Update holographic shine coords
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--shine-x', `${x}%`);
    card.style.setProperty('--shine-y', `${y}%`);

    // 3D Perspective Tilt calculation
    const sceneRect = scene.getBoundingClientRect();
    const centerX = sceneRect.left + sceneRect.width / 2;
    const centerY = sceneRect.top + sceneRect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const maxTilt = 12; // max rotation degrees
    const rotateY = (deltaX / (sceneRect.width / 2)) * maxTilt;
    const rotateX = -(deltaY / (sceneRect.height / 2)) * maxTilt;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!cardRef.current || !sceneRef.current || e.touches.length === 0) return;
    const card = cardRef.current;
    const scene = sceneRef.current;
    const t = e.touches[0];

    const rect = card.getBoundingClientRect();
    const x = ((t.clientX - rect.left) / rect.width) * 100;
    const y = ((t.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--shine-x', `${x}%`);
    card.style.setProperty('--shine-y', `${y}%`);

    const sceneRect = scene.getBoundingClientRect();
    const centerX = sceneRect.left + sceneRect.width / 2;
    const centerY = sceneRect.top + sceneRect.height / 2;
    const deltaX = t.clientX - centerX;
    const deltaY = t.clientY - centerY;
    const maxTilt = 12;
    const rotateY = (deltaX / (sceneRect.width / 2)) * maxTilt;
    const rotateX = -(deltaY / (sceneRect.height / 2)) * maxTilt;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  function resetTilt() {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
    cardRef.current.style.setProperty('--shine-x', '50%');
    cardRef.current.style.setProperty('--shine-y', '50%');
  }

  function handleMouseEnter() {
    cardRef.current?.classList.add('card--active');
  }

  function handleMouseLeave() {
    cardRef.current?.classList.remove('card--active');
    resetTilt();
  }

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

      if (pledgeType === 'pay_now' && data.payfast) {
        // Dynamically create and submit PayFast form for live R1,200 payment
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
    <>
      {/* ============================================================== */}
      {/* 1. FOUNDER PASS HERO LANDING CONTAINER (~85-90vh)             */}
      {/* ============================================================== */}
      <section id="founders-pass" className="relative min-h-[85vh] lg:h-[88vh] flex flex-col justify-between container mx-auto max-w-7xl px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        {/* The Grand Hero Div with Glowing Voltage Orange Outline Stroke */}
        <div className="relative flex-1 flex flex-col justify-between rounded-3xl border-2 border-[#ff5500]/60 p-6 sm:p-8 lg:p-10 overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-black shadow-[0_0_60px_rgba(255,85,0,0.18),inset_0_0_40px_rgba(255,85,0,0.06)]">
          {/* Architectural Tech Corner Accent Crosshairs */}
          <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-[#ff5500] pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-[#ff5500] pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-[#ff5500] pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-[#ff5500] pointer-events-none" />

          {/* Dot Grid Background */}
          <div className="bg-grid" />

          {/* Ambient Radiant Orange Glow Orbs */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#ff5500]/15 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#ff5500]/10 blur-[140px] rounded-full pointer-events-none" />

          {/* Top Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900/80 pb-4 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 rounded-full bg-[#ff5500]/20 border border-[#ff5500]/50 px-3 py-1 text-[11px] font-mono font-black text-[#ff5500] uppercase tracking-wider shadow-sm shadow-[#ff5500]/20">
                <Flame className="w-3.5 h-3.5 text-[#ff5500] fill-[#ff5500] animate-pulse" />
                <span>Physical Barbershop Buildout // Flagship Studio</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800">
                1 Norwalk Way, Bernadino Heights, Cape Town
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                EXCLUSIVE ALLOCATION &bull; {totalSpots} FOUNDER PASSES ONLY
              </span>
              <Link
                href="/founders-pass"
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700 hover:border-[#ff5500] text-zinc-200 hover:text-white text-[10px] font-mono transition-all group"
              >
                <span>Read More</span>
                <ArrowRight className="w-3 h-3 text-[#ff5500] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Main 2-Column Content Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1 my-auto py-4 relative z-10">
            {/* Left Column: Vision, Perks & Funding Progress */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight leading-[0.92]">
                  FOUNDER PASS: <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5500] via-amber-400 to-[#ff7700]">R{(stats.pricePerPass || 1200).toLocaleString('en-ZA')} FOR {stats.totalCuts || 12} CUTS</span> PER YEAR
                </h1>
                <p className="text-sm sm:text-base font-bold text-amber-300/90 mt-2 font-mono flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff5500] animate-ping" />
                  <span>Only R{Math.round((stats.pricePerPass || 1200) / (stats.totalCuts || 12))} Per Master Haircut &bull; Lifetime Price Lock &bull; Limited to {totalSpots} Patrons Only</span>
                </p>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
                To fund the physical buildout of our flagship barbershop and garment printing lab in Bernadino Heights, we are releasing <strong>only {totalSpots} Founder Passes</strong>: pay R{stats.pricePerPass || 1200} upfront to directly back our Belmont chairs, custom mirrors, and barber stations — in exchange, you lock in 1 master haircut every month for a full year with VIP priority.
              </p>

              {/* 3 Pillar Perks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="rounded-xl border border-zinc-800 bg-black/60 p-3 space-y-1 hover:border-[#ff5500]/50 transition-colors">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-[#ff5500]" />
                    <span>{stats.totalCuts || 12} Fresh Cuts</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    1 cut/month (R{Math.round((stats.pricePerPass || 1200) / (stats.totalCuts || 12))}/cut)
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-black/60 p-3 space-y-1 hover:border-[#ff5500]/50 transition-colors">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-400" />
                    <span>Founder Wall</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    Name engraved in studio
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-black/60 p-3 space-y-1 hover:border-[#ff5500]/50 transition-colors">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff5500]" />
                    <span>VIP Streetwear</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    15% off all limited drops
                  </div>
                </div>
              </div>

              {/* Pass Allocation Info Strip */}
              <div className="flex items-center justify-between text-xs font-mono py-2.5 px-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <span className="text-zinc-400 uppercase flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-[#ff5500]" />
                  <span>Founding Allocation: <strong className="text-white font-bold">{totalSpots} Patrons Only</strong></span>
                </span>
                <span className="text-[#ff5500] font-bold">Strictly Limited &bull; Claim Your Chair</span>
              </div>

              {/* Actions & Exploration Jump */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#ff5500] via-amber-500 to-[#ff7700] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl shadow-[#ff5500]/25 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>Claim Your Founder Pass (R{stats.pricePerPass || 1200})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/founders-pass"
                  className="py-3.5 px-5 rounded-xl border border-zinc-700 hover:border-[#ff5500] bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Read More</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#ff5500]" />
                </Link>

                <a
                  href="#barbershop-section"
                  className="py-3.5 px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950/70 hover:bg-zinc-900 text-zinc-400 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Grooming</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#ff5500]" />
                </a>
              </div>
            </div>

            {/* Right Column: Interactive 3D Graphic Card (Voltage Orange) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-4 lg:py-0">
              {/* Perspective 3D Scene */}
              <div
                className="card-scene"
                id="cardScene"
                ref={sceneRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchMove={handleTouchMove}
                onTouchEnd={resetTilt}
              >
                {/* 3D Physical Card */}
                <div
                  className="card"
                  id="card"
                  ref={cardRef}
                  onClick={() => setModalOpen(true)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleMouseEnter}
                  onTouchEnd={handleMouseLeave}
                  title="Click to claim your Founder Pass"
                >
                  {/* Holographic moving shine */}
                  <div className="card-shine" />

                  {/* Dot pattern texture */}
                  <div className="card-pattern" />

                  {/* Anodized Orange Circuit Chip */}
                  <div className="card-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#ff5500" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <line x1="8" y1="10" x2="8" y2="14" />
                      <line x1="11" y1="10" x2="11" y2="14" />
                      <line x1="14" y1="10" x2="14" y2="14" />
                    </svg>
                  </div>

                  {/* Card Number with Reveal Blur Effect */}
                  <div className="card-number" id="cardNumber">
                    •••• •••• •••• 1200
                  </div>

                  {/* Cardholder Name */}
                  <div className="card-name">
                    A. MORGAN // FOUNDER
                  </div>

                  {/* Expiry / Frequency */}
                  <div className="card-expiry">
                    12/27
                  </div>

                  {/* Card Type Badge */}
                  <div className="card-type">
                    FOUNDER PASS
                  </div>

                  {/* Contactless Wave Icon */}
                  <div className="card-contactless">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
                      <path d="M3 12h18M3 6h18M3 18h18" />
                    </svg>
                  </div>
                </div>

                {/* Soft Orange Glow Behind Card */}
                <div className="card-glow" />
              </div>

              {/* Interactive Helper Hint */}
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-zinc-950/80 px-3.5 py-1.5 rounded-full border border-zinc-800">
                <Sparkles className="w-3.5 h-3.5 text-[#ff5500]" />
                <span>Move cursor / touch to tilt card & reveal holographic number</span>
              </div>

              {/* Card Specs Summary */}
              <div className="mt-2 text-[10px] font-mono text-zinc-500 text-center">
                Obsidian Metal &bull; Voltage Orange Foil &bull; NFC Counter Tap @ 1 Norwalk Way
              </div>
            </div>
          </div>

          {/* Bottom Trust Ticker Strip */}
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-zinc-900/80 text-center relative z-10 text-xs font-mono text-zinc-400">
            <div><strong className="text-white font-bold">R1,440</strong> Total Savings</div>
            <div><strong className="text-[#ff5500] font-bold">ZERO</strong> Queue Delays</div>
            <div><strong className="text-white font-bold">PERMANENT</strong> Founder Wall Engraving</div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. INTERACTIVE FOUNDER PASS INTEREST / PLEDGE MODAL            */}
      {/* ============================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-zinc-950 border-2 border-[#ff5500]/50 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                setModalOpen(false);
                setSubmitted(false);
                setErrorMsg(null);
              }}
              className="absolute top-5 right-5 text-zinc-500 hover:text-white p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#ff5500] uppercase tracking-widest font-bold">
                    FOUNDER PATRON PLEDGE CONFIRMED
                  </span>
                  <h3 className="font-display text-2xl font-black uppercase text-white">
                    Welcome to the Founder Circle!
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Thank you <strong>{name}</strong>! Your pledge for the <strong>12-Cut Founder Pass (R1,200)</strong> has been secured. We have sent a confirmation email to <strong>{email}</strong> and will contact you directly on WhatsApp ({phone}) with construction milestones.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left text-xs space-y-2">
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
                    <span className="text-[#ff5500] font-bold">Pledged Backer</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      setSubmitted(false);
                    }}
                    className="w-full py-3 rounded-xl bg-[#ff5500] hover:bg-[#ff6611] text-black font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Done & Return to Homepage
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitPledge} className="space-y-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono text-[#ff5500] uppercase tracking-wider bg-[#ff5500]/10 px-2 py-0.5 rounded border border-[#ff5500]/30 font-bold">
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
                      <User className="w-3.5 h-3.5 text-[#ff5500]" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chad Johnson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff5500]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#ff5500]" />
                        <span>Email Address</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff5500]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#ff5500]" />
                        <span>WhatsApp Number</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="082 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-[#ff5500]"
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
                            ? 'border-[#ff5500] bg-[#ff5500]/10 text-white'
                            : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700'
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
                            ? 'border-[#ff5500] bg-[#ff5500]/10 text-white'
                            : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="font-bold text-xs text-[#ff5500]">Ready to Pay R1,200 Now</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Instant pass activation via PayFast</div>
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
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff5500]"
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
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff5500] via-amber-500 to-[#ff7700] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#ff5500]/25 disabled:opacity-50 cursor-pointer"
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
