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
  Layers,
  Truck,
} from 'lucide-react';
import { FounderPassBanner } from './components/founder-pass-banner';
import { HaircutServicesSection } from './components/haircut-services-section';
import { FaqAccordion } from './components/faq-accordion';
import { AdminBarbershopService, BarbershopService, AdminProductService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [locations, allProducts, allServices] = await Promise.all([
    BarbershopService.listLocations().catch(() => []),
    AdminProductService.listProducts().catch(() => []),
    AdminBarbershopService.listServices().catch(() => []),
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

  // Pull products dynamically and exclusively from Supabase products catalogue
  const activeProducts = (allProducts || []).filter((p) => p.is_active);
  const displayProducts = activeProducts.slice(0, 3);

  // Dynamic Father-Son Combo settings from Supabase services table
  const fatherSonService = allServices.find((s) => s.plan_code === 'father-son');
  const fatherSonBasePrice = fatherSonService ? Number(fatherSonService.price) : 190;
  const extraSonPrice = fatherSonService?.extra_son_price ? Number(fatherSonService.extra_son_price) : 60;
  const maxSons = fatherSonService?.max_sons ? Number(fatherSonService.max_sons) : 3;

  return (
    <div className="space-y-16 sm:space-y-24 pb-24 overflow-x-hidden bg-background text-foreground">
      {/* ============================================================== */}
      {/* 1. SECTION 1: THE FOUNDER'S PASS BANNER (Milestone Campaign)   */}
      {/* ============================================================== */}
      <FounderPassBanner />
      <section id="streetwear-section" className="relative container mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between">
        {/* Ambient Orange Glow */}
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] bg-orange-600/10 blur-[130px] rounded-full pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-900 pb-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase font-bold text-orange-400">
                DISSAFYT GARMENT LAB // CAPE TOWN APPAREL
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

        {/* 3-COLUMN GRID OF CLOTHES */}
        <div className="py-6 relative z-10">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <Link href={productUrl} className="block relative aspect-[4/5] max-h-[380px] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 mb-3.5">
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
                        LIMITED RUN
                      </span>
                    </Link>

                    {/* Title & Description */}
                    <Link href={productUrl} className="block">
                      <h3 className="font-display text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {garment.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {garment.description || 'Authentic heavyweight streetwear crafted in Cape Town.'}
                    </p>

                    {/* Live Drop Progress Bar */}
                    <div className="mt-3.5 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
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
                  <div className="pt-3.5 mt-3.5 border-t border-zinc-900 space-y-2.5">
                    <div className="flex items-baseline justify-between text-xs font-mono">
                      <span className="text-zinc-400">Full Price:</span>
                      <span className="font-bold text-white">R {Number(garment.base_price).toFixed(2)}</span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs font-mono bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
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
            <span>280GSM Heavyweight</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>DTF Permanent Fidelity</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            <span>Nationwide Door-to-Door Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>PayFast ZAR Protection</span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. SECTION 3: HAIRCUT SERVICES SECTION (min-h-[85vh], 2 Cols)  */}
      {/* ============================================================== */}
      <HaircutServicesSection
        flagshipLocationName={flagship.name}
        flagshipAddress={flagship.address}
        fatherSonBasePrice={fatherSonBasePrice}
        extraSonPrice={extraSonPrice}
        maxSons={maxSons}
      />

      {/* ============================================================== */}
      {/* 4. CAPE TOWN FLAGSHIP LOCATION & OPERATING HOURS               */}
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
