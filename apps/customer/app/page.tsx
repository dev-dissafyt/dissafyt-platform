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
} from 'lucide-react';
import { SubscriptionCarousel } from './components/subscription-carousel';
import { AdminBarbershopService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allServices = await AdminBarbershopService.listServices().catch(() => []);
  const activeServices = (allServices || []).filter((s) => s.is_active && !s.is_subscription);
  const displayServices = activeServices.length > 0 ? activeServices.slice(0, 3) : [
    {
      id: 'default-1',
      name: 'The Executive Combo',
      description: 'Full service transformation: razor skin fade, beard architectural lineup, hot towel sculpt, and scalp treatment.',
      price: 220,
      duration_minutes: 45,
    },
    {
      id: 'default-2',
      name: 'The Ace Skin Fade',
      description: 'Zero-guard skin fade, taper fade, or burst fade with razor edge crisping and matte styling clay.',
      price: 120,
      duration_minutes: 30,
    },
    {
      id: 'default-3',
      name: 'Beard Sculpt & Towel',
      description: 'Beard shaping, razor perimeter definition, steamed essential oil towel, and organic beard butter massage.',
      price: 100,
      duration_minutes: 30,
    },
  ];

  const marqueeItems = [
    'ACE OF FYT BARBERSHOP',
    'CAPE TOWN FLAGSHIP',
    'DISSAFYT GARMENT LAB',
    'ZERO QUEUE WAITING',
    '280GSM HEAVYWEIGHT STREETWEAR',
    'THE EXECUTIVE COMBO',
    'HOT TOWEL SCULPTING',
    'LIMITED CAPSULE DROPS',
    'MOTHER CITY CULTURE',
  ];

  return (
    <div className="space-y-20 pb-24 overflow-hidden bg-black">
      {/* 1. BILLBOARD HERO SECTION */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-28 border-b border-zinc-900 overflow-hidden">
        {/* Ambient Gold Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Billboard Copy */}
            <div className="lg:col-span-7 space-y-8 text-left">
              {/* Mother City / Flagship pill */}
              <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="tracking-wider uppercase font-mono text-[11px]">
                  CAPE TOWN FLAGSHIP // DUAL PILLAR ECOSYSTEM
                </span>
              </div>

              {/* Massive Billboard Headline */}
              <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white leading-[0.92]">
                THE SHARPEST CUT. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-200">
                  THE HEAVIEST DRIP.
                </span>
              </h1>

              {/* Editorial Subtitle */}
              <p className="text-base sm:text-xl text-zinc-300 max-w-xl font-light leading-relaxed">
                Cape Town&apos;s definitive culture house. Master barbering chair reservations at{' '}
                <span className="text-white font-medium">Ace of Fyt</span> paired with limited-edition heavyweight streetwear engineered in our{' '}
                <span className="text-white font-medium">Dissafyt Studio</span>.
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/book"
                  className="group inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-black transition-all shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02]"
                >
                  <Scissors className="mr-2 h-4 w-4 stroke-[2.5]" />
                  <span>Secure Your Chair</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/shop"
                  className="group inline-flex items-center justify-center rounded-xl border-2 border-white/80 hover:border-white bg-transparent hover:bg-white px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-white hover:text-black transition-all hover:scale-[1.02]"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>Enter Drop Room</span>
                </Link>
              </div>

              {/* Trust Metric Strip */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-900/90 text-left">
                <div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-white">0 MIN</div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mt-0.5">
                    Member Queue Wait
                  </div>
                </div>
                <div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-white">280 GSM</div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mt-0.5">
                    Heavyweight Garments
                  </div>
                </div>
                <div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-amber-400">100%</div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mt-0.5">
                    Cape Town Handcrafted
                  </div>
                </div>
              </div>
            </div>

            {/* Right: High-Impact Editorial Imagery Grid */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Hero Card */}
                <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950/80 p-3 shadow-2xl backdrop-blur group">
                  <div className="relative aspect-[4/5] sm:aspect-square w-full overflow-hidden rounded-2xl bg-zinc-900">
                    <Image
                      src="/images/barber-hero.png"
                      alt="Ace of Fyt Barbershop Cape Town"
                      fill
                      className="object-cover object-center brightness-95 contrast-105 transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                    {/* Badge Overlay */}
                    <div className="absolute top-4 left-4 inline-flex items-center space-x-1.5 rounded-full bg-black/70 backdrop-blur border border-zinc-700/80 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>CHAIR 01 // LIVE IN CPT</span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-left">
                      <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold">
                        Ace of Fyt Grooming
                      </span>
                      <h3 className="font-display text-xl font-bold text-white mt-0.5">
                        Architectural Lineup & Hot Towel Finish
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Floating Micro-Badge */}
                <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center space-x-3 rounded-2xl border border-amber-500/30 bg-zinc-900/95 p-3.5 shadow-2xl backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-black">
                    <Flame className="h-5 w-5 fill-black" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Dissafyt Garment Lab</p>
                    <p className="text-[11px] text-zinc-400 font-mono">Batch 01 Released in CPT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INFINITE MARQUEE TICKER TAPE */}
      <div className="relative w-full overflow-hidden bg-amber-500 py-3.5 -rotate-1 shadow-lg shadow-amber-500/10">
        <div className="animate-marquee flex items-center whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, idx) => (
            <div key={idx} className="flex items-center mx-6">
              <span className="text-xs sm:text-sm font-black tracking-widest uppercase text-black font-display">
                {item}
              </span>
              <span className="mx-6 text-black/50 text-xs font-black">★</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. TWO PILLARS BENTO SHOWCASE */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
            THE DUAL PILLARS
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
            Crafted for the Exclusive
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Engineered at the intersection of artisanal South African grooming and high-density streetwear.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pillar 1: Ace of Fyt Barbershop */}
          <div className="group relative rounded-3xl border border-zinc-800 hover:border-amber-500/50 bg-gradient-to-b from-zinc-900/70 to-zinc-950 p-8 sm:p-10 transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Scissors className="h-6 w-6 stroke-[2]" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 border border-zinc-800 rounded-full px-3 py-1 bg-black/40">
                  PILLAR 01 // CPT GROOMING
                </span>
              </div>

              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
                  Ace of Fyt Barbershop
                </h3>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                  Precision skin fades, architectural beard sculpts, and steamed essential-oil hot towels.
                  Zero queue waiting times with real-time chair reservations in Cape Town.
                </p>
              </div>

              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <Image
                  src="/images/barber-tools.png"
                  alt="Barber Tools & Craft"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 text-[11px] font-mono text-amber-400">
                  FLAGSHIP STUDIO // CHAIRS 01-04
                </div>
              </div>

              {/* Perks List */}
              <ul className="space-y-2 text-xs text-zinc-300 border-t border-zinc-800/80 pt-4">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span>The Executive Combo: Hot towel, razor sculpt, scalp therapy</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span>Guaranteed slot start time &bull; VIP lounge espresso bar</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span>Integrated monthly subscriptions powered by PayFast</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800/80 relative z-10">
              <Link
                href="/book"
                className="w-full inline-flex items-center justify-between rounded-xl bg-zinc-900 hover:bg-amber-500 hover:text-black border border-zinc-700 hover:border-amber-400 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all"
              >
                <span>Reserve Chair at Cape Town Flagship</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>

          {/* Pillar 2: Dissafyt Streetwear Lab */}
          <div className="group relative rounded-3xl border border-zinc-800 hover:border-white/50 bg-gradient-to-b from-zinc-900/70 to-zinc-950 p-8 sm:p-10 transition-all duration-300 flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white">
                  <ShoppingBag className="h-6 w-6 stroke-[2]" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 border border-zinc-800 rounded-full px-3 py-1 bg-black/40">
                  PILLAR 02 // GARMENT LAB
                </span>
              </div>

              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
                  Dissafyt Garment Lab
                </h3>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                  Heavyweight textiles meeting high-definition direct-to-garment prints. Limited batch capsules
                  cut from 280GSM French terry and custom-distressed silhouettes.
                </p>
              </div>

              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <Image
                  src="/images/hero-collaboration.png"
                  alt="Dissafyt Streetwear Capsule"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 text-[11px] font-mono text-white">
                  BATCH 01 // 280GSM HEAVYWEIGHT
                </div>
              </div>

              {/* Perks List */}
              <ul className="space-y-2 text-xs text-zinc-300 border-t border-zinc-800/80 pt-4">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-white flex-shrink-0" />
                  <span>280GSM ultra-dense luxury French terry & ring-spun cotton</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-white flex-shrink-0" />
                  <span>Direct-to-garment DTG print clarity that never cracks</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-white flex-shrink-0" />
                  <span>Express Courier Guy delivery across South Africa</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800/80 relative z-10">
              <Link
                href="/shop"
                className="w-full inline-flex items-center justify-between rounded-xl bg-zinc-900 hover:bg-white hover:text-black border border-zinc-700 hover:border-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all"
              >
                <span>Enter Streetwear Drop Room</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THE SIGNATURE SERVICES MENU */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950 p-8 sm:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-900">
            <div className="space-y-2 max-w-xl">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                CAPE TOWN FLAGSHIP MENU
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white">
                Master Barber Services
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Crafted for gentlemen who demand razor perfection. Included with our VIP monthly memberships or available via instant chair booking.
              </p>
            </div>
            <Link
              href="/book"
              className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300"
            >
              <span>View Full Booking Schedule</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            {displayServices.map((service, index) => {
              const isHighlight = index === 0;
              return (
                <div
                  key={service.id}
                  className={`rounded-2xl p-6 space-y-4 relative ${
                    isHighlight
                      ? 'border border-amber-500/30 bg-amber-500/5'
                      : 'border border-zinc-800 bg-zinc-900/50'
                  }`}
                >
                  {isHighlight && (
                    <div className="absolute top-4 right-4 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30 font-mono">
                      FLAGSHIP SIGNATURE
                    </div>
                  )}
                  <div>
                    <h4 className="font-display text-xl font-extrabold text-white">{service.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {service.description || `${service.duration_minutes || 30} min session with precision razor finishing.`}
                    </p>
                  </div>
                  <div
                    className={`flex items-baseline space-x-2 pt-2 border-t ${
                      isHighlight ? 'border-amber-500/20' : 'border-zinc-800'
                    }`}
                  >
                    <span
                      className={`text-2xl font-black font-display ${
                        isHighlight ? 'text-amber-400' : 'text-white'
                      }`}
                    >
                      R {Number(service.price).toFixed(0)}
                    </span>
                    <span className="text-xs text-zinc-400">
                      / {service.duration_minutes || 30} min chair session
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. VIP MONTHLY MEMBERSHIPS SECTION */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6">
        <SubscriptionCarousel
          title="ACE OF FYT GUILD MEMBERSHIPS"
          subtitle="Cape Town's most exclusive recurring haircut club. Guaranteed chair times, zero queue delays, and VIP priority on Dissafyt streetwear drops. Powered by PayFast recurring billing."
        />
      </section>

      {/* 6. CAPE TOWN FLAGSHIP LOCATION & HOURS */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>OPEN TUE – SUN &bull; CAPE TOWN, SOUTH AFRICA</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white">
                Dissafyt Flagship Lounge & Studio
              </h2>

              <p className="text-sm text-zinc-400 max-w-lg">
                Conveniently located in Cape Town. Experience the cutting-edge fusion of high-precision grooming, garment prototyping, and specialty espresso.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-zinc-500 uppercase">Hours</span>
                  <p className="text-white font-semibold">Tue – Sat: 09:00 – 19:00</p>
                  <p className="text-zinc-400">Sun: 10:00 – 16:00</p>
                  <p className="text-zinc-500">Mon: VIP Private Appointments</p>
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-500 uppercase">Flagship Location</span>
                  <p className="text-white font-semibold">Dissafyt Studio, Cape Town</p>
                  <p className="text-zinc-400">Western Cape, South Africa</p>
                  <p className="text-amber-400">SAST (UTC+2)</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-4">
              <Link
                href="/book"
                className="w-full text-center rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-4 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-amber-500/10 transition-all"
              >
                Book Chair in Cape Town
              </Link>
              <Link
                href="/shop"
                className="w-full text-center rounded-xl border border-zinc-700 hover:border-zinc-500 bg-zinc-900 px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-200 transition-all"
              >
                Explore Streetwear Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
