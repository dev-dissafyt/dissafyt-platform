import Link from 'next/link';
import Image from 'next/image';
import {
  Scissors,
  Award,
  Sparkles,
  Building,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Flame,
  Clock,
  Layers,
  MapPin,
  ChevronRight,
  Coffee,
  Check,
  ChevronDown,
} from 'lucide-react';
import { FounderPassService } from '@dissafyt/api';
import { FounderPassPurchaseClient } from './founder-pass-purchase-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "Founder's Circle Pass • Dissafyt Flagship Studio",
  description:
    'Back the physical buildout of our Bernadino Heights flagship barbershop and streetwear lab. Secure 12 master haircuts for R1,200 (R100/cut), lifetime pricing, and founding patron privileges.',
};

export default async function FoundersPassPage() {
  const [stats, settings] = await Promise.all([
    FounderPassService.getBuildoutStats().catch(() => ({
      totalSpots: 50,
      claimedSpots: 0,
      totalCapitalTarget: 60000,
      currentCapital: 0,
      pctFunded: 0,
      remainingSpots: 50,
      pricePerPass: 1200,
      totalCuts: 12,
    })),
    FounderPassService.getCampaignSettings().catch(() => ({
      id: 'default',
      price_per_pass: 1200,
      total_cuts: 12,
      total_spots: 50,
      capital_target: 60000,
      is_active: true,
      updated_at: '',
    })),
  ]);

  const pricePerPass = settings.price_per_pass || 1200;
  const totalCuts = settings.total_cuts || 12;
  const totalSpots = settings.total_spots || 50;
  const pricePerCut = (pricePerPass / (totalCuts || 1)).toFixed(0);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-[#ff5500] selection:text-black">
      {/* Top Banner Navigation / Breadcrumb */}
      <div className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2 text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">
              Storefront
            </Link>
            <span>/</span>
            <span className="text-[#ff5500] font-bold">Founder&apos;s Circle</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-block text-zinc-400">
              Allocation: <strong className="text-white">{totalSpots} Patrons Only</strong>
            </span>
            <Link
              href="/book"
              className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-white hover:text-amber-400 transition-colors"
            >
              Book Regular Cut
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative pt-12 pb-16 overflow-hidden">
        {/* Voltage Glow Ambience */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#ff5500]/15 blur-[150px] rounded-full pointer-events-none" />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 rounded-full bg-[#ff5500]/10 border border-[#ff5500]/40 px-3.5 py-1 text-xs font-mono font-bold text-[#ff5500] uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span>Flagship Physical Studio Buildout &bull; Cape Town</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-[0.95]">
              Back The Studio. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5500] via-amber-400 to-[#ff7700]">
                Own Your Chair For Life.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-sans">
              To build Cape Town&apos;s most uncompromising dual-pillar culture house — breaking ground on our purpose-built <strong>6m x 7m freestanding double-brick structure</strong> at <strong>1 Norwalk Way, Bernadino Heights</strong> — we are issuing exactly <strong>{totalSpots} Founder Passes</strong>. Back the physical buildout and lock in lifetime founding status.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                Upfront: <strong className="text-amber-400 font-bold">R {pricePerPass.toFixed(0)}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                Annual Entitlement: <strong className="text-white font-bold">{totalCuts} Master Cuts</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                Per-Session Equivalent: <strong className="text-emerald-400 font-bold">R {pricePerCut} / Cut</strong>{' '}
                <span className="text-zinc-500">(vs R220 standard)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Stage: Interactive Card & Campaign Pitch */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Vision, Equipment Allocation & Privileges */}
          <div className="lg:col-span-7 space-y-10">
            {/* 1. What Your Capital Directly Backs */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#ff5500] flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span>Physical Buildout Transparency</span>
              </h2>
              <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
                Where Your R{pricePerPass.toFixed(0)} Capital Goes
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                We believe in total architectural and financial transparency. 100% of founder pass funds are pooled directly into the physical construction and finishings of our 42m² freestanding studio:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-[#ff5500]/10 border border-[#ff5500]/30 flex items-center justify-center text-[#ff5500]">
                    <Building className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">6m x 7m Double-Brick Structure</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Freestanding 42m² engineered structure built with heavy-duty double-skin brick masonry, reinforced damp-proof foundation slabs, and high-pitch weather-sealed roofing at 1 Norwalk Way.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Porcelain Tiling &amp; Finishes</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Commercial-grade matte charcoal non-slip porcelain floor tiles, seamless sanitary coving, waterproof wall surrounds, and matte black acoustic paneling for pristine acoustics.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Custom Furniture &amp; Belmont Chairs</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Bespoke steel-and-hardwood barber stations, tailored client leather waiting lounge, and authentic heavy cast-iron Belmont hydraulic chairs.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Full Commercial Plumbing</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Deep ceramic ergonomic backwash shampoo stations, dedicated high-recovery continuous hot water cylinders, and sanitary plumbing feeds for hot towel therapy.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Shadowless Lighting &amp; Clean Power</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    High-CRI 95+ 5000K daylight-balanced overhead LED array calibrated for razor-precise skin fades and lineups, with dedicated surge-isolated circuit lines.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Espresso Bar &amp; Streetwear Lab</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Integrated Direct-to-Film (DTF) apparel printing workbench for Cape Town limited drops, plus a complimentary single-origin espresso station for founding patrons.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Complete 5 Founding Patron Perks */}
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#ff5500] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Founding Privileges</span>
              </h2>
              <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
                What You Receive As A Founding Patron
              </h3>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">
                      {totalCuts} Master Haircut Sessions (365-Day Validity)
                    </h5>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      Redeem 1 haircut per month at R0.00 chair fee whenever you book online or walk in. That&apos;s R{pricePerCut}/cut vs the R220 standard executive rate.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Zero-Wait Priority Saturday Chairs</h5>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      Founders skip standard wait queues. You get exclusive prime booking windows on peak Friday afternoons and Saturday mornings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">15% Lifetime Discount on All Streetwear Drops</h5>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      Automatic 15% markdown applied to every hoodie, boxy tee, and crewneck release produced in the Garment Lab.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Permanent Name Engraving On Studio Founder Plaque</h5>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      Your name or brand permanently etched into our laser-cut brass memorial wall inside the Bernadino Heights studio.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">VIP Launch Night & Ribbon Cutting Invitation</h5>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      Complimentary entry with a guest to our private launch event with DJ sets, garment prototypes, and studio drinks.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Frequently Asked Questions */}
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#ff5500] flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Frequently Asked Questions</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <h5 className="font-bold text-white text-sm">How do I redeem my cuts?</h5>
                  <p className="text-zinc-400 leading-relaxed">
                    When you book online at dissafyt.com/book using your registered email, our system recognizes your active Founder Pass and sets the chair fee to R0.00. You can also walk into 1 Norwalk Way, Bernadino Heights and present your pass number (e.g. FP-0029).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <h5 className="font-bold text-white text-sm">What if I don&apos;t use all {totalCuts} cuts within 12 months?</h5>
                  <p className="text-zinc-400 leading-relaxed">
                    While the pass is designed for 1 cut per month, unused cuts rollover for an additional 60 days grace period, or you can transfer remaining cuts to a friend or family member at the studio counter.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <h5 className="font-bold text-white text-sm">Is payment safe and protected?</h5>
                  <p className="text-zinc-400 leading-relaxed">
                    Yes. All payments are processed through PayFast using 256-bit bank encryption and South African Rand (ZAR) clearing. You receive an immediate receipt and pass credentials via email.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Purchase Client Component */}
          <div className="lg:col-span-5 sticky top-20">
            <FounderPassPurchaseClient
              pricePerPass={pricePerPass}
              totalCuts={totalCuts}
              totalSpots={totalSpots}
              stats={stats}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
