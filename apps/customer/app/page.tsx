import Link from 'next/link';
import Image from 'next/image';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, PayfastButton } from '@dissafyt/ui';
import { Scissors, ShoppingBag, ShieldCheck, Calendar, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 py-24 sm:py-32">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              One Unified Account &bull; DISSafyt Ecosystem
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
              Elevate Your Style & Grooming in <span className="text-amber-500">One Place</span>
            </h1>
            <p className="text-lg leading-8 text-zinc-400">
              Experience DISSafyt: curated streetwear and premier grooming appointments with Ace of Fyt barbershop — powered by a single account.
            </p>
            <div className="flex items-center justify-center gap-x-4 pt-4">
              <Link href="/book">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                  <Scissors className="mr-2 h-5 w-5" />
                  Book an Appointment
                </Button>
              </Link>
              <Link href="/shop">
                <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-200 hover:bg-zinc-800">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Explore Shop
                </Button>
              </Link>
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

          {/* DISSafyt Clothing */}
          <Card className="border-zinc-800 bg-zinc-900/50 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">DISSafyt Clothing</h2>
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
