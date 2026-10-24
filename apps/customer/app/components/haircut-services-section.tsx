'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Crown,
  Clock,
  Check,
  ChevronRight,
  ArrowRight,
  Users,
  Sparkles,
  Flame,
  ShieldCheck,
  Plus,
  Minus,
  MapPin,
} from 'lucide-react';

interface HaircutServicesSectionProps {
  flagshipLocationName?: string;
  flagshipAddress?: string;
  fatherSonBasePrice?: number;
  extraSonPrice?: number;
  maxSons?: number;
}

export function HaircutServicesSection({
  flagshipLocationName = 'Dissafyt Studio - Bernie',
  flagshipAddress = '1 Norwalk Way, Bernadino Heights',
  fatherSonBasePrice = 190,
  extraSonPrice = 60,
  maxSons = 3,
}: HaircutServicesSectionProps) {
  // Father-Son sons count state: default 1 son, adjustable up to maxSons
  const [sonCount, setSonCount] = useState<number>(1);

  // Dynamic pricing for Father & Son combo based on admin configuration
  const safeMaxSons = Math.max(1, Math.min(maxSons, 5));
  const sonsOptions = Array.from({ length: safeMaxSons }, (_, i) => i + 1);
  const fatherSonPrice = fatherSonBasePrice + (sonCount - 1) * extraSonPrice;

  const straightBookings = [
    {
      id: 'cut-skin-fade',
      name: 'The Ace Skin Fade',
      duration: '30 min',
      price: 120,
      tag: 'POPULAR CHOICE',
      description: 'Zero-guard razor skin fade, taper fade, or burst fade with crisp perimeter lineup and matte clay styling.',
      href: '/book?service=cut-skin-fade',
    },
    {
      id: 'cut-executive-combo',
      name: 'The Executive Combo',
      duration: '45 min',
      price: 220,
      featured: true,
      tag: 'FLAGSHIP SIGNATURE',
      description: 'Master razor skin fade, architectural beard sculpting, and essential oil steamed towel.',
      href: '/book?service=cut-executive-combo',
    },
    {
      id: 'cut-beard-sculpt',
      name: 'Beard Sculpt & Towel',
      duration: '30 min',
      price: 100,
      tag: 'BEARD CARE',
      description: 'Crisp razor boundary shaping, mustache trim, steamed hot towel therapy, and organic beard butter massage.',
      href: '/book?service=cut-beard-sculpt',
    },
    {
      id: 'cut-precision-master',
      name: 'Master Precision Cut',
      duration: '35 min',
      price: 150,
      tag: 'TEXTURE & CRAFT',
      description: 'Expert shear texture work, taper fade finish, razor neck cleanup, and luxury styling pomade.',
      href: '/book?service=cut-precision-master',
    },
  ];

  return (
    <section
      id="barbershop-section"
      className="relative container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between"
    >
      {/* Ambient Top Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-900 pb-4 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase font-bold text-amber-400">
              ACE OF FYT // MASTER GROOMING STUDIO &bull; CAPE TOWN
            </span>
            <span className="hidden md:inline-block text-[10px] font-mono text-zinc-500">
              {flagshipAddress}
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none">
            The Sharpest Cut in Cape Town
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/book?locate=true"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 hover:text-emerald-200 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/10 hover:border-emerald-400"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Find Closest Barber</span>
          </Link>
          <Link
            href="/book"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Full Booking Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2-Column Digestible Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 py-6 relative z-10 items-stretch">
        {/* ========================================================== */}
        {/* LEFT COLUMN: STRAIGHT BOOKINGS (ONCE-OFF SESSIONS)          */}
        {/* ========================================================== */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black uppercase text-white tracking-tight">
                    Straight Bookings
                  </h3>
                  <p className="text-[11px] font-mono text-amber-400/90">
                    Single Chair Sessions &bull; Settle Time & Payment
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                Instant Confirmation
              </span>
            </div>

            <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
              Select your master grooming cut, choose your preferred barber, and settle payment securely online or at the chair.
            </p>

            {/* Straight Booking Items List */}
            <div className="space-y-3 mt-4">
              {straightBookings.map((cut) => (
                <div
                  key={cut.id}
                  className={`group rounded-xl p-3.5 border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    cut.featured
                      ? 'border-amber-500/50 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950'
                      : 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/60 border border-zinc-800 text-amber-400 font-bold">
                        {cut.tag}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {cut.duration}
                      </span>
                    </div>
                    <h4 className="font-display text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      {cut.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 leading-normal">
                      {cut.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                    <div className="text-left sm:text-right">
                      <div className="text-[9px] font-mono text-zinc-500 uppercase">Fee</div>
                      <div className="font-mono font-black text-base text-amber-400 leading-none">
                        R {cut.price.toFixed(0)}
                      </div>
                    </div>
                    <Link
                      href={cut.href}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/10 flex items-center gap-1 shrink-0"
                    >
                      <span>Book Time & Pay</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Includes razor finish & styling</span>
            <Link href="/book" className="text-amber-400 hover:underline flex items-center gap-1">
              <span>View all 8 studio services</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ========================================================== */}
        {/* RIGHT COLUMN: SUBSCRIPTION CUTS (VIP GUILD MEMBERSHIPS)    */}
        {/* ========================================================== */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black uppercase text-white tracking-tight">
                    Subscription Cuts
                  </h3>
                  <p className="text-[11px] font-mono text-orange-400/90">
                    VIP Guild Memberships &bull; Zero Wait & Recurring Value
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                Cancel Anytime
              </span>
            </div>

            <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
              Lock in guaranteed chair time every month, skip all walk-in queues, and save with recurring PayFast billing.
            </p>

            {/* Subscription Plans List */}
            <div className="space-y-3 mt-4">
              {/* Plan 1: The Regular Pass */}
              <div className="rounded-xl p-3.5 border border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 max-w-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500 text-black font-black">
                      MOST POPULAR
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">Zero Wait Queue</span>
                  </div>
                  <h4 className="font-display text-sm font-bold text-white">The Regular Pass</h4>
                  <p className="text-[11px] text-zinc-300 flex items-center gap-1">
                    <Check className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>2 Master Cuts / month (R95/cut &bull; hot towel finish)</span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  <div className="text-left sm:text-right">
                    <div className="text-[9px] font-mono text-zinc-500 uppercase">Monthly</div>
                    <div className="font-mono font-black text-base text-white leading-none">
                      R 190<span className="text-[10px] text-zinc-400 font-normal">/mo</span>
                    </div>
                  </div>
                  <Link
                    href="/book?plan=twice"
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-500/10 flex items-center gap-1 shrink-0"
                  >
                    <span>Subscribe & Book</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Plan 2: Father & Son Combo (WITH ADJUSTABLE SONS 1, 2, 3) */}
              <div className="rounded-xl p-3.5 border border-[#ff5500]/60 bg-gradient-to-r from-[#ff5500]/15 via-zinc-900 to-zinc-950 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#ff5500] text-black font-black">
                        FAMILY DUAL
                      </span>
                      <span className="text-[10px] font-mono text-amber-400">Bonding Chairs</span>
                    </div>
                    <h4 className="font-display text-sm font-bold text-white mt-1">
                      Father &amp; Son Combo Pass
                    </h4>
                    <p className="text-[11px] text-zinc-300 flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3 text-[#ff5500] shrink-0" />
                      <span>
                        1 Adult Cut + <strong>{sonCount} {sonCount === 1 ? 'Junior Cut' : 'Junior Cuts'}</strong> / month (Side-by-side chairs)
                      </span>
                    </p>
                  </div>

                  {/* Adjustable Sons Selector */}
                  <div className="bg-black/80 border border-zinc-800 rounded-xl p-1.5 flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] font-mono text-zinc-400 pl-1 uppercase font-bold">
                      Sons:
                    </span>
                    <div className="flex items-center space-x-1">
                      {sonsOptions.map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSonCount(num)}
                          className={`h-6 w-6 rounded-lg text-xs font-mono font-bold transition-all ${
                            sonCount === num
                              ? 'bg-[#ff5500] text-black shadow-sm shadow-[#ff5500]/30 scale-105'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  <div>
                    <div className="text-[9px] font-mono text-zinc-500 uppercase">
                      1 Father + {sonCount} {sonCount === 1 ? 'Son' : 'Sons'}
                    </div>
                    <div className="font-mono font-black text-lg text-amber-400 leading-none">
                      R {fatherSonPrice}
                      <span className="text-[10px] text-zinc-400 font-normal">/mo</span>
                    </div>
                  </div>

                  <Link
                    href={`/book?plan=father-son&sons=${sonCount}`}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff5500] via-amber-500 to-[#ff7700] hover:brightness-110 text-black text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#ff5500]/15 flex items-center gap-1"
                  >
                    <span>Subscribe &amp; Book</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Plan 3: The Solo Pass & The Executive Club (Compact 2-grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Solo Pass */}
                <div className="rounded-xl p-3 border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 uppercase">
                      <span>Essential</span>
                      <span className="text-white font-bold">1 Cut/mo</span>
                    </div>
                    <h5 className="font-bold text-white text-xs mt-1">The Solo Pass</h5>
                    <div className="font-mono font-bold text-sm text-white mt-1">
                      R 100<span className="text-[9px] text-zinc-400">/mo</span>
                    </div>
                  </div>
                  <Link
                    href="/book?plan=solo"
                    className="mt-2 text-center py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold transition-colors block"
                  >
                    Join Solo Pass
                  </Link>
                </div>

                {/* Executive Club */}
                <div className="rounded-xl p-3 border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-amber-400 uppercase">
                      <span>VIP Suite</span>
                      <span className="text-white font-bold">Cut + Beard</span>
                    </div>
                    <h5 className="font-bold text-white text-xs mt-1">Executive Club</h5>
                    <div className="font-mono font-bold text-sm text-white mt-1">
                      R 350<span className="text-[9px] text-zinc-400">/mo</span>
                    </div>
                  </div>
                  <Link
                    href="/book?plan=executive"
                    className="mt-2 text-center py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold transition-colors block"
                  >
                    Join Executive
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>PayFast recurring billing &bull; Zero contract</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Priority weekend chairs</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Trust Ticker Strip */}
      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-zinc-900 text-center relative z-10 text-xs font-mono text-zinc-400">
        <div><strong className="text-white font-bold">0 MIN</strong> Queue Delays</div>
        <div><strong className="text-white font-bold">100%</strong> Razor Precision</div>
        <div><strong className="text-amber-400 font-bold">VIP</strong> Saturday Chairs</div>
      </div>
    </section>
  );
}
