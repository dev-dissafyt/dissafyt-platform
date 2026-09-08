'use client';

import { useEffect, useState } from 'react';
import { Card, CardTitle, Button, PayfastButton } from '@dissafyt/ui';
import { Scissors, Clock, ArrowLeft, CheckCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  is_subscription?: boolean;
  plan_code?: string | null;
}

const DEFAULT_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Classic Haircut',
    description: 'Consultation, precision fade or scissor cut, wash & style.',
    duration_minutes: 30,
    price: 120.00,
    is_active: true,
    is_subscription: false,
  },
  {
    id: 's2',
    name: 'Beard Sculpt & Shape',
    description: 'Hot towel treatment, razor line-up, and beard conditioning oils.',
    duration_minutes: 20,
    price: 80.00,
    is_active: true,
    is_subscription: false,
  },
  {
    id: 's3',
    name: 'The Full Combo',
    description: 'Complete signature haircut, full beard grooming, wash & hot towel.',
    duration_minutes: 50,
    price: 180.00,
    is_active: true,
    is_subscription: false,
  },
];

export default function BookPage() {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data: Service[] = await res.json();
          if (data && data.length > 0) {
            setServices(data);
          }
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  const appointments = services.filter((s) => !s.is_subscription);
  const subscriptions = services.filter((s) => s.is_subscription);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-16 space-y-12">
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

      {/* Standard Appointments */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          Standard Grooming Services
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {appointments.map((service) => (
            <Card
              key={service.id}
              className="border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-3">
                <CardTitle className="text-xl text-white">{service.name}</CardTitle>
                <p className="text-sm text-zinc-400">
                  {service.description || 'Master barber service.'}
                </p>
                <div className="flex items-center text-xs text-zinc-500 space-x-3 pt-2">
                  <span className="flex items-center">
                    <Clock className="mr-1 h-3.5 w-3.5" /> {service.duration_minutes} mins
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="mr-1 h-3.5 w-3.5 text-amber-500" /> Available
                  </span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xl font-bold text-amber-400">
                  R {Number(service.price).toFixed(2)}
                </span>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                  Book Slot
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Monthly PayFast Subscriptions (if any present or default) */}
      <div className="space-y-6 pt-6 border-t border-zinc-800">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center">
            <CreditCard className="mr-2 h-5 w-5 text-amber-500" />
            Monthly Barbershop Subscriptions
          </h2>
          <p className="text-xs text-zinc-400">
            Enjoy priority bookings and automatic monthly billing powered securely by PayFast.
          </p>
        </div>

        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptions.map((sub) => (
              <Card key={sub.id} className="border-amber-500/50 bg-zinc-900/80 p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border border-amber-500/30">
                    Monthly Plan
                  </span>
                  <CardTitle className="text-xl text-white">{sub.name}</CardTitle>
                  <p className="text-sm text-zinc-400">{sub.description}</p>
                  <div className="text-2xl font-extrabold text-amber-400 pt-2">
                    R {Number(sub.price).toFixed(2)} <span className="text-xs text-zinc-500 font-normal">/mo</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  {sub.plan_code && ['solo', 'twice', 'father-son'].includes(sub.plan_code) ? (
                    <PayfastButton planId={sub.plan_code} />
                  ) : (
                    <Button className="w-full bg-amber-500 text-black font-semibold">
                      Subscribe with PayFast
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <CardTitle className="text-xl text-white">The Solo</CardTitle>
                <p className="text-sm text-zinc-400">1 fresh haircut per month.</p>
                <div className="text-2xl font-extrabold text-white">R100 <span className="text-xs text-zinc-500">/mo</span></div>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <PayfastButton planId="solo" />
              </div>
            </Card>
            <Card className="border-amber-500 bg-zinc-900/80 p-6 flex flex-col justify-between shadow-lg shadow-amber-500/10">
              <div className="space-y-3">
                <span className="rounded bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  Most Popular
                </span>
                <CardTitle className="text-xl text-white">The Regular</CardTitle>
                <p className="text-sm text-zinc-400">2 fresh haircuts per month with queue skip.</p>
                <div className="text-2xl font-extrabold text-amber-400">R180 <span className="text-xs text-zinc-500">/mo</span></div>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <PayfastButton planId="twice" featured />
              </div>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <CardTitle className="text-xl text-white">Father n Son</CardTitle>
                <p className="text-sm text-zinc-400">1 combo cut per month for you and your boy.</p>
                <div className="text-2xl font-extrabold text-white">R180 <span className="text-xs text-zinc-500">/mo</span></div>
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <PayfastButton planId="father-son" />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
