import Link from 'next/link';
import Image from 'next/image';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, PayfastButton } from '@dissafyt/ui';
import { Scissors, ShoppingBag, ShieldCheck, Calendar, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 py-16 sm:py-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-400">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                One Unified Account &bull; Dissafyt Ecosystem
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white leading-tight">
                Elevate Your Style & Grooming in <span className="text-amber-500">One Place</span>
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-zinc-400 max-w-xl">
                Experience Dissafyt: curated streetwear apparel drops and premier grooming appointments with Ace of Fyt barbershop — managed under a single unified account.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/book">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                    <Scissors className="mr-2 h-5 w-5" />
                    Book an Appointment
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Explore Shop
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-zinc-500 border-t border-zinc-800/80">
                <span className="flex items-center text-zinc-400">
                  <CheckCircle2 className="mr-1.5 h-4 w-4 text-amber-500" />
                  Instant PayFast ZAR Checkout
                </span>
                <span className="flex items-center text-zinc-400">
                  <CheckCircle2 className="mr-1.5 h-4 w-4 text-amber-500" />
                  Door-to-door Courier Guy Delivery
                </span>
                <span className="flex items-center text-zinc-400">
                  <CheckCircle2 className="mr-1.5 h-4 w-4 text-amber-500" />
                  Master Barbers with Real-Time Slots
                </span>
              </div>
            </div>

            {/* Right Column: Hero Merchandise Artwork */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-md rounded-2xl border border-amber-500/20 bg-zinc-900/60 p-4 backdrop-blur shadow-2xl shadow-amber-500/10 group hover:border-amber-500/40 transition-all">
                <div className="overflow-hidden rounded-xl bg-zinc-950/80 p-2">
                  <Image
                    src="/hero-img.svg"
                    alt="Dissafyt Signature Print"
                    width={500}
                    height={400}
                    className="w-full h-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                    priority
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs px-1">
                  <span className="text-[11px] font-medium text-zinc-400 flex items-center">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                    Signature Dissafyt Print
                  </span>
                  <span className="rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 border border-amber-500/20">
                    Future Merchandise Drop
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Pillars Section: Barbershop & Clothing */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Ace of Fyt Barbershop */}
          <Card className="border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Scissors className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Ace of Fyt Barbershop</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Precision cuts, beard styling, and personalized grooming. View master barbers, real-time availability, and secure your slot in seconds.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-sm font-medium text-amber-500">Appointments & Walk-ins</span>
              <Link href="/book">
                <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white">
                  Book Slot <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Dissafyt Clothing */}
          <Card className="border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Dissafyt Clothing</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                High quality apparel and limited-edition drops. Track inventory in real-time and enjoy unified order checkout.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-sm font-medium text-amber-500">New Drops Coming Soon</span>
              <Link href="/shop">
                <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white">
                  Visit Shop <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* PayFast Monthly Memberships Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-white">Barbershop Memberships</h2>
          <p className="text-zinc-400 text-sm">
            Save on fresh cuts with monthly subscriptions powered securely by PayFast. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Plan 1 */}
          <Card className="border-zinc-800 bg-zinc-900/70 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl text-white">The Solo</CardTitle>
              <CardDescription>Keep sharp every month</CardDescription>
              <div className="mt-4 text-3xl font-extrabold text-white">
                R100 <span className="text-sm font-normal text-zinc-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-300">
              <ul className="space-y-2">
                <li>&bull; 1 haircut per month</li>
                <li>&bull; Book anytime in the month</li>
                <li>&bull; Priority booking slots</li>
                <li>&bull; Cancel anytime</li>
              </ul>
              <div className="pt-4">
                <PayfastButton planId="solo" />
              </div>
            </CardContent>
          </Card>

          {/* Plan 2 - Featured */}
          <Card className="border-amber-500 bg-zinc-900/90 relative flex flex-col justify-between shadow-lg shadow-amber-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-black uppercase tracking-wider">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="text-xl text-white">The Regular</CardTitle>
              <CardDescription>Never let it grow out</CardDescription>
              <div className="mt-4 text-3xl font-extrabold text-amber-400">
                R180 <span className="text-sm font-normal text-zinc-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-300">
              <ul className="space-y-2">
                <li>&bull; 2 haircuts per month</li>
                <li>&bull; Best value per cut</li>
                <li>&bull; Skip the queue</li>
                <li>&bull; Cancel anytime</li>
              </ul>
              <div className="pt-4">
                <PayfastButton planId="twice" featured />
              </div>
            </CardContent>
          </Card>

          {/* Plan 3 */}
          <Card className="border-zinc-800 bg-zinc-900/70 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-xl text-white">Father n Son</CardTitle>
              <CardDescription>Bonding time, sorted</CardDescription>
              <div className="mt-4 text-3xl font-extrabold text-white">
                R180 <span className="text-sm font-normal text-zinc-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-300">
              <ul className="space-y-2">
                <li>&bull; 1 combo cut per month</li>
                <li>&bull; Father + son together</li>
                <li>&bull; Great for the little ones</li>
                <li>&bull; Cancel anytime</li>
              </ul>
              <div className="pt-4">
                <PayfastButton planId="father-son" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
