import { Card, CardContent, CardHeader, CardTitle, Button, PayfastButton } from '@dissafyt/ui';
import { Scissors, Calendar, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function BookPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-16 space-y-10">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Scissors className="mr-3 h-8 w-8 text-amber-500" />
          Ace of Fyt Barbershop
        </h1>
        <p className="text-zinc-400">
          Book your session with our master barbers. Fast booking, real-time availability, or monthly subscription plans.
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <CardTitle className="text-xl text-white">Classic Haircut</CardTitle>
            <p className="text-sm text-zinc-400">
              Consultation, precision fade or scissor cut, wash & style.
            </p>
            <div className="flex items-center text-xs text-zinc-500 space-x-3 pt-2">
              <span className="flex items-center"><Clock className="mr-1 h-3.5 w-3.5" /> 30 mins</span>
              <span className="flex items-center"><CheckCircle className="mr-1 h-3.5 w-3.5 text-amber-500" /> Top Rated</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xl font-bold text-amber-400">R 120.00</span>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
              Select Slot
            </Button>
          </div>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <CardTitle className="text-xl text-white">Beard Sculpt & Shape</CardTitle>
            <p className="text-sm text-zinc-400">
              Hot towel treatment, razor line-up, and beard conditioning oils.
            </p>
            <div className="flex items-center text-xs text-zinc-500 space-x-3 pt-2">
              <span className="flex items-center"><Clock className="mr-1 h-3.5 w-3.5" /> 20 mins</span>
              <span className="flex items-center"><CheckCircle className="mr-1 h-3.5 w-3.5 text-amber-500" /> Premium</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xl font-bold text-amber-400">R 80.00</span>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
              Select Slot
            </Button>
          </div>
        </Card>

        <Card className="border-amber-500/50 bg-zinc-900/80 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <CardTitle className="text-xl text-white">The Full Combo</CardTitle>
            <p className="text-sm text-zinc-400">
              Complete signature haircut, full beard grooming, wash & hot towel.
            </p>
            <div className="flex items-center text-xs text-zinc-500 space-x-3 pt-2">
              <span className="flex items-center"><Clock className="mr-1 h-3.5 w-3.5" /> 50 mins</span>
              <span className="flex items-center"><CheckCircle className="mr-1 h-3.5 w-3.5 text-amber-500" /> All-in-One</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xl font-bold text-amber-400">R 180.00</span>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
              Select Slot
            </Button>
          </div>
        </Card>
      </div>

      {/* Subscription Note */}
      <Card className="border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Get monthly fresh cuts with a PayFast membership</h3>
            <p className="text-sm text-zinc-400">
              Unlimited convenience with automated monthly subscription renewals.
            </p>
          </div>
          <Link href="/#memberships">
            <Button variant="outline" className="border-zinc-700 text-zinc-200 hover:bg-zinc-800">
              View Memberships
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
