'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@dissafyt/ui';
import { User, ShoppingBag, Scissors, LogOut, CheckCircle2, Shield, Clock, Package, Truck, ExternalLink } from 'lucide-react';
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
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  notes?: string | null;
  service?: {
    name: string;
    duration_minutes: number;
  };
  staff?: {
    display_name: string;
  } | null;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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
        const [userRes, ordersRes, bookingsRes] = await Promise.all([
          fetch('/api/users/me', { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch('/api/orders', { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch('/api/bookings', { headers: { Authorization: `Bearer ${accessToken}` } }),
        ]);

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
        // Refresh bookings
        const refRes = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
        if (refRes.ok) setBookings(await refRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancellingBookingId(null);
    }
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
            One unified identity across Dissafyt commerce and Ace of Fyt barbershop.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Details Column */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center">
                <User className="mr-2 h-5 w-5 text-amber-500" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Updates here synchronize across your apparel purchases and barbershop appointments.
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
                  <Label htmlFor="phone">Phone (for appointment and Courier Guy delivery SMS)</Label>
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
                    const isCancellable = (booking.status === 'confirmed' || booking.status === 'pending') && !isPast;

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
                            <span className="font-extrabold text-amber-400 text-sm">
                              R {Number(booking.total_amount).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-1">
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <Clock className="mr-1 h-3.5 w-3.5 text-zinc-500" />
                              {startDate.toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at{' '}
                              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {booking.service?.duration_minutes && (
                              <span className="text-zinc-500">
                                ({booking.service.duration_minutes} mins)
                              </span>
                            )}
                          </div>

                          {isCancellable && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={cancellingBookingId === booking.id}
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs h-7 px-2"
                            >
                              {cancellingBookingId === booking.id ? 'Cancelling...' : 'Cancel Appointment'}
                            </Button>
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

          {/* Unified Order History */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-white flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5 text-amber-500" />
                  Apparel Orders ({orders.length})
                </CardTitle>
                <CardDescription>Streetwear purchases and delivery progress</CardDescription>
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
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-zinc-800/80 rounded-lg p-4 bg-zinc-950/40 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
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

                      <div className="text-xs text-zinc-400 space-y-1">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>
                              {item.quantity}x {item.product_name}
                            </span>
                            <span>R {Number(item.total_price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {order.shipping_address && (
                        <div className="text-[11px] text-zinc-500 flex items-center pt-1 border-t border-zinc-800/50">
                          <Truck className="h-3 w-3 mr-1 text-zinc-400" />
                          Delivery to: {order.shipping_address.street_address}, {order.shipping_address.city}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Roles & Security Column */}
        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Shield className="mr-2 h-4 w-4 text-amber-500" />
                Assigned Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user?.roles?.map((role) => (
                <div
                  key={role}
                  className="flex items-center justify-between rounded-md bg-zinc-800/80 px-3 py-2 text-sm"
                >
                  <span className="capitalize font-medium text-zinc-200">{role}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick shortcuts */}
          <Card className="border-zinc-800 bg-zinc-900/60 p-4 space-y-3 text-sm">
            <div className="font-semibold text-white">Quick Actions</div>
            <Link href="/book" className="block text-zinc-400 hover:text-amber-400 text-xs">
              &bull; Book Barber Appointment
            </Link>
            <Link href="/shop" className="block text-zinc-400 hover:text-amber-400 text-xs">
              &bull; Explore Clothing Catalog
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
