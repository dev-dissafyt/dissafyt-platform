'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@dissafyt/ui';
import {
  User,
  ShoppingBag,
  Scissors,
  LogOut,
  CheckCircle2,
  Shield,
  Clock,
  Package,
  Truck,
  ExternalLink,
  Bell,
  Calendar,
  RefreshCw,
  AlertCircle,
  MapPin,
  Sparkles,
  X,
  Flame,
} from 'lucide-react';
import Link from 'next/link';

interface UserData {
  id: string;
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  roles: string[];
}

interface OrderItem {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
  shipping_address?: {
    city?: string;
    province?: string;
    street_address?: string;
  };
}

interface BookingItem {
  id: string;
  service_id: string;
  staff_id?: string | null;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  notes?: string | null;
  service?: {
    id: string;
    name: string;
    duration_minutes: number;
  };
  staff?: {
    id: string;
    display_name: string;
  } | null;
  location?: {
    id: string;
    name: string;
    address?: string;
  } | null;
}

interface AvailableSlot {
  time: string;
  startTime: string;
  endTime: string;
}

interface SubscriptionQuotaData {
  total_cuts: number;
  used_cuts: number;
  available_cuts: number;
  plan_code: string;
  plan_name: string;
  period_start: string;
  period_end: string;
  can_book_covered: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionQuota, setSubscriptionQuota] = useState<SubscriptionQuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Subscription Management State
  const [availableSubPlans, setAvailableSubPlans] = useState<any[]>([]);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isCancelSubOpen, setIsCancelSubOpen] = useState(false);
  const [subActionLoading, setSubActionLoading] = useState(false);
  const [selectedChangePlanCode, setSelectedChangePlanCode] = useState<string | null>(null);

  // Notification Preferences
  const [notifOrderEmail, setNotifOrderEmail] = useState(true);
  const [notifBookingSMS, setNotifBookingSMS] = useState(true);
  const [notifDropAlerts, setNotifDropAlerts] = useState(false);
  const [notifSavedMsg, setNotifSavedMsg] = useState<string | null>(null);

  // Reschedule state
  const [reschedulingBooking, setReschedulingBooking] = useState<BookingItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<string | null>(null);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  useEffect(() => {
    // Load notification preferences from localStorage
    const saved = localStorage.getItem('dissafyt_notifs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifOrderEmail(parsed.orderEmail ?? true);
        setNotifBookingSMS(parsed.bookingSMS ?? true);
        setNotifDropAlerts(parsed.dropAlerts ?? false);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    async function loadUser() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push('/auth/login');
        return;
      }

      const accessToken = data.session.access_token;
      setToken(accessToken);

      try {
        const [userRes, ordersRes, bookingsRes, subRes, servicesRes] = await Promise.all([
          fetch('/api/users/me', { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch('/api/orders', { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch('/api/bookings', { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch('/api/subscriptions/status', { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch('/api/services'),
        ]);

        if (servicesRes.ok) {
          const sList = await servicesRes.json();
          setAvailableSubPlans(sList.filter((s: any) => s.is_subscription && s.is_active));
        }

        if (userRes.ok) {
          const profileData: UserData = await userRes.json();
          setUser(profileData);
          setFullName(profileData.full_name || '');
          setPhone(profileData.phone || '');
        } else {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email,
            full_name: data.session.user.user_metadata?.full_name || '',
            roles: ['customer'],
          });
          setFullName(data.session.user.user_metadata?.full_name || '');
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        }

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData);
        }

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData.subscription || null);
          setSubscriptionQuota(subData.quota || null);
        }
      } catch (e) {
        console.error('Error fetching account data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  async function handleCancelBooking(bookingId: string) {
    if (!token || !confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingBookingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'cancel' }),
      });
      if (res.ok) {
        const [refRes, subRefRes] = await Promise.all([
          fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/subscriptions/status', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (refRes.ok) setBookings(await refRes.json());
        if (subRefRes.ok) {
          const subData = await subRefRes.json();
          setSubscription(subData.subscription || null);
          setSubscriptionQuota(subData.quota || null);
        }
        setStatusMsg('Appointment cancelled successfully. Any subscription quota has been restored.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancellingBookingId(null);
    }
  }

  async function openRescheduleModal(booking: BookingItem) {
    setReschedulingBooking(booking);
    // Default reschedule date to tomorrow in SAST
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(tomorrow);
    setRescheduleDate(dateStr);
    setSelectedRescheduleSlot(null);
    fetchRescheduleSlots(booking, dateStr);
  }

  async function fetchRescheduleSlots(booking: BookingItem, date: string) {
    if (!booking.service_id) return;
    setLoadingSlots(true);
    try {
      const staffParam = booking.staff_id ? `&staffId=${booking.staff_id}` : '';
      const res = await fetch(`/api/bookings/availability?date=${date}&serviceId=${booking.service_id}${staffParam}`);
      if (res.ok) {
        const data = await res.json();
        setRescheduleSlots(data.slots || []);
      } else {
        setRescheduleSlots([]);
      }
    } catch (e) {
      console.error('Failed to load slots:', e);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleConfirmReschedule() {
    if (!token || !reschedulingBooking || !selectedRescheduleSlot) return;
    setIsSubmittingReschedule(true);
    try {
      const res = await fetch(`/api/bookings/${reschedulingBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'reschedule',
          newStartTime: selectedRescheduleSlot,
          newStaffId: reschedulingBooking.staff_id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Refresh bookings
        const refRes = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
        if (refRes.ok) setBookings(await refRes.json());
        setReschedulingBooking(null);
        setStatusMsg('Appointment successfully rescheduled!');
      } else {
        alert(data.error || 'Failed to reschedule');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to reschedule service');
    } finally {
      setIsSubmittingReschedule(false);
    }
  }

  async function handleCancelSubscription() {
    if (!token) return;
    setSubActionLoading(true);
    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(data.message || 'Membership cancelled successfully.');
        setIsCancelSubOpen(false);
        const subRes = await fetch('/api/subscriptions/status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (subRes.ok) {
          const sData = await subRes.json();
          setSubscription(sData.subscription || null);
          setSubscriptionQuota(sData.quota || null);
        }
      } else {
        alert(data.error || 'Failed to cancel membership.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while cancelling membership.');
    } finally {
      setSubActionLoading(false);
    }
  }

  async function handleConfirmChangePlan() {
    if (!token || !selectedChangePlanCode) return;
    setSubActionLoading(true);
    try {
      const res = await fetch('/api/subscriptions/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetPlanCode: selectedChangePlanCode, isSandboxDemo: true }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.switchedImmediately) {
          setStatusMsg(data.message || 'Membership plan updated successfully!');
          setIsChangePlanOpen(false);
          setSelectedChangePlanCode(null);
          const subRes = await fetch('/api/subscriptions/status', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (subRes.ok) {
            const sData = await subRes.json();
            setSubscription(sData.subscription || null);
            setSubscriptionQuota(sData.quota || null);
          }
        } else if (data.payfast) {
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
      } else {
        alert(data.error || 'Failed to change membership plan.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while changing membership plan.');
    } finally {
      setSubActionLoading(false);
    }
  }

  function handleSaveNotifications(e: React.FormEvent) {
    e.preventDefault();
    const prefs = {
      orderEmail: notifOrderEmail,
      bookingSMS: notifBookingSMS,
      dropAlerts: notifDropAlerts,
    };
    localStorage.setItem('dissafyt_notifs', JSON.stringify(prefs));
    setNotifSavedMsg('Preferences saved.');
    setTimeout(() => setNotifSavedMsg(null), 3000);
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setUpdating(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          phone,
        }),
      });

      if (res.ok) {
        setStatusMsg('Profile updated successfully!');
      } else {
        const err = await res.json();
        setStatusMsg(`Failed: ${err.error || 'Update failed'}`);
      }
    } catch {
      setStatusMsg('Network error while updating profile.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center text-zinc-400">
        Loading your unified Dissafyt profile...
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Account</h1>
          <p className="text-sm text-zinc-400">
            One unified identity across Dissafyt Streetwear and Ace of Fyt Barbershop.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 self-start sm:self-auto"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {statusMsg && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          {statusMsg}
        </div>
      )}

      {/* Reschedule Modal / Slide-down */}
      {reschedulingBooking && (
        <div className="border border-amber-500/40 bg-zinc-900/90 rounded-xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-amber-500" />
                Reschedule: {reschedulingBooking.service?.name}
              </h2>
              <p className="text-xs text-zinc-400">
                Current appointment:{' '}
                {new Date(reschedulingBooking.start_time).toLocaleString('en-ZA', {
                  timeZone: 'Africa/Johannesburg',
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReschedulingBooking(null)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Cancel
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rescheduleDate" className="text-xs text-zinc-300">
                Choose New Date
              </Label>
              <Input
                id="rescheduleDate"
                type="date"
                min={new Intl.DateTimeFormat('en-CA', {
                  timeZone: 'Africa/Johannesburg',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }).format(new Date())}
                value={rescheduleDate}
                onChange={(e) => {
                  setRescheduleDate(e.target.value);
                  setSelectedRescheduleSlot(null);
                  if (reschedulingBooking) {
                    fetchRescheduleSlots(reschedulingBooking, e.target.value);
                  }
                }}
                className="max-w-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-300 mb-2 block">
                Select New 30-Minute Slot
              </Label>
              {loadingSlots ? (
                <div className="text-xs text-zinc-500 py-4">Checking barber availability...</div>
              ) : rescheduleSlots.length === 0 ? (
                <div className="text-xs text-amber-400/80 py-4">
                  No slots available on this date (Sundays closed, or all slots booked). Please select another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {rescheduleSlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => setSelectedRescheduleSlot(slot.startTime)}
                      className={`py-2 px-3 rounded text-xs font-semibold border transition-all ${
                        selectedRescheduleSlot === slot.startTime
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                disabled={!selectedRescheduleSlot || isSubmittingReschedule}
                onClick={handleConfirmReschedule}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                {isSubmittingReschedule ? 'Saving...' : 'Confirm Rescheduled Appointment'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setReschedulingBooking(null)}
                className="border-zinc-800 text-zinc-300"
              >
                Keep Original Time
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PLAN MODAL */}
      {isChangePlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                  Switch Barbershop Membership Plan
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Upgrade or downgrade your monthly tier with immediate quota adjustment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePlanOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Available Plans List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(availableSubPlans.length > 0 ? availableSubPlans : [
                { plan_code: 'solo', name: 'The Solo Membership', price: 100, description: '1 haircut per month with priority booking.' },
                { plan_code: 'twice', name: 'The Regular Membership', price: 190, description: '2 haircuts per month with queue skip and priority booking.' },
                { plan_code: 'executive', name: 'The Executive', price: 350, description: 'Full combo, twice a month with hot towel & beard sculpt.' },
                { plan_code: 'father-son', name: 'Father n Son Membership', price: 190, description: 'A combo cut for you and your boy — bonding time, sorted.' },
              ]).map((plan) => {
                const isCurrent = subscription?.plan_code === plan.plan_code;
                const isSelected = selectedChangePlanCode === plan.plan_code;

                return (
                  <div
                    key={plan.plan_code}
                    onClick={() => {
                      if (!isCurrent) setSelectedChangePlanCode(plan.plan_code);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'border-zinc-800 bg-zinc-900/40 opacity-70 cursor-not-allowed'
                        : isSelected
                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                        : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{plan.name}</span>
                        {isCurrent && (
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                            Current Plan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 max-w-sm leading-snug">
                        {plan.description}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 pl-3">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        R {Number(plan.price).toFixed(0)}/mo
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-zinc-900">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangePlanOpen(false)}
                className="border-zinc-800 text-zinc-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!selectedChangePlanCode || selectedChangePlanCode === subscription?.plan_code || subActionLoading}
                onClick={handleConfirmChangePlan}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
              >
                {subActionLoading ? 'Updating Plan...' : 'Confirm Plan Change'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL SUBSCRIPTION CONFIRMATION MODAL */}
      {isCancelSubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center text-rose-400">
                <AlertCircle className="mr-2 h-5 w-5 text-rose-500" />
                Cancel VIP Membership?
              </h3>
              <button
                type="button"
                onClick={() => setIsCancelSubOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p>
                Are you sure you want to cancel your{' '}
                <span className="font-bold text-white">{subscription?.plan_name || 'VIP Membership'}</span>?
              </p>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1 text-amber-200">
                <div className="font-semibold text-amber-300">Period-End Access Retained:</div>
                <p className="text-[11px]">
                  You will retain full access to your remaining{' '}
                  <span className="font-bold">{subscriptionQuota?.available_cuts ?? 0} haircut(s)</span> until{' '}
                  <span className="font-bold">
                    {subscriptionQuota?.period_end
                      ? new Date(subscriptionQuota.period_end).toLocaleDateString('en-ZA', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'the end of your current cycle'}
                  </span>
                  . After this date, your subscription will not renew.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-zinc-900">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelSubOpen(false)}
                className="border-zinc-800 text-zinc-300 text-xs"
              >
                Keep My Membership
              </Button>
              <Button
                size="sm"
                disabled={subActionLoading}
                onClick={handleCancelSubscription}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {subActionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Details */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center">
                <User className="mr-2 h-5 w-5 text-amber-500" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Synchronized across streetwear checkout and barbershop reservations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled className="opacity-70" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Courier Guy SMS & Booking Updates)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+27 82 123 4567"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={updating}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                >
                  {updating ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Barbershop Appointments */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white flex items-center">
                  <Scissors className="mr-2 h-5 w-5 text-amber-500" />
                  Barbershop Appointments ({bookings.length})
                </CardTitle>
                <CardDescription>Ace of Fyt grooming sessions and schedules</CardDescription>
              </div>
              <Link href="/book">
                <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300">
                  Book Session <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-sm text-zinc-500 space-y-2">
                  <Clock className="mx-auto h-8 w-8 text-zinc-600" />
                  <p>You haven&apos;t booked any grooming appointments yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => {
                    const startDate = new Date(booking.start_time);
                    const isPast = startDate < new Date();
                    const isModifiable =
                      (booking.status === 'confirmed' || booking.status === 'pending') && !isPast;

                    return (
                      <div
                        key={booking.id}
                        className="border border-zinc-800/80 rounded-lg p-4 bg-zinc-950/40 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                          <div>
                            <span className="font-bold text-white text-sm">
                              {booking.service?.name || 'Grooming Service'}
                            </span>
                            <span className="text-xs text-zinc-400 ml-2">
                              with {booking.staff?.display_name || 'Master Barber'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                booking.status === 'confirmed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : booking.status === 'completed'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : booking.status === 'cancelled'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {booking.status}
                            </span>
                            {Number(booking.total_amount) === 0 || (booking as any).is_subscription_covered || (booking as any).payment_status === 'membership_covered' ? (
                              <span className="font-bold text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                Included in Membership (R0.00)
                              </span>
                            ) : (booking as any).payment_status === 'paid_online' ? (
                              <span className="font-bold text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                Paid Online (R {Number(booking.total_amount).toFixed(2)})
                              </span>
                            ) : (booking as any).payment_status === 'paid_in_chair' ? (
                              <span className="font-bold text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                                Paid in Chair (R {Number(booking.total_amount).toFixed(2)})
                              </span>
                            ) : booking.status === 'pending' ? (
                              <span className="font-bold text-yellow-400 text-xs bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 whitespace-nowrap">
                                Payment Pending (R {Number(booking.total_amount).toFixed(2)})
                              </span>
                            ) : (
                              <span className="font-bold text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                                Due in Chair (R {Number(booking.total_amount).toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-1 gap-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex items-center text-zinc-200">
                              <Clock className="mr-1 h-3.5 w-3.5 text-amber-500" />
                              {startDate.toLocaleDateString('en-ZA', {
                                timeZone: 'Africa/Johannesburg',
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at{' '}
                              {startDate.toLocaleTimeString('en-ZA', {
                                timeZone: 'Africa/Johannesburg',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })}
                            </span>
                            <span className="flex items-center text-zinc-300">
                              <MapPin className="mr-1 h-3.5 w-3.5 text-amber-500" />
                              {booking.location?.name || 'Dissafyt Studio - Bernie'}
                            </span>
                            {booking.service?.duration_minutes && (
                              <span className="text-zinc-500">
                                ({booking.service.duration_minutes} mins)
                              </span>
                            )}
                          </div>

                          {isModifiable && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRescheduleModal(booking)}
                                className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs h-7 px-2"
                              >
                                <Calendar className="mr-1 h-3 w-3" />
                                Reschedule
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={cancellingBookingId === booking.id}
                                onClick={() => handleCancelBooking(booking.id)}
                                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs h-7 px-2"
                              >
                                {cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel'}
                              </Button>
                            </div>
                          )}
                        </div>

                        {booking.notes && (
                          <div className="text-[11px] text-zinc-500 italic">
                            Notes: &ldquo;{booking.notes}&rdquo;
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Apparel Orders with Tracking Visualization */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5 text-amber-500" />
                  Apparel Orders ({orders.length})
                </CardTitle>
                <CardDescription>Streetwear purchases and delivery tracking</CardDescription>
              </div>
              <Link href="/shop">
                <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300">
                  Shop Catalog <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8 text-sm text-zinc-500 space-y-2">
                  <Package className="mx-auto h-8 w-8 text-zinc-600" />
                  <p>You haven&apos;t placed any clothing orders yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => {
                    const status = order.status.toLowerCase();
                    const isPaid = status === 'paid' || status === 'processing' || status === 'shipped' || status === 'delivered';
                    const isProcessing = status === 'processing' || status === 'shipped' || status === 'delivered';
                    const isShipped = status === 'shipped' || status === 'delivered';
                    const isDelivered = status === 'delivered';

                    return (
                      <div
                        key={order.id}
                        className="border border-zinc-800/80 rounded-lg p-5 bg-zinc-950/40 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                          <div>
                            <span className="font-mono font-bold text-white text-sm">
                              {order.order_number}
                            </span>
                            <span className="text-xs text-zinc-500 ml-2">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                order.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : order.status === 'shipped'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {order.status.replace('_', ' ')}
                            </span>
                            <span className="font-extrabold text-amber-400 text-sm">
                              R {Number(order.total).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* 4-Step Fulfillment Tracker */}
                        <div className="py-2">
                          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                            Fulfillment Journey
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                            <div className="space-y-1">
                              <div className="h-1.5 rounded-full bg-amber-500" />
                              <span className="text-amber-400 font-medium">Placed</span>
                            </div>
                            <div className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                              />
                              <span className={isPaid ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                                Paid (PayFast)
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full ${isShipped ? 'bg-blue-500' : 'bg-zinc-800'}`}
                              />
                              <span className={isShipped ? 'text-blue-400 font-medium' : 'text-zinc-500'}>
                                Courier Guy
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full ${isDelivered ? 'bg-emerald-400' : 'bg-zinc-800'}`}
                              />
                              <span className={isDelivered ? 'text-emerald-300 font-medium' : 'text-zinc-500'}>
                                Delivered
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-zinc-400 space-y-1 bg-zinc-900/40 p-3 rounded">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span>
                                {item.quantity}x {item.product_name}
                              </span>
                              <span className="font-mono">R {Number(item.total_price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {order.shipping_address && (
                          <div className="text-[11px] text-zinc-500 flex items-center pt-1">
                            <Truck className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
                            Waybill Destination: {order.shipping_address.street_address},{' '}
                            {order.shipping_address.city}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column: Roles, Notifications, Quick Actions */}
        <div className="space-y-6">
          {/* Active Membership or Join Guild Card */}
          {subscription ? (
            <Card className="border-amber-500/40 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 shadow-lg shadow-amber-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-white flex items-center">
                    <Scissors className="mr-2 h-4 w-4 text-amber-500" />
                    VIP Membership
                  </CardTitle>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      subscription.status === 'cancelled'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {subscription.status === 'cancelled' ? 'Cancelled (Active Period)' : 'Active'}
                  </span>
                </div>
                <CardDescription className="text-xs">
                  Ace of Fyt Recurring Chair Pass
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs">
                <div className="flex items-baseline justify-between border-b border-zinc-800 pb-2">
                  <span className="font-bold text-white text-sm">
                    {subscriptionQuota?.plan_name || subscription.plan_name || 'VIP Membership'}
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    R {Number(subscription.price || 100).toFixed(2)}/mo
                  </span>
                </div>

                {/* Quota Telemetry & Cut Count Display */}
                {subscriptionQuota ? (
                  <div className="rounded-lg bg-zinc-900/90 border border-zinc-800 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-medium text-[11px]">Monthly Allotment</span>
                      <span
                        className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                          subscriptionQuota.available_cuts > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {subscriptionQuota.available_cuts} of {subscriptionQuota.total_cuts} cut
                        {subscriptionQuota.total_cuts > 1 ? 's' : ''} available
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          subscriptionQuota.available_cuts > 0 ? 'bg-amber-500' : 'bg-zinc-600'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (subscriptionQuota.available_cuts / Math.max(1, subscriptionQuota.total_cuts)) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                      <span>{subscriptionQuota.used_cuts} used this cycle</span>
                      <span>
                        {subscription.status === 'cancelled' ? 'Expires ' : 'Renews '}
                        {subscriptionQuota.period_end
                          ? new Date(subscriptionQuota.period_end).toLocaleDateString('en-ZA', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'next month'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Your monthly haircut allotment is active. Book your fresh cut anytime with guaranteed chair time.
                  </p>
                )}

                {/* Primary Booking Action */}
                <div className="pt-1">
                  {subscriptionQuota && subscriptionQuota.available_cuts <= 0 ? (
                    <div className="space-y-1.5">
                      <Link href="/book">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs h-8"
                        >
                          Book Extra Cut (Standard Rate)
                        </Button>
                      </Link>
                      <p className="text-[10px] text-center text-zinc-500">
                        Monthly included cuts used. Renews on{' '}
                        {subscriptionQuota.period_end
                          ? new Date(subscriptionQuota.period_end).toLocaleDateString('en-ZA', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'cycle end'}
                        .
                      </p>
                    </div>
                  ) : (
                    <Link href="/book">
                      <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-8 shadow-md shadow-amber-500/10">
                        Book Included Cut (R0.00)
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Self-Service Plan Controls */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedChangePlanCode(subscription.plan_code || 'twice');
                      setIsChangePlanOpen(true);
                    }}
                    className="flex-1 border-zinc-700 hover:border-zinc-500 bg-zinc-900 text-zinc-200 text-[11px] h-7"
                  >
                    Change Plan
                  </Button>
                  {subscription.status === 'active' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsCancelSubOpen(true)}
                      className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 text-[11px] h-7 px-2"
                    >
                      Cancel
                    </Button>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500">
                      Cancels on cycle end
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-zinc-800 bg-gradient-to-b from-zinc-900/70 to-zinc-950 p-5 space-y-3.5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center space-x-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-mono uppercase text-amber-400">
                  <Sparkles className="h-3 w-3" />
                  <span>VIP GROOMING GUILD</span>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                  Ace of Fyt Recurring Chair Pass
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Save on regular haircut sessions, skip the queue with priority booking, and unlock exclusive streetwear drop pricing.
                </p>
              </div>
              <Link href="/book#memberships" className="block">
                <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-8 shadow-md shadow-amber-500/10">
                  Explore Memberships (From R100/mo)
                </Button>
              </Link>
            </Card>
          )}

          {/* Notification Preferences */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center">
                <Bell className="mr-2 h-4 w-4 text-amber-500" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-xs">
                Manage alerts for bookings and drops
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveNotifications} className="space-y-3 text-xs">
                <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifOrderEmail}
                    onChange={(e) => setNotifOrderEmail(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Email order status updates</span>
                </label>
                <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifBookingSMS}
                    onChange={(e) => setNotifBookingSMS(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
                  />
                  <span>SMS/WhatsApp appointment reminders</span>
                </label>
                <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifDropAlerts}
                    onChange={(e) => setNotifDropAlerts(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
                  />
                  <span>VIP streetwear drops & early access</span>
                </label>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
                  >
                    Save Preferences
                  </Button>
                  {notifSavedMsg && (
                    <div className="text-[11px] text-emerald-400 mt-1 text-center font-medium">
                      {notifSavedMsg}
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Assigned Roles */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center">
                <Shield className="mr-2 h-4 w-4 text-amber-500" />
                Assigned Platform Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user?.roles?.map((role) => (
                <div
                  key={role}
                  className="flex items-center justify-between rounded-md bg-zinc-800/80 px-3 py-1.5 text-xs"
                >
                  <span className="capitalize font-medium text-zinc-200">{role}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Shortcuts */}
          <Card className="border-zinc-800 bg-zinc-900/60 p-4 space-y-2 text-xs">
            <div className="font-semibold text-white">Platform Shortcuts</div>
            <Link href="/book" className="block text-zinc-400 hover:text-amber-400">
              &bull; Book Barber Appointment
            </Link>
            <Link href="/shop" className="block text-zinc-400 hover:text-amber-400">
              &bull; Explore Clothing Catalog
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
