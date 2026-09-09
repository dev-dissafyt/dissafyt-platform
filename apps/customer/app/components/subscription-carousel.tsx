'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@dissafyt/ui';
import { ChevronLeft, ChevronRight, Check, Sparkles, Shield, UserCheck, CreditCard, Flame } from 'lucide-react';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { AuthModal } from './auth-modal';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  featured?: boolean;
  perks: string[];
}

export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'solo',
    name: 'The Solo',
    tagline: 'Keep sharp every month',
    price: 100,
    perks: [
      '1 fresh haircut per month',
      'Book anytime in the month',
      'Priority booking access',
      'Cancel or pause anytime',
    ],
  },
  {
    id: 'twice',
    name: 'The Regular',
    tagline: 'Never let it grow out',
    price: 180,
    featured: true,
    perks: [
      '2 fresh haircuts per month',
      'Best value per cut (R90/cut)',
      'Skip the queue & walk-in priority',
      'Complimentary hot towel finish',
      'Cancel or pause anytime',
    ],
  },
  {
    id: 'executive',
    name: 'The Executive',
    tagline: 'Full combo, twice a month',
    price: 350,
    perks: [
      '2 Full Combos per month (Cut + Beard)',
      'Hot towel sculpting & razor line-up',
      'Queue skip & VIP priority booking access',
      'Complimentary scalp conditioning & styling',
      'Cancel or pause anytime',
    ],
  },
];

interface SubscriptionCarouselProps {
  title?: string;
  subtitle?: string;
  onSubscribed?: () => void;
  showDemoActivator?: boolean;
}

export function SubscriptionCarousel({
  title = 'Ace of Fyt Barbershop Memberships',
  subtitle = 'Save on fresh cuts with monthly recurring memberships powered securely by PayFast. Guaranteed chair time, zero queues, and priority booking.',
  onSubscribed,
  showDemoActivator = true,
}: SubscriptionCarouselProps) {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(1); // Default center on "The Regular"
  const [userSession, setUserSession] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check auth session
  useEffect(() => {
    async function checkSession() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      setUserSession(data.session || null);

      const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
        setUserSession(session);
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    }
    checkSession();
  }, []);

  // Update active dot based on scroll position
  function handleScroll() {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    const cardWidth = 320; // approximate card width + gap
    const newIndex = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(Math.max(newIndex, 0), DEFAULT_PLANS.length - 1));
  }

  function scrollToIndex(index: number) {
    if (!carouselRef.current) return;
    const cardWidth = 320;
    carouselRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  }

  function scrollLeft() {
    scrollToIndex(Math.max(activeIndex - 1, 0));
  }

  function scrollRight() {
    scrollToIndex(Math.min(activeIndex + 1, DEFAULT_PLANS.length - 1));
  }

  // Handle subscribe click
  async function handleSubscribe(planId: string, isSandbox = false) {
    setErrorMsg(null);

    // If not authenticated, open Auth Modal first
    if (!userSession) {
      setPendingPlanId(planId);
      setAuthModalOpen(true);
      return;
    }

    setSubscribingPlanId(planId);

    try {
      const res = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userSession.access_token}`,
        },
        body: JSON.stringify({
          planCode: planId,
          isSandboxDemo: isSandbox,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize membership subscription.');
      }

      // If activated immediately (sandbox demo)
      if (data.activatedImmediately) {
        if (onSubscribed) {
          onSubscribed();
        } else {
          router.push('/book?subscribed=true');
        }
        return;
      }

      // PayFast form submission
      if (data.payfast) {
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
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during subscription checkout.');
    } finally {
      setSubscribingPlanId(null);
    }
  }

  function handleAuthSuccess(session: any) {
    setUserSession(session);
    if (pendingPlanId) {
      const plan = pendingPlanId;
      setPendingPlanId(null);
      // Small timeout to allow state to settle
      setTimeout(() => {
        handleSubscribe(plan);
      }, 100);
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header & Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
            <Sparkles className="h-3.5 w-3.5" />
            <span>VIP Grooming Guild</span>
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-black uppercase text-white tracking-tight">{title}</h2>
          <p className="text-xs md:text-sm text-zinc-400">{subtitle}</p>
        </div>

        {/* Carousel Arrow Buttons */}
        <div className="flex items-center space-x-2 self-end md:self-auto">
          <button
            onClick={scrollLeft}
            disabled={activeIndex === 0}
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Previous plan"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollRight}
            disabled={activeIndex === DEFAULT_PLANS.length - 1}
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Next plan"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Scrollable Track */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex space-x-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {DEFAULT_PLANS.map((plan, idx) => {
          const isFeatured = plan.featured;
          const isProcessing = subscribingPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className="flex-shrink-0 w-[290px] sm:w-[340px] snap-center transition-all duration-200"
            >
              <Card
                className={`h-full flex flex-col justify-between transition-all duration-200 ${
                  isFeatured
                    ? 'border-amber-500/80 bg-zinc-900/95 shadow-xl shadow-amber-500/10 relative ring-1 ring-amber-500/30'
                    : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-700'
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-3 py-0.5 text-[11px] font-extrabold text-black uppercase tracking-wider flex items-center shadow-md">
                    <Flame className="mr-1 h-3 w-3 fill-black" />
                    Most Popular
                  </div>
                )}

                <CardHeader className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-display text-xl font-bold uppercase tracking-tight text-white">{plan.name}</CardTitle>
                      <CardDescription className="text-xs text-zinc-400 mt-0.5">
                        {plan.tagline}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline">
                    <span className="font-display text-3xl font-black text-amber-400">R {plan.price}</span>
                    <span className="text-xs text-zinc-400 ml-1.5 font-mono">/ month</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-0">
                  <ul className="space-y-2.5 border-t border-zinc-800/80 pt-4 text-xs text-zinc-300">
                    {plan.perks.map((perk, i) => (
                      <li key={i} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 flex-shrink-0 text-amber-500" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2 pt-2">
                    <Button
                      disabled={isProcessing}
                      onClick={() => handleSubscribe(plan.id, false)}
                      className={`w-full font-bold text-xs py-2.5 transition ${
                        isFeatured
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      {isProcessing
                        ? 'Connecting PayFast...'
                        : userSession
                        ? `Subscribe with PayFast (R${plan.price}/mo)`
                        : `Sign Up to Subscribe (R${plan.price}/mo)`}
                    </Button>

                    {/* Developer / Staging Instant Unlock */}
                    {showDemoActivator && (
                      <button
                        type="button"
                        onClick={() => handleSubscribe(plan.id, true)}
                        className="w-full text-[10px] text-zinc-400 hover:text-amber-400 py-1 transition text-center"
                      >
                        ⚡ Test Sandbox: Activate 1-Click
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center items-center space-x-2 pt-1">
        {DEFAULT_PLANS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToIndex(idx)}
            className={`h-2 rounded-full transition-all duration-200 ${
              activeIndex === idx ? 'w-6 bg-amber-500' : 'w-2 bg-zinc-700 hover:bg-zinc-600'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Modal for Unauthenticated Users */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        title="Account Required to Subscribe"
        subtitle="Sign in or register your Dissafyt profile so we can link your monthly membership and pre-populate your priority booking schedule."
      />
    </div>
  );
}
