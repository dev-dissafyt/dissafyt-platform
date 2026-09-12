'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@dissafyt/ui';
import {
  Users,
  ShoppingBag,
  Scissors,
  DollarSign,
  Activity,
  RefreshCw,
  TrendingUp,
  Package,
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { adminFetch } from '@/lib/operator';

interface OperationalMetrics {
  overview: {
    totalRevenue: number;
    commerceRevenue: number;
    barbershopRevenue: number;
    subscriptionRevenue?: number;
    walkInRevenue?: number;
    serviceValueDelivered?: number;
    totalCustomers: number;
    totalOrders: number;
    totalBookings: number;
  };
  orders: {
    total: number;
    pending: number;
    paid: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
    todayCount: number;
    upcomingCount: number;
  };
  barberPerformance: {
    staffId: string;
    displayName: string;
    completedCuts: number;
    upcomingCuts: number;
  }[];
  recentActivity: {
    id: string;
    type: 'order' | 'booking';
    title: string;
    subtitle: string;
    amount: number;
    status: string;
    timestamp: string;
  }[];
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMetrics() {
    setLoading(true);
    try {
      const res = await adminFetch('/api/reporting');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (e) {
      console.error('Failed to load operational metrics:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Operations & Executive Overview</h1>
          <p className="text-sm text-stone-400">
            Real-time unified intelligence across Dissafyt Streetwear and Ace of Fyt Barbershop.
          </p>
        </div>
        <Button
          onClick={fetchMetrics}
          disabled={loading}
          variant="outline"
          className="border-stone-800 text-stone-300 hover:bg-stone-800 self-start sm:self-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Live Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gross Revenue */}
        <Card className="border-stone-800 bg-stone-900/60 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">Total Gross Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? (
                '...'
              ) : (
                `R ${(metrics?.overview.totalRevenue || 0).toLocaleString('en-ZA', {
                  minimumFractionDigits: 2,
                })}`
              )}
            </div>
            <div className="text-[11px] text-stone-400 mt-2 flex items-center justify-between border-t border-stone-800/80 pt-2">
              <span>Subs: R {(metrics?.overview.subscriptionRevenue || 0).toFixed(0)}</span>
              <span>&bull;</span>
              <span>Apparel: R {(metrics?.overview.commerceRevenue || 0).toFixed(0)}</span>
              <span>&bull;</span>
              <span>Walk-in: R {(metrics?.overview.walkInRevenue || 0).toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="border-stone-800 bg-stone-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">Registered Users</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : metrics?.overview.totalCustomers ?? 0}
            </div>
            <p className="text-xs text-stone-500 mt-1">Unified Dissafyt Profiles</p>
          </CardContent>
        </Card>

        {/* Commerce Orders */}
        <Card className="border-stone-800 bg-stone-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">Commerce Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : metrics?.overview.totalOrders ?? 0}
            </div>
            <div className="text-xs text-stone-400 mt-2 flex items-center gap-2">
              <span className="text-emerald-400 font-medium">{metrics?.orders.paid ?? 0} Paid</span>
              <span>&bull;</span>
              <span className="text-amber-400 font-medium">{metrics?.orders.shipped ?? 0} Shipped</span>
            </div>
          </CardContent>
        </Card>

        {/* Barbershop Bookings */}
        <Card className="border-stone-800 bg-stone-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">Ace of Fyt Appointments</CardTitle>
            <Scissors className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : metrics?.overview.totalBookings ?? 0}
            </div>
            <div className="text-xs text-stone-400 mt-2 flex items-center gap-2">
              <span className="text-blue-400 font-medium">{metrics?.bookings.todayCount ?? 0} Today</span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-medium">{metrics?.bookings.upcomingCount ?? 0} Upcoming</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Fulfillment Pipeline */}
        <Card className="border-stone-800 bg-stone-900/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-white flex items-center">
                <Package className="mr-2 h-5 w-5 text-amber-500" />
                Commerce Fulfillment Pipeline
              </CardTitle>
              <CardDescription>Order processing stages with Courier Guy delivery</CardDescription>
            </div>
            <Link
              href="/commerce/orders"
              className="text-xs text-amber-500 hover:text-amber-400 flex items-center font-medium"
            >
              View Orders <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-stone-900/80 border border-stone-800 text-center">
                <div className="text-xs text-stone-400 mb-1">Pending</div>
                <div className="text-xl font-bold text-stone-200">{metrics?.orders.pending ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-center">
                <div className="text-xs text-emerald-400 mb-1">Paid</div>
                <div className="text-xl font-bold text-emerald-300">{metrics?.orders.paid ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-800/40 text-center">
                <div className="text-xs text-blue-400 mb-1">Processing</div>
                <div className="text-xl font-bold text-blue-300">{metrics?.orders.processing ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-center">
                <div className="text-xs text-amber-400 mb-1">Shipped</div>
                <div className="text-xl font-bold text-amber-300">{metrics?.orders.shipped ?? 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Master Barber Schedule Load */}
        <Card className="border-stone-800 bg-stone-900/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-white flex items-center">
                <Scissors className="mr-2 h-5 w-5 text-amber-500" />
                Master Barber Chair Load
              </CardTitle>
              <CardDescription>Upcoming schedule and cut volume per barber</CardDescription>
            </div>
            <Link
              href="/barbershop"
              className="text-xs text-amber-500 hover:text-amber-400 flex items-center font-medium"
            >
              Open Schedule <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-6 text-center text-stone-500 text-sm">Loading staff metrics...</div>
            ) : metrics?.barberPerformance.length === 0 ? (
              <div className="py-6 text-center text-stone-500 text-sm">No active barbers configured.</div>
            ) : (
              <div className="space-y-3">
                {metrics?.barberPerformance.map((barber) => (
                  <div
                    key={barber.staffId}
                    className="flex items-center justify-between p-3 rounded-lg bg-stone-900/80 border border-stone-800"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                        {barber.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{barber.displayName}</div>
                        <div className="text-xs text-stone-400">Master Grooming Specialist</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/40">
                        {barber.upcomingCuts} Upcoming
                      </span>
                      <span className="text-stone-400">
                        {barber.completedCuts} Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed and Infrastructure Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Unified Activity Feed */}
        <Card className="border-stone-800 bg-stone-900/40 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-white flex items-center">
                <Activity className="mr-2 h-5 w-5 text-amber-500" />
                Live Unified Activity Stream
              </CardTitle>
              <CardDescription>
                Real-time chronological events across Commerce and Grooming
              </CardDescription>
            </div>
            <Link
              href="/finance"
              className="text-xs text-amber-500 hover:text-amber-400 flex items-center font-medium"
            >
              Payment Audit <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-stone-500 text-sm">Loading activity stream...</div>
            ) : metrics?.recentActivity.length === 0 ? (
              <div className="py-12 text-center text-stone-500 text-sm">
                No orders or appointments recorded yet. New activity will stream here in real-time.
              </div>
            ) : (
              <div className="space-y-3">
                {metrics?.recentActivity.map((act) => (
                  <div
                    key={`${act.type}-${act.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-stone-900/60 border border-stone-800/80 hover:bg-stone-800/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`p-2 rounded-md ${
                          act.type === 'order'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {act.type === 'order' ? (
                          <ShoppingBag className="h-4 w-4" />
                        ) : (
                          <Scissors className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{act.title}</div>
                        <div className="text-xs text-stone-400 truncate">{act.subtitle}</div>
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="text-sm font-bold text-white">R {act.amount.toFixed(2)}</div>
                      <div className="text-[10px] text-stone-500 uppercase tracking-wider font-mono">
                        {act.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Infrastructure & Gateway Status */}
        <Card className="border-stone-800 bg-stone-900/40">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-amber-500" />
              Platform Ecosystem
            </CardTitle>
            <CardDescription>Core microservices & cloud integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-stone-800">
              <span className="text-stone-300">Dissafyt Sovereign Database</span>
              <span className="text-emerald-400 font-mono">ONLINE (RLS Active)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-800">
              <span className="text-stone-300">Decoupled Domain API</span>
              <span className="text-emerald-400 font-mono">@dissafyt/api (200 OK)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-800">
              <span className="text-stone-300">PayFast Gateway</span>
              <span className="text-emerald-400 font-mono">Merchant 17675995</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-800">
              <span className="text-stone-300">Courier Guy Logistics</span>
              <span className="text-emerald-400 font-mono">Pudo / Lockers Ready</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-stone-300">Monorepo Web Engines</span>
              <span className="text-emerald-400 font-mono">Customer (3000) &bull; Admin (3001)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
