'use client';

import { useEffect, useState, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  History,
  AlertTriangle,
  Ban,
  PackageCheck,
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
  const [syncingSub, setSyncingSub] = useState(false);
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
        body: JSON.stringify({ targetPlanCode: selectedChangePlanCode }),
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

  async function handleSyncSubscription() {
    if (!token) return;
    setSyncingSub(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/subscriptions/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to sync subscription');
      }

      setSubscription(data.subscription || null);
      setSubscriptionQuota(data.quota || null);
      setStatusMsg(data.message || 'Subscription successfully synchronized with latest billing cycle!');
    } catch (e: any) {
      console.error('Subscription sync error:', e);
      setStatusMsg(e.message || 'Error syncing subscription with PayFast');
    } finally {
      setSyncingSub(false);
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

  // Active Section Tab & Barbershop Calendar State
  const [activeTab, setActiveTab] = useState<'barbershop' | 'orders' | 'settings'>('barbershop');
  const [showBookingHistory, setShowBookingHistory] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [hoveredDateKey, setHoveredDateKey] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // SAST timezone date key helper (YYYY-MM-DD)
  function getSastDateKey(dInput: Date | string): string {
    const d = typeof dInput === 'string' ? new Date(dInput) : dInput;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }

  // When bookings load, if current calendar month has 0 bookings, auto-shift to next upcoming booking or latest booking's month
  useEffect(() => {
    if (bookings.length > 0) {
      const curYear = calendarDate.getFullYear();
      const curMonth = calendarDate.getMonth();
      const hasBookingInCurrent = bookings.some((b) => {
        if (!b.start_time) return false;
        const d = new Date(b.start_time);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      });
      if (!hasBookingInCurrent) {
        const upcoming = bookings.find(
          (b) => new Date(b.start_time) >= new Date() && b.status !== 'cancelled' && b.status !== 'no_show'
        );
        const target = upcoming || bookings[0];
        if (target?.start_time) {
          const d = new Date(target.start_time);
          setCalendarDate(new Date(d.getFullYear(), d.getMonth(), 1));
        }
      }
    }
  }, [bookings]);

  // Group bookings by date key
  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingItem[]> = {};
    for (const b of bookings) {
      if (!b.start_time) continue;
      const k = getSastDateKey(b.start_time);
      if (!map[k]) map[k] = [];
      map[k].push(b);
    }
    return map;
  }, [bookings]);

  // Categorize upcoming vs history
  const { upcomingBookings, historyBookings } = useMemo(() => {
    const now = new Date();
    const upcoming: BookingItem[] = [];
    const history: BookingItem[] = [];

    for (const b of bookings) {
      const start = new Date(b.start_time);
      if (start >= now && b.status !== 'cancelled' && b.status !== 'no_show') {
        upcoming.push(b);
      } else {
        history.push(b);
      }
    }

    upcoming.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    history.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

    return { upcomingBookings: upcoming, historyBookings: history };
  }, [bookings]);

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const calMonthLabel = calendarDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  const todayKey = getSastDateKey(new Date());

  const firstDayWeekday = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const calendarCells = useMemo(() => {
    const cells: Array<{ day: number; dateKey: string } | null> = [];
    for (let i = 0; i < firstDayWeekday; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateKey });
    }
    return cells;
  }, [calYear, calMonth, firstDayWeekday, daysInMonth]);

  const activeHoverDateKey = hoveredDateKey || selectedDateKey;
  const activeHoverBookings = activeHoverDateKey ? bookingsByDate[activeHoverDateKey] || [] : [];

  function renderBookingRow(booking: BookingItem) {
    const startDate = new Date(booking.start_time);
    const isPast = startDate < new Date();
    const isModifiable = (booking.status === 'confirmed' || booking.status === 'pending') && !isPast;

    return (
      <div
        key={booking.id}
        className="border border-zinc-800/80 rounded-xl p-3.5 bg-zinc-950/50 hover:border-zinc-700/80 transition space-y-2.5"
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
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                booking.status === 'confirmed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : booking.status === 'completed'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : booking.status === 'cancelled'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {booking.status.replace('_', ' ')}
            </span>
            {Number(booking.total_amount) === 0 ||
            (booking as any).is_subscription_covered ||
            (booking as any).payment_status === 'membership_covered' ? (
              <span className="font-bold text-emerald-400 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                Membership (R0)
              </span>
            ) : (booking as any).payment_status === 'paid_online' ? (
              <span className="font-bold text-emerald-400 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                Paid (R {Number(booking.total_amount).toFixed(0)})
              </span>
            ) : (booking as any).payment_status === 'paid_in_chair' ? (
              <span className="font-bold text-emerald-400 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                Paid in Chair (R {Number(booking.total_amount).toFixed(0)})
              </span>
            ) : booking.status === 'pending' ? (
              <span className="font-bold text-yellow-400 text-[11px] bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 whitespace-nowrap">
                Pending (R {Number(booking.total_amount).toFixed(0)})
              </span>
            ) : (
              <span className="font-bold text-amber-400 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                Due in Chair (R {Number(booking.total_amount).toFixed(0)})
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-0.5 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center text-zinc-200 font-medium">
              <Clock className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
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
            <span className="flex items-center text-zinc-400">
              <MapPin className="mr-1 h-3.5 w-3.5 text-amber-500/80" />
              {booking.location?.name || 'Dissafyt Studio - Bernie'}
            </span>
            {booking.service?.duration_minutes && (
              <span className="text-zinc-500">({booking.service.duration_minutes}m)</span>
            )}
          </div>

          {isModifiable && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openRescheduleModal(booking)}
                className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs h-7 px-2.5"
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
          <div className="text-[11px] text-zinc-500 italic">Notes: &ldquo;{booking.notes}&rdquo;</div>
        )}
      </div>
    );
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

  const userInitials = (fullName || user?.email || 'DF')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const nextAppointment = upcomingBookings[0] || null;
  const latestOrder = orders[0] || null;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-6">
      {/* Unified Identity Overview Hero Banner (Mobile-Simplified) */}
      <div className="rounded-2xl border border-zinc-800/90 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-950 p-3.5 sm:p-5 shadow-xl">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm sm:text-base font-mono shadow-inner flex-shrink-0">
              {userInitials || 'DF'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">
                  {fullName || 'Dissafyt Member'}
                </h1>
                {subscription && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase text-amber-300 flex-shrink-0">
                    <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                    VIP
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-400 truncate">
                <span className="truncate">{user?.email}</span>
                {phone && (
                  <span className="hidden sm:inline font-mono text-zinc-300">
                    &bull; {phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Link href="/book">
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-8 px-2.5 sm:px-3"
              >
                <Scissors className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden xs:inline sm:inline ml-1 sm:ml-0">Book</span>
              </Button>
            </Link>
            <Link href="/shop" className="hidden sm:block">
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs h-8 px-3"
              >
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
                Shop
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              title="Sign Out"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/80 text-xs h-8 px-2 sm:px-2.5"
            >
              <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Compact 3-Column Sync Strip (Single Row on Mobile & Desktop) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 mt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('barbershop')}
            className={`text-left rounded-xl p-2 sm:p-3 border transition-all min-w-0 ${
              activeTab === 'barbershop'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 mb-0.5">
              <span className="font-mono uppercase tracking-wider flex items-center gap-1 truncate">
                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 flex-shrink-0" />
                <span className="truncate">VIP Pass</span>
              </span>
              {subscriptionQuota && (
                <span className="hidden sm:inline text-[10px] font-mono text-amber-400 font-bold">
                  {subscriptionQuota.available_cuts}/{subscriptionQuota.total_cuts} left
                </span>
              )}
            </div>
            <div className="font-bold text-white text-[11px] sm:text-xs truncate">
              {subscriptionQuota
                ? `${subscriptionQuota.available_cuts}/${subscriptionQuota.total_cuts} cuts left`
                : subscription
                ? subscription.plan_name || 'Active VIP'
                : 'No Pass'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('barbershop');
              setShowBookingHistory(false);
            }}
            className={`text-left rounded-xl p-2 sm:p-3 border transition-all min-w-0 ${
              activeTab === 'barbershop' && !showBookingHistory
                ? 'bg-zinc-900/90 border-zinc-700'
                : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 mb-0.5">
              <span className="font-mono uppercase tracking-wider flex items-center gap-1 truncate">
                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 flex-shrink-0" />
                <span className="truncate">Next Cut</span>
              </span>
              <span className="hidden sm:inline text-[10px] font-mono text-zinc-400">
                {upcomingBookings.length} upcoming
              </span>
            </div>
            <div className="font-bold text-white text-[11px] sm:text-xs truncate">
              {nextAppointment
                ? `${new Date(nextAppointment.start_time).toLocaleDateString('en-ZA', {
                    timeZone: 'Africa/Johannesburg',
                    day: 'numeric',
                    month: 'short',
                  })} • ${new Date(nextAppointment.start_time).toLocaleTimeString('en-ZA', {
                    timeZone: 'Africa/Johannesburg',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}`
                : 'None scheduled'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`text-left rounded-xl p-2 sm:p-3 border transition-all min-w-0 ${
              activeTab === 'orders'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 mb-0.5">
              <span className="font-mono uppercase tracking-wider flex items-center gap-1 truncate">
                <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 flex-shrink-0" />
                <span className="truncate">Orders</span>
              </span>
              <span className="hidden sm:inline text-[10px] font-mono text-zinc-400">
                {orders.length} total
              </span>
            </div>
            <div className="font-bold text-white text-[11px] sm:text-xs truncate">
              {orders.length > 0 ? `${orders.length} order${orders.length === 1 ? '' : 's'}` : 'None yet'}
            </div>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm text-amber-300 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-amber-400 hover:text-white ml-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Segmented Navigation Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800/90 p-1 sm:p-1.5 rounded-xl grid grid-cols-3 gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('barbershop')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'barbershop'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Scissors className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="sm:hidden">Haircuts</span>
          <span className="hidden sm:inline truncate">Barbershop &amp; VIP Pass</span>
          <span
            className={`hidden sm:inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-mono ${
              activeTab === 'barbershop'
                ? 'bg-black/20 text-black font-bold'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {upcomingBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="sm:hidden">Orders</span>
          <span className="hidden sm:inline truncate">Apparel Orders</span>
          <span
            className={`hidden sm:inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-mono ${
              activeTab === 'orders'
                ? 'bg-black/20 text-black font-bold'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="sm:hidden">Profile</span>
          <span className="hidden sm:inline truncate">Profile &amp; Settings</span>
        </button>
      </div>

      {/* Reschedule Modal / Slide-down */}
      {reschedulingBooking && (
        <div className="border border-amber-500/40 bg-zinc-900/95 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center">
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

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {(availableSubPlans.length > 0
                ? availableSubPlans
                : [
                    { plan_code: 'solo', name: 'The Solo Membership', price: 100, description: '1 haircut per month with priority booking.' },
                    { plan_code: 'twice', name: 'The Regular Membership', price: 190, description: '2 haircuts per month with queue skip and priority booking.' },
                    { plan_code: 'executive', name: 'The Executive', price: 350, description: 'Full combo, twice a month with hot towel & beard sculpt.' },
                    { plan_code: 'father-son', name: 'Father n Son Membership', price: 190, description: 'A combo cut for you and your boy — bonding time, sorted.' },
                  ]
              ).map((plan) => {
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
                      <p className="text-xs text-zinc-400 max-w-sm leading-snug">{plan.description}</p>
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
                disabled={
                  !selectedChangePlanCode ||
                  selectedChangePlanCode === subscription?.plan_code ||
                  subActionLoading
                }
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
                <span className="font-bold text-white">
                  {subscription?.plan_name || 'VIP Membership'}
                </span>
                ?
              </p>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1 text-amber-200">
                <div className="font-semibold text-amber-300">Period-End Access Retained:</div>
                <p className="text-[11px]">
                  You will retain full access to your remaining{' '}
                  <span className="font-bold">
                    {subscriptionQuota?.available_cuts ?? 0} haircut(s)
                  </span>{' '}
                  until{' '}
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

      {/* TAB 1: BARBERSHOP & VIP PASS (Synchronized Hub) */}
      {activeTab === 'barbershop' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Compact Calendar + Upcoming Appointments / Scrollable History */}
          <Card className="lg:col-span-7 border-zinc-800 bg-zinc-900/60">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
              <div>
                <CardTitle className="text-lg sm:text-xl text-white flex items-center">
                  <Scissors className="mr-2 h-5 w-5 text-amber-500" />
                  Barbershop Appointments ({bookings.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Hover or tap any highlighted date to inspect or manage your session
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {bookings.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBookingHistory(!showBookingHistory)}
                    className="border-zinc-700 text-zinc-300 hover:text-white text-xs h-8"
                  >
                    {showBookingHistory ? (
                      <>
                        <Calendar className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                        <span>Calendar View</span>
                      </>
                    ) : (
                      <>
                        <History className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                        <span>Past Haircuts ({historyBookings.length})</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-sm text-zinc-500 space-y-3">
                  <Clock className="mx-auto h-8 w-8 text-zinc-600" />
                  <p>You haven&apos;t booked any grooming appointments yet.</p>
                  <Link href="/book">
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs">
                      Book Your First Cut
                    </Button>
                  </Link>
                </div>
              ) : showBookingHistory ? (
                /* Scrollable Past Haircuts History Container */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 text-xs">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBookingHistory(false)}
                        className="border-zinc-700 text-zinc-300 hover:text-white h-7 px-2.5 text-xs"
                      >
                        &larr; Back to Calendar
                      </Button>
                      <span className="font-mono uppercase text-zinc-300 font-bold">
                        Past Haircuts ({historyBookings.length})
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 hidden sm:inline">
                      Scroll to browse history
                    </span>
                  </div>

                  <div className="max-h-[440px] overflow-y-auto pr-1 space-y-2.5">
                    {historyBookings.length === 0 ? (
                      <div className="py-8 text-center text-xs text-zinc-500">
                        No past haircut records found yet.
                      </div>
                    ) : (
                      historyBookings.map((booking) => renderBookingRow(booking))
                    )}
                  </div>
                </div>
              ) : (
                /* Default Mode: Compact Calendar View with Hover Modal + Upcoming Appointments Below */
                <div className="space-y-5">
                  <div className="relative max-w-sm mx-auto bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-4 shadow-inner">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))}
                          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
                          title="Previous month"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-xs sm:text-sm font-bold text-white font-mono min-w-[120px] text-center">
                          {calMonthLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCalendarDate(new Date(calYear, calMonth + 1, 1))}
                          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
                          title="Next month"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="flex items-center gap-1 text-amber-400">
                          <span className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                          <span>Booked</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            setCalendarDate(new Date(now.getFullYear(), now.getMonth(), 1));
                          }}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                        >
                          Today
                        </button>
                      </div>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 pt-2.5 pb-1 text-center font-mono text-[10px] text-zinc-500">
                      <span>Su</span>
                      <span>Mo</span>
                      <span>Tu</span>
                      <span>We</span>
                      <span>Th</span>
                      <span>Fr</span>
                      <span>Sa</span>
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center font-mono">
                      {calendarCells.map((cell, idx) => {
                        if (!cell) {
                          return <div key={`blank-${idx}`} className="h-8 w-8 sm:h-9 sm:w-9 mx-auto" />;
                        }

                        const dayBookings = bookingsByDate[cell.dateKey] || [];
                        const hasBookings = dayBookings.length > 0;
                        const hasActiveBookings = dayBookings.some(
                          (b) => b.status !== 'cancelled' && b.status !== 'no_show'
                        );
                        const isToday = cell.dateKey === todayKey;
                        const isSelected = activeHoverDateKey === cell.dateKey;

                        return (
                          <button
                            type="button"
                            key={cell.dateKey}
                            onMouseEnter={() => {
                              if (hasBookings) setHoveredDateKey(cell.dateKey);
                            }}
                            onMouseLeave={() => setHoveredDateKey(null)}
                            onClick={() => {
                              if (hasBookings) {
                                setSelectedDateKey((prev) =>
                                  prev === cell.dateKey ? null : cell.dateKey
                                );
                              }
                            }}
                            className={`h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-lg flex flex-col items-center justify-center text-xs relative transition-all ${
                              isSelected
                                ? 'ring-2 ring-amber-400 bg-amber-500/30 text-white font-bold'
                                : hasActiveBookings
                                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 hover:bg-amber-500/30'
                                : hasBookings
                                ? 'bg-zinc-800/60 text-zinc-300 border border-zinc-700/60 hover:bg-zinc-800'
                                : isToday
                                ? 'border border-amber-500/40 text-amber-400 font-semibold'
                                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-white'
                            }`}
                          >
                            <span>{cell.day}</span>
                            {hasActiveBookings && (
                              <span className="h-1 w-1 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                            )}
                            {!hasActiveBookings && hasBookings && (
                              <span className="h-1 w-1 rounded-full bg-zinc-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Hover Modal / Popover Overlay */}
                    {activeHoverBookings.length > 0 && (
                      <div
                        className="absolute inset-x-2 sm:inset-x-3 top-11 z-30 bg-zinc-950/95 border border-amber-500/40 shadow-2xl rounded-xl p-3.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 space-y-2.5"
                        onMouseEnter={() => setHoveredDateKey(activeHoverDateKey)}
                        onMouseLeave={() => setHoveredDateKey(null)}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-amber-500" />
                            <span className="font-bold text-xs text-white">
                              {new Date(activeHoverBookings[0].start_time).toLocaleDateString(
                                'en-ZA',
                                {
                                  timeZone: 'Africa/Johannesburg',
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {activeHoverBookings.length}{' '}
                              {activeHoverBookings.length === 1 ? 'cut' : 'cuts'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setHoveredDateKey(null);
                              setSelectedDateKey(null);
                            }}
                            className="text-zinc-400 hover:text-white p-1 rounded-md"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                          {activeHoverBookings.map((b) => {
                            const bStart = new Date(b.start_time);
                            const bIsPast = bStart < new Date();
                            const bModifiable =
                              (b.status === 'confirmed' || b.status === 'pending') && !bIsPast;

                            return (
                              <div
                                key={b.id}
                                className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs text-left"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="font-bold text-white text-xs">
                                      {b.service?.name || 'Grooming Service'}
                                    </div>
                                    <div className="text-[11px] text-zinc-400">
                                      with {b.staff?.display_name || 'Master Barber'}
                                    </div>
                                  </div>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                      b.status === 'confirmed'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : b.status === 'completed'
                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        : b.status === 'cancelled'
                                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    }`}
                                  >
                                    {b.status.replace('_', ' ')}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                                  <span className="flex items-center text-zinc-200">
                                    <Clock className="mr-1 h-3 w-3 text-amber-500" />
                                    {bStart.toLocaleTimeString('en-ZA', {
                                      timeZone: 'Africa/Johannesburg',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: false,
                                    })}
                                  </span>
                                  <span>&bull;</span>
                                  <span>{b.location?.name || 'Dissafyt Studio'}</span>
                                  {b.service?.duration_minutes && (
                                    <>
                                      <span>&bull;</span>
                                      <span>{b.service.duration_minutes}m</span>
                                    </>
                                  )}
                                </div>

                                {bModifiable && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openRescheduleModal(b)}
                                      className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-[11px] h-6 px-2"
                                    >
                                      Reschedule
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={cancellingBookingId === b.id}
                                      onClick={() => handleCancelBooking(b.id)}
                                      className="text-rose-400 hover:text-rose-300 text-[11px] h-6 px-2"
                                    >
                                      {cancellingBookingId === b.id ? 'Cancelling...' : 'Cancel'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upcoming Appointments List Below Calendar */}
                  <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        Upcoming Appointments ({upcomingBookings.length})
                      </h4>
                      {historyBookings.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBookingHistory(true)}
                          className="text-xs text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/60 h-7 px-2"
                        >
                          <History className="mr-1 h-3.5 w-3.5" />
                          View Past Haircuts ({historyBookings.length})
                        </Button>
                      )}
                    </div>

                    {upcomingBookings.length === 0 ? (
                      <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-center space-y-2">
                        <p className="text-xs text-zinc-400">
                          No upcoming grooming appointments scheduled.
                        </p>
                        <Link href="/book">
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold h-7"
                          >
                            Book Next Session
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {upcomingBookings.map((booking) => renderBookingRow(booking))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column (5 cols): VIP Membership Pass Directly In Sync */}
          <div className="lg:col-span-5 space-y-5">
            {subscription ? (
              <Card className="border-amber-500/40 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 shadow-lg shadow-amber-500/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white flex items-center">
                      <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                      VIP Membership Pass
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
                    Ace of Fyt Recurring Chair Pass &bull; Priority Queue
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  <div className="flex items-baseline justify-between border-b border-zinc-800 pb-2.5">
                    <span className="font-bold text-white text-sm">
                      {subscriptionQuota?.plan_name || subscription.plan_name || 'VIP Membership'}
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      R {Number(subscription.price || 100).toFixed(2)}/mo
                    </span>
                  </div>

                  {subscriptionQuota ? (
                    <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-medium text-[11px]">
                          Monthly Cut Allotment
                        </span>
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

                      <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            subscriptionQuota.available_cuts > 0 ? 'bg-amber-500' : 'bg-zinc-600'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (subscriptionQuota.available_cuts /
                                  Math.max(1, subscriptionQuota.total_cuts)) *
                                  100
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
                      Your monthly haircut allotment is active. Book your fresh cut anytime with
                      guaranteed chair time.
                    </p>
                  )}

                  <div className="pt-1">
                    {subscriptionQuota && subscriptionQuota.available_cuts <= 0 ? (
                      <div className="space-y-1.5">
                        <Link href="/book">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs h-9"
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
                        <Button
                          size="sm"
                          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 shadow-md shadow-amber-500/10"
                        >
                          Book Included Cut (R0.00)
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
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
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSyncSubscription}
                      disabled={syncingSub}
                      className="border-zinc-700 hover:border-zinc-500 bg-zinc-900 text-zinc-300 text-[11px] h-7 px-2.5 flex items-center gap-1.5"
                      title="Synchronize status with PayFast"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${
                          syncingSub ? 'animate-spin text-amber-400' : 'text-zinc-400'
                        }`}
                      />
                      <span>{syncingSub ? 'Syncing...' : 'Sync'}</span>
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
              <Card className="border-zinc-800 bg-gradient-to-b from-zinc-900/70 to-zinc-950 p-5 space-y-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center space-x-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-mono uppercase text-amber-400">
                    <Sparkles className="h-3 w-3" />
                    <span>VIP GROOMING GUILD</span>
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                    Ace of Fyt Recurring Chair Pass
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Save on regular haircut sessions, skip the queue with priority booking, and
                    unlock exclusive streetwear drop pricing.
                  </p>
                </div>
                <div className="space-y-2">
                  <Link href="/book#memberships" className="block">
                    <Button
                      size="sm"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-8 shadow-md shadow-amber-500/10"
                    >
                      Explore Memberships (From R100/mo)
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleSyncSubscription}
                    disabled={syncingSub}
                    className="w-full border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 text-xs h-8 flex items-center justify-center gap-2"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        syncingSub ? 'animate-spin text-amber-400' : 'text-zinc-400'
                      }`}
                    />
                    <span>
                      {syncingSub
                        ? 'Checking PayFast Billing...'
                        : 'Already Subscribed? Sync with PayFast'}
                    </span>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: APPAREL ORDERS & FULFILLMENT TRACKING (Compact Icon List) */}
      {activeTab === 'orders' && (
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-lg sm:text-xl text-white flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5 text-amber-500" />
                Apparel Orders ({orders.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Streetwear purchases and live fulfillment status
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Compact Icon Status Key */}
              <div className="hidden md:flex items-center gap-3 text-[10px] font-mono text-zinc-400 bg-zinc-950/70 border border-zinc-800/80 px-2.5 py-1 rounded-lg">
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="h-3 w-3" /> Pending
                </span>
                <span className="flex items-center gap-1 text-sky-400">
                  <Truck className="h-3 w-3" /> In Transit
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <PackageCheck className="h-3 w-3" /> Delivered
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <Ban className="h-3 w-3" /> Cancelled
                </span>
              </div>
              <Link href="/shop">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-amber-400 hover:text-amber-300 text-xs h-8"
                >
                  Shop <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-10 text-sm text-zinc-500 space-y-3">
                <Package className="mx-auto h-9 w-9 text-zinc-600" />
                <p>You haven&apos;t placed any clothing orders yet.</p>
                <Link href="/shop">
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                  >
                    Browse Latest Streetwear Drops
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto pr-1 space-y-2">
                {orders.map((order) => {
                  const status = order.status.toLowerCase();
                  const isCancelled = status === 'cancelled' || status === 'failed';
                  const isDelivered = status === 'delivered' || status === 'completed';
                  const isShipped = status === 'shipped' || status === 'in_transit';
                  const isPaid = status === 'paid' || status === 'processing';

                  const itemsSummary =
                    order.order_items && order.order_items.length > 0
                      ? order.order_items
                          .map((item) => `${item.quantity}x ${item.product_name}`)
                          .join(', ')
                      : 'Apparel Order';

                  return (
                    <div
                      key={order.id}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700/90 hover:bg-zinc-900/50 px-3.5 py-2.5 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Animated Lottie-Vibe Status Icon Badge */}
                        {isCancelled ? (
                          <div
                            title="Order Cancelled"
                            className="relative h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0 shadow-inner"
                          >
                            <Ban className="h-5 w-5 text-rose-400 transition-transform group-hover:scale-110" />
                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500" />
                          </div>
                        ) : isDelivered ? (
                          <div
                            title="Delivered"
                            className="relative h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-inner"
                          >
                            <PackageCheck className="h-5 w-5 text-emerald-400 transition-transform group-hover:scale-110" />
                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60" />
                          </div>
                        ) : isShipped ? (
                          <div
                            title="Out for Delivery with Courier Guy"
                            className="relative h-10 w-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center flex-shrink-0 shadow-inner"
                          >
                            <Truck
                              className="h-5 w-5 text-sky-400 animate-bounce"
                              style={{ animationDuration: '2.2s' }}
                            />
                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
                            </span>
                          </div>
                        ) : isPaid ? (
                          <div
                            title="Paid & Preparing Order"
                            className="relative h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-inner"
                          >
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 transition-transform group-hover:scale-110" />
                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                          </div>
                        ) : (
                          <div
                            title="Pending Payment"
                            className="relative h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-inner"
                          >
                            <AlertTriangle className="h-5 w-5 text-amber-400 animate-pulse" />
                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                            </span>
                          </div>
                        )}

                        {/* Compact Order Details */}
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-white text-xs sm:text-sm">
                              {order.order_number}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {new Date(order.created_at).toLocaleDateString('en-ZA')}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider ${
                                isCancelled
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : isDelivered || isPaid
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : isShipped
                                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-zinc-300 truncate">
                            <span className="truncate font-medium">{itemsSummary}</span>
                            {order.shipping_address?.street_address && (
                              <span className="hidden sm:inline text-[11px] text-zinc-500 truncate">
                                &bull; {order.shipping_address.street_address},{' '}
                                {order.shipping_address.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Price Column */}
                      <div className="text-right flex-shrink-0 pl-2">
                        <div className="font-mono font-bold text-amber-400 text-xs sm:text-sm whitespace-nowrap">
                          R {Number(order.total).toFixed(2)}
                        </div>
                        {order.shipping_address?.city && (
                          <div className="sm:hidden text-[10px] text-zinc-500 truncate max-w-[90px]">
                            {order.shipping_address.city}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: PROFILE & SETTINGS (Synchronized Two-Column Layout) */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Personal & Contact Details */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <User className="mr-2 h-5 w-5 text-amber-500" />
                Profile &amp; Delivery Contact
              </CardTitle>
              <CardDescription className="text-xs">
                Synchronized across streetwear checkout and barbershop reservations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-zinc-300">
                    Account Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="opacity-70 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs text-zinc-300">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs text-zinc-300">
                    Phone Number (Courier Guy SMS &amp; Booking Reminders)
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+27 82 123 4567"
                    className="text-xs"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={updating}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9"
                >
                  {updating ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Preferences & Platform Roles */}
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-amber-500" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure how you receive booking and drop updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveNotifications} className="space-y-3 text-xs">
                  <label className="flex items-center space-x-2.5 text-zinc-300 cursor-pointer p-2 rounded-lg hover:bg-zinc-800/40 transition">
                    <input
                      type="checkbox"
                      checked={notifOrderEmail}
                      onChange={(e) => setNotifOrderEmail(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Email order status &amp; waybill updates</span>
                  </label>
                  <label className="flex items-center space-x-2.5 text-zinc-300 cursor-pointer p-2 rounded-lg hover:bg-zinc-800/40 transition">
                    <input
                      type="checkbox"
                      checked={notifBookingSMS}
                      onChange={(e) => setNotifBookingSMS(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
                    />
                    <span>SMS/WhatsApp barber appointment reminders</span>
                  </label>
                  <label className="flex items-center space-x-2.5 text-zinc-300 cursor-pointer p-2 rounded-lg hover:bg-zinc-800/40 transition">
                    <input
                      type="checkbox"
                      checked={notifDropAlerts}
                      onChange={(e) => setNotifDropAlerts(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-950 text-amber-500 focus:ring-amber-500"
                    />
                    <span>VIP streetwear drops &amp; early access alerts</span>
                  </label>

                  <div className="pt-2 flex items-center gap-3">
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs h-8"
                    >
                      Save Preferences
                    </Button>
                    {notifSavedMsg && (
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {notifSavedMsg}
                      </span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center">
                  <Shield className="mr-2 h-4 w-4 text-amber-500" />
                  Account Access &amp; Roles
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {user?.roles?.map((role) => (
                  <div
                    key={role}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-800/80 border border-zinc-700/70 px-3 py-1.5 text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="capitalize font-medium text-zinc-200">{role}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

