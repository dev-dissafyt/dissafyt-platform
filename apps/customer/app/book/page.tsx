'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardTitle, CardContent, Button, Input, Label } from '@dissafyt/ui';
import {
  Scissors,
  Clock,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  User,
  Calendar as CalendarIcon,
  ChevronRight,
  AlertCircle,
  Check,
  Sparkles,
  MapPin,
  CalendarCheck,
  ShieldCheck,
  Crown,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { SubscriptionCarousel } from '../components/subscription-carousel';

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

interface StaffMember {
  id: string;
  display_name: string;
  bio?: string | null;
  is_active: boolean;
}

interface AvailableSlot {
  time: string;
  startTime: string;
  endTime: string;
  availableStaff: { id: string; display_name: string }[];
}

function BookContent() {
  const searchParams = useSearchParams();
  const isSubscribedParam = searchParams.get('subscribed') === 'true';
  const planParam = searchParams.get('plan') || 'twice';
  const isCancelledParam = searchParams.get('cancelled') === 'true';

  const [justSubscribed, setJustSubscribed] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscription Gating State
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);

  // Wizard Selection States
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState('');

  // Availability State
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Auth & Booking Status
  const [userSession, setUserSession] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Quick Auth Form (if guest wants to log in or register right here)
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authIsSignUp, setAuthIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Generate the next 14 bookable days
  const dateOptions = generateNextDays(14);

  // Function to check active subscription status
  async function checkSubscriptionStatus(token?: string) {
    setCheckingSubscription(true);
    if (!token) {
      setHasActiveSubscription(false);
      setActiveSubscription(null);
      setCheckingSubscription(false);
      return;
    }

    try {
      const res = await fetch('/api/subscriptions/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHasActiveSubscription(Boolean(data.hasActiveSubscription));
        setActiveSubscription(data.subscription || null);
      } else {
        setHasActiveSubscription(false);
        setActiveSubscription(null);
      }
    } catch (err) {
      console.error('Subscription check error:', err);
      setHasActiveSubscription(false);
    } finally {
      setCheckingSubscription(false);
    }
  }

  // Auto-confirm subscription on return from checkout
  async function confirmReturnSubscription(token: string) {
    try {
      setJustSubscribed(true);
      await fetch('/api/subscriptions/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planCode: planParam }),
      });
    } catch (e) {
      console.warn('Subscription auto-confirm error:', e);
    }
  }

  // 1. Initial Load: Services, Staff, User Session & Subscription Status
  useEffect(() => {
    async function init() {
      try {
        // Check session
        const supabase = getSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getSession();
        const session = authData?.session || null;
        setUserSession(session);

        // Fetch subscription status & profile if logged in
        if (session) {
          if (isSubscribedParam) {
            await confirmReturnSubscription(session.access_token);
          }
          await checkSubscriptionStatus(session.access_token);

          // Fetch profile for prefilling
          fetch('/api/users/me', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
            .then((r) => r.ok && r.json())
            .then((p) => p && setCustomerProfile(p))
            .catch((e) => console.error(e));
        } else {
          setCheckingSubscription(false);
        }

        // Listen to auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          setUserSession(newSession);
          if (newSession) {
            if (isSubscribedParam) {
              await confirmReturnSubscription(newSession.access_token);
            }
            await checkSubscriptionStatus(newSession.access_token);
          } else {
            setHasActiveSubscription(false);
            setActiveSubscription(null);
            setCheckingSubscription(false);
          }
        });

        // Fetch services
        const sRes = await fetch('/api/services');
        if (sRes.ok) {
          const sData: Service[] = await sRes.json();
          if (sData && sData.length > 0) {
            setServices(sData);
            // Default select first regular appointment
            const firstAppointment = sData.find((s) => !s.is_subscription);
            if (firstAppointment) setSelectedService(firstAppointment);
          }
        }

        // Fetch staff
        const stRes = await fetch('/api/staff');
        if (stRes.ok) {
          const stData: StaffMember[] = await stRes.json();
          setStaffList(stData);
        }

        // Set default date to tomorrow or next valid day
        if (dateOptions.length > 0) {
          const firstAvailable = dateOptions.find((d) => !d.isSunday) || dateOptions[0];
          setSelectedDate(firstAvailable.iso);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. Fetch Availability whenever Service, Barber, or Date changes
  useEffect(() => {
    if (!selectedService || !selectedDate) return;

    async function fetchAvailability() {
      setLoadingSlots(true);
      setAvailabilityError(null);
      setSelectedSlot(null);

      try {
        const staffParam = selectedStaffId ? `&staffId=${selectedStaffId}` : '';
        const res = await fetch(
          `/api/bookings/availability?date=${selectedDate}&serviceId=${selectedService!.id}${staffParam}`
        );

        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        } else {
          const err = await res.json();
          setAvailabilityError(err.error || 'Failed to load time slots.');
          setSlots([]);
        }
      } catch (e) {
        setAvailabilityError('Error checking slot availability.');
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailability();
  }, [selectedService?.id, selectedStaffId, selectedDate]);

  // Quick Inline Auth Handler
  async function handleInlineAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const supabase = getSupabaseBrowserClient();

    try {
      if (authIsSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: { full_name: authFullName },
          },
        });
        if (error) throw error;
        if (data.session) {
          setUserSession(data.session);
          setShowAuthForm(false);
        } else {
          setAuthError('Sign up successful! Please check your email or login to continue.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        if (data.session) {
          setUserSession(data.session);
          setShowAuthForm(false);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  }

  // Final Booking Submission
  async function handleConfirmBooking() {
    if (!selectedService || !selectedSlot) {
      setBookingError('Please select both a service and an available time slot.');
      return;
    }

    if (!userSession) {
      setShowAuthForm(true);
      return;
    }

    setSubmitting(true);
    setBookingError(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userSession.access_token}`,
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          staff_id: selectedStaffId !== 'any' ? selectedStaffId : null,
          start_time: selectedSlot.startTime,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.booking) {
        setConfirmedBooking({
          ...data.booking,
          serviceName: selectedService.name,
          servicePrice: selectedService.price,
          slotTime: selectedSlot.time,
          date: selectedDate,
        });
      } else {
        setBookingError(data.error || 'Failed to confirm booking.');
      }
    } catch (err: any) {
      setBookingError(err.message || 'An error occurred while confirming your booking.');
    } finally {
      setSubmitting(false);
    }
  }

  const appointments = services.filter((s) => !s.is_subscription);
  const subscriptions = services.filter((s) => s.is_subscription);

  // Success Confirmation Screen
  if (confirmedBooking) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20">
        <Card className="border-emerald-500/40 bg-zinc-950 p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <Check className="h-8 w-8 stroke-[3]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Appointment Confirmed!</h1>
            <p className="text-sm text-zinc-400">
              Your appointment at <span className="text-white font-semibold">Ace of Fyt Barbershop</span> has been secured.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5 text-left space-y-3">
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Service</span>
              <span className="text-sm font-semibold text-white">{confirmedBooking.serviceName}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Date & Time</span>
              <span className="text-sm font-semibold text-amber-400">
                {confirmedBooking.date} at {confirmedBooking.slotTime}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Location</span>
              <span className="text-sm font-semibold text-white flex items-center">
                <MapPin className="h-3.5 w-3.5 text-amber-500 mr-1.5" /> Dissafyt Studio, Johannesburg
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Status</span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Confirmed
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Total</span>
              <span className="text-sm font-bold text-white">R {Number(confirmedBooking.servicePrice).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/account" className="flex-1">
              <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                View in My Account
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => {
                setConfirmedBooking(null);
                setSelectedSlot(null);
              }}
            >
              Book Another Slot
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading Membership Verification Screen
  if (checkingSubscription) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-24 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 animate-pulse">
          <Scissors className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Verifying Membership Access...</h2>
        <p className="text-xs text-zinc-500">Connecting to Ace of Fyt member registry.</p>
      </div>
    );
  }

  // GATING VIEW: Non-subscribers & Guests
  if (!hasActiveSubscription) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <Link href="/" className="inline-flex items-center text-xs text-zinc-400 hover:text-white mb-2">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Home
            </Link>
            <h1 className="text-3xl font-extrabold text-white flex items-center">
              <Scissors className="mr-3 h-8 w-8 text-amber-500" />
              Ace of Fyt Barbershop
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Precision fades, scissor craft, and hot towel sculpting.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg">
            <MapPin className="h-4 w-4 text-amber-500" />
            <span>Dissafyt Studio, Johannesburg</span>
          </div>
        </div>

        {/* Cancellation notification if customer backed out on PayFast */}
        {isCancelledParam && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 text-zinc-300 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-zinc-300">
              Subscription checkout was cancelled. Choose any membership plan below whenever you are ready to unlock priority booking.
            </p>
          </div>
        )}

        {/* Member Gating Educational Hero Card */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-zinc-900/90 to-zinc-950 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 ring-4 ring-amber-500/10">
            <Crown className="h-8 w-8" />
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center rounded-full bg-amber-500 px-3 py-0.5 text-xs font-black text-black uppercase tracking-wider">
              Member-Exclusive Grooming Schedule
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Grooming Appointments are Reserved for Members
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              To guarantee dedicated 1-on-1 chair time, master styling craft, and <span className="text-white font-semibold">zero queue waiting</span> for our community, our booking calendar is exclusive to active Ace of Fyt subscribers.
            </p>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4 text-left">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-1.5">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
                <Clock className="h-4 w-4" />
                <span>Zero Wait Time</span>
              </div>
              <p className="text-xs text-zinc-400">Walk straight to your designated barber chair right at your confirmed booking slot.</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-1.5">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
                <Scissors className="h-4 w-4" />
                <span>Master Barber Craft</span>
              </div>
              <p className="text-xs text-zinc-400">Precision fades, hot towel conditioning, and tailored beard alignment every single visit.</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-1.5">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
                <CreditCard className="h-4 w-4" />
                <span>Predictable Value</span>
              </div>
              <p className="text-xs text-zinc-400">Save up to 40% vs walk-ins with automated monthly billing powered securely by PayFast.</p>
            </div>
          </div>
        </div>

        {/* The Carousel for Immediate Subscription */}
        <div className="space-y-4 pt-4">
          <SubscriptionCarousel
            title="Select a Membership to Unlock Booking"
            subtitle="Subscribe now to unlock instant appointment scheduling. Your membership details and priority slots will be automatically bound to your account."
            onSubscribed={() => {
              if (userSession) checkSubscriptionStatus(userSession.access_token);
            }}
          />
        </div>
      </div>
    );
  }

  // UNLOCKED VIEW: Active Members
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <Link href="/" className="inline-flex items-center text-xs text-zinc-400 hover:text-white mb-2">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Home
          </Link>
          <h1 className="text-3xl font-extrabold text-white flex items-center">
            <Scissors className="mr-3 h-8 w-8 text-amber-500" />
            Ace of Fyt Barbershop
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Precision fades, scissor work, and beard sculpting. Select your master barber and preferred time slot.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg">
          <MapPin className="h-4 w-4 text-amber-500" />
          <span>Dissafyt Studio, Johannesburg</span>
        </div>
      </div>

      {/* Active Member VIP Status Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white">
                Active Member: {activeSubscription?.plan_name || 'Ace of Fyt Member'}
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                Priority Access Active
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Welcome back{customerProfile?.full_name ? `, ${customerProfile.full_name}` : ''}! Your appointment slot is guaranteed.
            </p>
          </div>
        </div>

        <div className="text-xs text-zinc-400 border-l border-zinc-800 pl-3 hidden sm:block">
          <div>Next Renewal: {activeSubscription?.current_period_end ? new Date(activeSubscription.current_period_end).toLocaleDateString() : 'Active'}</div>
          <div className="text-emerald-400 font-semibold">Priority Booking Unlocked</div>
        </div>
      </div>

      {/* Returning Subscriber Celebration Banner */}
      {(justSubscribed || (isSubscribedParam && hasActiveSubscription)) && (
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-900 p-4 text-amber-300 flex items-center gap-3.5 shadow-lg shadow-amber-500/5">
          <Sparkles className="w-6 h-6 text-amber-400 shrink-0 animate-bounce" />
          <div className="space-y-0.5">
            <p className="font-bold text-white text-sm">🎉 Membership Confirmed & Active!</p>
            <p className="text-xs text-amber-200/90">
              Welcome to Ace of Fyt VIP Grooming. Select your service, barber, and preferred time slot below to secure your chair.
            </p>
          </div>
        </div>
      )}

      {/* Main Interactive Booking Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Steps 1, 2, 3 */}
        <div className="lg:col-span-8 space-y-8">
          {/* STEP 1: Select Grooming Service */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black text-xs font-bold">
                1
              </span>
              <h2 className="text-lg font-bold text-white">Choose Service</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {appointments.map((service) => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-white">{service.name}</h3>
                        {isSelected && <CheckCircle className="h-4 w-4 text-amber-500" />}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {service.description || 'Master grooming treatment.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 flex items-center">
                        <Clock className="mr-1 h-3 w-3" /> {service.duration_minutes} mins
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        Included
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Choose Barber */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black text-xs font-bold">
                2
              </span>
              <h2 className="text-lg font-bold text-white">Select Master Barber</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Any Barber Option */}
              <div
                onClick={() => setSelectedStaffId('any')}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedStaffId === 'any'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-amber-400 font-bold text-xs">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Any Available Barber</div>
                    <div className="text-xs text-zinc-400">Fastest availability</div>
                  </div>
                </div>
              </div>

              {/* Individual Barbers */}
              {staffList.map((barber) => {
                const isSelected = selectedStaffId === barber.id;
                return (
                  <div
                    key={barber.id}
                    onClick={() => setSelectedStaffId(barber.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-white font-bold text-sm">
                        {barber.display_name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-white truncate">
                          {barber.display_name}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
                          {barber.bio || 'Master Barber'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Select Date & Available Time Slots */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black text-xs font-bold">
                3
              </span>
              <h2 className="text-lg font-bold text-white">Pick Date & Time</h2>
            </div>

            {/* Horizontal Date Picker */}
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
              {dateOptions.map((d) => {
                const isSelected = selectedDate === d.iso;
                return (
                  <button
                    key={d.iso}
                    disabled={d.isSunday}
                    onClick={() => setSelectedDate(d.iso)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-3 rounded-xl border text-center transition-all ${
                      d.isSunday
                        ? 'border-zinc-900 bg-zinc-950/40 text-zinc-600 opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'border-amber-500 bg-amber-500 text-black font-bold'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider">{d.dayName}</span>
                    <span className="text-lg font-bold">{d.dayNumber}</span>
                    <span className="text-[9px] uppercase">{d.monthName}</span>
                  </button>
                );
              })}
            </div>

            {/* Available Time Slots Grid */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-400 font-medium">
                  Available slots for <span className="text-white font-semibold">{selectedDate}</span>:
                </span>
                {loadingSlots && <span className="text-xs text-amber-500 animate-pulse">Checking slots...</span>}
              </div>

              {loadingSlots ? (
                <div className="py-8 text-center text-sm text-zinc-500">Checking barber schedule...</div>
              ) : availabilityError ? (
                <div className="py-4 text-center text-xs text-rose-400">{availabilityError}</div>
              ) : slots.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No slots available for this date. Barbershop is closed or fully booked.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500 text-black shadow-md shadow-amber-500/20'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Order Summary & Confirmation Box */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/90 p-6 sticky top-24 space-y-6">
            <CardTitle className="text-lg text-white flex items-center">
              <CalendarCheck className="mr-2 h-5 w-5 text-amber-500" />
              Booking Summary
            </CardTitle>

            <div className="space-y-3 text-xs border-b border-zinc-800 pb-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Membership Tier</span>
                <span className="text-amber-400 font-semibold">{activeSubscription?.plan_name || 'Active Member'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Service</span>
                <span className="text-white font-semibold">{selectedService?.name || 'None selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Duration</span>
                <span className="text-white">{selectedService?.duration_minutes || 0} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Barber</span>
                <span className="text-white font-medium">
                  {selectedStaffId === 'any'
                    ? 'Any Available Barber'
                    : staffList.find((s) => s.id === selectedStaffId)?.display_name || 'Selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Date</span>
                <span className="text-white">{selectedDate || 'Not chosen'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Time</span>
                <span className="text-amber-400 font-bold">{selectedSlot?.time || 'Not chosen'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Location</span>
                <span className="text-white font-medium flex items-center">
                  <MapPin className="h-3 w-3 mr-1 text-amber-500" /> Dissafyt Studio, JHB
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-zinc-300">Appointment Fee</span>
              <span className="text-lg text-emerald-400">
                Included <span className="text-[10px] text-zinc-500 font-normal">in Membership</span>
              </span>
            </div>

            {/* Special Requests / Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Grooming Notes (Optional)</Label>
              <Input
                placeholder="e.g., skin fade, taper, keep mustache"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-xs text-white"
              />
            </div>

            {bookingError && (
              <div className="rounded border border-rose-500/20 bg-rose-500/10 p-2 text-xs text-rose-400">
                {bookingError}
              </div>
            )}

            <Button
              disabled={!selectedSlot || submitting}
              onClick={handleConfirmBooking}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm py-5"
            >
              {submitting ? 'Confirming Appointment...' : 'Confirm Appointment'}
            </Button>
          </Card>
        </div>
      </div>

      {/* Subscription Carousel Section (Membership Tier Management) */}
      <div className="pt-12 border-t border-zinc-800">
        <SubscriptionCarousel
          title="Your Barbershop Membership Plan"
          subtitle="You are currently an active subscriber. You can review plan benefits, change plans, or add family members below."
        />
      </div>
    </div>
  );
}

/**
 * Helper to generate an array of bookable dates
 */
function generateNextDays(daysCount: number) {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateNum = String(d.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${dateNum}`;

    const isSunday = d.getDay() === 0;

    days.push({
      iso,
      dayName: dayNames[d.getDay()],
      dayNumber: d.getDate(),
      monthName: monthNames[d.getMonth()],
      isSunday,
    });
  }

  return days;
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-4xl px-4 py-24 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 animate-pulse">
            <Scissors className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Loading Booking Portal...</h2>
        </div>
      }
    >
      <BookContent />
    </Suspense>
  );
}
