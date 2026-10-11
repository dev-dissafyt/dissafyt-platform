import Link from 'next/link';
import Image from 'next/image';
import {
  Scissors,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Flame,
  Clock,
  Award,
  CheckCircle2,
  ChevronRight,
  MapPin,
  CalendarCheck,
  Layers,
  Crown,
  Check,
  Truck,
} from 'lucide-react';
import { FounderPassBanner } from './components/founder-pass-banner';
import { FaqAccordion } from './components/faq-accordion';
import { AdminBarbershopService, BarbershopService, AdminProductService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [allServices, locations, allProducts] = await Promise.all([
    AdminBarbershopService.listServices().catch(() => []),
    BarbershopService.listLocations().catch(() => []),
    AdminProductService.listProducts().catch(() => []),
  ]);

  const flagship = locations.find((l) => l.is_flagship) || locations[0] || {
    id: 'loc-cpt-flagship',
    name: 'Dissafyt Studio - Bernie',
    address: '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570',
    city: 'Cape Town',
    province: 'Western Cape',
    phone: '+27 818082570',
    operating_hours_display: 'Tue-Sat: 09:00 - 19:00 | Sun: 10:00 - 16:00 | Mon: By Appointment',
  };

  // 1. Curate 4 Normal Haircut Services
  const normalCuts = [
    {
      id: 'cut-skin-fade',
      name: 'The Ace Skin Fade',
      duration: '30 min',
      price: 120,
      tag: 'POPULAR CHOICE',
      description: 'Zero-guard razor skin fade, taper fade, or burst fade with crisp perimeter lineup and matte clay styling.',
      href: '/book',
    },
    {
      id: 'cut-executive-combo',
      name: 'The Executive Combo',
      duration: '45 min',
      price: 220,
      featured: true,
      tag: 'FLAGSHIP SIGNATURE',
      description: 'Full transformation: master razor skin fade, architectural beard sculpting, and essential oil steamed towel.',
      href: '/book',
    },
    {
      id: 'cut-beard-sculpt',
      name: 'Beard Sculpt & Towel',
      duration: '30 min',
      price: 100,
      tag: 'BEARD CARE',
      description: 'Crisp razor boundary shaping, mustache trim, steamed hot towel therapy, and organic beard butter massage.',
      href: '/book',
    },
    {
      id: 'cut-precision-master',
      name: 'Master Precision Cut',
      duration: '35 min',
      price: 150,
      tag: 'TEXTURE & CRAFT',
      description: 'Expert shear texture work, taper fade finish, razor neck cleanup, and luxury styling pomade.',
      href: '/book',
    },
  ];

  // 2. Curate 4 Haircut Membership Options
  const membershipOptions = [
    {
      id: 'mem-solo',
      name: 'The Solo Pass',
      price: 100,
      period: '/mo',
      tag: 'ESSENTIAL',
      perk: '1 Master Haircut per month (R100/cut)',
      details: 'Guaranteed chair time, priority booking, cancel anytime.',
      href: '/book',
    },
    {
      id: 'mem-regular',
      name: 'The Regular Pass',
      price: 190,
      period: '/mo',
      featured: true,
      tag: 'MOST POPULAR',
      perk: '2 Master Haircuts per month (R95/cut)',
      details: 'Skip the queue, hot towel finish, priority Saturday chairs.',
      href: '/book',
    },
    {
      id: 'mem-executive',
      name: 'The Executive Club',
      price: 350,
      period: '/mo',
      tag: 'VIP SUITE',
      perk: '2 Full Combos (Hair + Beard Sculpt)',
      details: 'Hot towel sculpting, scalp therapy, and private espresso lounge.',
      href: '/book',
    },
    {
      id: 'mem-father-son',
      name: 'Father & Son Pass',
      price: 190,
      period: '/mo',
      tag: 'FAMILY DUAL',
      perk: '1 Adult Cut + 1 Junior Cut per month',
      details: 'Side-by-side chair sessions, priority weekend booking.',
      href: '/book',
    },
  ];

  // 3. Curate Exactly 4 Clothes for 4x1 Shop Grid
  const activeProducts = (allProducts || []).filter((p) => p.is_active);
  const fallbackGarments = [
    {
      id: 'garment-1',
      slug: 'dissafyt-280gsm-heavyweight-hoodie',
      name: '280GSM Studio Heavyweight Hoodie',
      base_price: 650,
      is_preorder: true,
      preorder_target: 50,
      preorder_claimed_count: 34,
      preorder_deposit_pct: 50,
      images: ['/images/hero-collaboration.png'],
      description: 'Ultra-dense 280GSM French terry with permanent DTF back artwork and double-lined hood.',
    },
    {
      id: 'garment-2',
      slug: 'ace-of-fyt-acid-wash-tee',
      name: 'Ace of Fyt Acid-Wash Boxy Tee',
      base_price: 350,
      is_preorder: true,
      preorder_target: 50,
      preorder_claimed_count: 42,
      preorder_deposit_pct: 50,
      images: ['/images/barber-tools.png'],
      description: 'Custom mineral-washed ring-spun cotton tee with embroidered gold barbershop crest.',
    },
    {
      id: 'garment-3',
      slug: 'cpt-garment-lab-oversized-tee',
      name: 'Garment Lab Capsule Oversized Tee',
      base_price: 380,
      is_preorder: true,
      preorder_target: 50,
      preorder_claimed_count: 26,
      preorder_deposit_pct: 50,
      images: ['/images/barber-hero.png'],
      description: 'Drop-shoulder silhouette with high-density direct-to-garment chest typography.',
    },
    {
      id: 'garment-4',
      slug: 'bernie-french-terry-crewneck',
      name: 'Bernie 1970 French Terry Crewneck',
      base_price: 550,
      is_preorder: true,
      preorder_target: 50,
      preorder_claimed_count: 38,
      preorder_deposit_pct: 50,
      images: ['/images/father-son.png'],
      description: 'Heavyweight ribbed cuffs and hem with tonal Bernadino Heights studio coordinates.',
    },
  ];

  // Merge active products with fallbacks to guarantee 4 items
  const displayProducts = [...activeProducts, ...fallbackGarments].slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24 pb-24 overflow-hidden bg-black text-white">
      {/* ============================================================== */}
      {/* 1. HERO LANDING: THE FOUNDER'S PASS (85-90vh)                  */}
      {/* ============================================================== */}
      <FounderPassBanner />

      {/* ============================================================== */}
      {/* 2. SECTION 2: THE BARBERSHOP EXPERIENCE (80-90vh)              */}
      {/* ============================================================== */}
      <section id="barbershop-section" className="relative min-h-[85vh] lg:h-[88vh] flex flex-col justify-between container mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
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
                1 Norwalk Way, Bernadino Heights
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none">
              The Sharpest Cut in Cape Town
            </h1>
          </div>
          <Link
            href="/book"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 shrink-0"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* The Two Service Carousels / Rows */}
        <div className="flex-1 flex flex-col justify-around py-4 space-y-6 relative z-10">
          {/* ROW 1: Normal Haircut Services (4 Options) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>Single Chair Sessions &bull; Standard Cuts</span>
              </span>
              <Link href="/book" className="text-[11px] font-mono text-zinc-500 hover:text-amber-400 transition-colors">
                View all grooming &rarr;
              </Link>
            </div>

            {/* 4 Cards Track (Desktop 4-col, mobile horizontal scroll carousel) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 overflow-x-auto pb-1">
              {normalCuts.map((cut) => (
                <div
                  key={cut.id}
                  className={`group rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 border relative ${
                    cut.featured
                      ? 'border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-zinc-950 shadow-lg shadow-amber-500/5'
                      : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400 font-bold">
                        {cut.tag}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {cut.duration}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      {cut.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {cut.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-zinc-900 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-mono text-zinc-500 uppercase">Chair Fee</div>
                      <div className="font-mono font-black text-lg text-amber-400 leading-none">
                        R {cut.price.toFixed(2)}
                      </div>
                    </div>
                    <Link
                      href={cut.href}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-amber-500 hover:text-black text-white text-xs font-bold transition-all border border-zinc-800 hover:border-amber-400 flex items-center gap-1"
                    >
                      <span>Reserve</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 2: Monthly Recurring Memberships (4 Options) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Monthly Recurring Memberships &bull; The VIP Guild</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Cancel or pause anytime &bull; PayFast recurring
              </span>
            </div>

            {/* 4 Cards Track (Desktop 4-col, mobile horizontal scroll carousel) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 overflow-x-auto pb-1">
              {membershipOptions.map((mem) => (
                <div
                  key={mem.id}
                  className={`group rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 border relative ${
                    mem.featured
                      ? 'border-amber-500 bg-gradient-to-b from-amber-500/15 via-zinc-900/90 to-zinc-950 shadow-xl shadow-amber-500/10'
                      : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400 font-bold">
                        {mem.tag}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">Zero Wait Queue</span>
                    </div>

                    <h3 className="font-display text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      {mem.name}
                    </h3>

                    <div className="text-[11px] font-semibold text-amber-300/90 flex items-center gap-1">
                      <Check className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="line-clamp-1">{mem.perk}</span>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {mem.details}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-zinc-900 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-mono text-zinc-500 uppercase">Monthly Dues</div>
                      <div className="font-mono font-black text-lg text-white leading-none">
                        R {mem.price.toFixed(0)}
                        <span className="text-xs font-normal text-zinc-400">{mem.period}</span>
                      </div>
                    </div>
                    <Link
                      href="/book"
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold transition-all shadow-md shadow-amber-500/10"
                    >
                      Join Club
                    </Link>
                  </div>
                </div>
              ))}
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

      {/* ============================================================== */}
      {/* 3. SECTION 3: THE STREETWEAR DROP ROOM (80-90vh - 4x1 GRID)   */}
      {/* ============================================================== */}
      <section id="streetwear-section" className="relative min-h-[85vh] lg:h-[88vh] flex flex-col justify-between container mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
        {/* Ambient Orange Glow */}
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] bg-orange-600/10 blur-[130px] rounded-full pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-900 pb-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase font-bold text-orange-400">
                DISSAFYT GARMENT LAB // 280GSM HEAVYWEIGHT
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono text-zinc-500">
                Pre-order Milestone Drops &bull; 50% Upfront Deposit
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none">
              The Streetwear Drop Room
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-white bg-zinc-900 hover:bg-white text-white hover:text-black font-extrabold text-xs uppercase tracking-wider transition-all shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Enter Full Drop Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4x1 GRID OF CLOTHES */}
        <div className="flex-1 py-4 flex items-center relative z-10">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayProducts.map((garment) => {
              const target = garment.preorder_target || 50;
              const claimed = garment.preorder_claimed_count || 0;
              const pct = Math.min(100, Math.round((claimed / target) * 100));
              const remaining = Math.max(0, target - claimed);
              const depositPct = garment.preorder_deposit_pct || 50;
              const depositAmount = (garment.base_price * depositPct) / 100;
              const productUrl = `/shop/${garment.slug || garment.id}`;

              return (
                <div
                  key={garment.id}
                  className="group rounded-2xl border border-zinc-800 hover:border-amber-500/50 bg-zinc-950 p-4 flex flex-col justify-between transition-all duration-300 shadow-xl"
                >
                  <div>
                    {/* Garment Image Container */}
                    <Link href={productUrl} className="block relative aspect-[4/5] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 mb-3.5">
                      {garment.images && garment.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={garment.images[0]}
                          alt={garment.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-600">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}

                      {/* Drop Badge */}
                      <span className="absolute top-2.5 left-2.5 rounded-full bg-amber-500 text-black px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <span className="h-1.5 w-1.5 rounded-full bg-black animate-ping" />
                        PRE-ORDER DROP
                      </span>
                      <span className="absolute top-2.5 right-2.5 rounded-full bg-black/80 backdrop-blur px-2 py-0.5 text-[9px] font-mono text-zinc-300 border border-zinc-700">
                        280GSM
                      </span>
                    </Link>

                    {/* Title & Description */}
                    <Link href={productUrl} className="block">
                      <h3 className="font-display text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {garment.name}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {garment.description || 'Authentic heavyweight streetwear crafted in Cape Town.'}
                    </p>

                    {/* Live Drop Progress Bar */}
                    <div className="mt-3 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-amber-400 font-bold">
                          {claimed}/{target} Claimed
                        </span>
                        <span className="text-zinc-400">
                          {remaining === 0 ? (
                            <strong className="text-emerald-400">Locked</strong>
                          ) : (
                            <strong className="text-amber-300">{remaining} left</strong>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                          style={{ width: `${Math.max(6, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown & CTA */}
                  <div className="pt-3 mt-3 border-t border-zinc-900 space-y-2">
                    <div className="flex items-baseline justify-between text-xs font-mono">
                      <span className="text-zinc-400">Full Price:</span>
                      <span className="font-bold text-white">R {Number(garment.base_price).toFixed(2)}</span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                      <span className="text-amber-400 font-bold">Deposit Today ({depositPct}%):</span>
                      <span className="font-extrabold text-amber-300">R {depositAmount.toFixed(2)}</span>
                    </div>

                    <Link
                      href={productUrl}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider text-center block transition-all shadow-md shadow-amber-500/10"
                    >
                      Pre-order Piece &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Garment Lab Spec Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-900 text-xs font-mono text-zinc-400 relative z-10">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>280GSM French Terry</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>DTF Permanent Fidelity</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            <span>Courier Guy Door-to-Door</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>PayFast ZAR Protection</span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. CAPE TOWN FLAGSHIP LOCATION & FREQUENTLY ASKED QUESTIONS   */}
      {/* ============================================================== */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>OPEN TUE – SUN &bull; CAPE TOWN FLAGSHIP</span>
              </div>

              <h2 className="font-display text-2xl sm:text-4xl font-black uppercase text-white">
                {flagship.name}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-lg leading-relaxed">
                Experience our dual-pillar culture house at {flagship.address}. Master chair reservations, custom garment fittings, and zero-queue service.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-zinc-500 uppercase">Operating Hours</span>
                  <p className="text-white font-semibold">{flagship.operating_hours_display}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-500 uppercase">Contact & Support</span>
                  <p className="text-amber-400 font-semibold">{flagship.phone || '+27 818082570'}</p>
                  <p className="text-zinc-400">letstalk@dissafyt.com</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3">
              <Link
                href="/book"
                className="w-full text-center rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.02]"
              >
                Book Chair at Flagship Studio
              </Link>
              <Link
                href="/shop"
                className="w-full text-center rounded-xl border border-zinc-700 hover:border-zinc-500 bg-zinc-900 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-zinc-200 transition-all hover:scale-[1.02]"
              >
                Explore Streetwear Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ ACCORDION */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6">
        <FaqAccordion />
      </section>
    </div>
  );
}
