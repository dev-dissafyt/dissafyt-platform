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
  Crown,
  Flame,
  Phone,
  Layers,
  Sliders,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminFetch } from '@/lib/operator';

interface OperationalMetrics {
  overview: {
    totalRevenue: number;
    commerceRevenue: number;
    preorderRevenue?: number;
    inStockCommerceRevenue?: number;
    barbershopRevenue: number;
    subscriptionRevenue?: number;
    walkInRevenue?: number;
    founderPassRevenue?: number;
    serviceValueDelivered?: number;
    totalCustomers: number;
    totalOrders: number;
    totalBookings: number;
    preorderOrdersCount?: number;
    preorderUnitsCount?: number;
  };
  founderPass?: {
    totalTarget: number;
    totalCapitalTarget: number;
    totalPasses: number;
    activePaidPasses: number;
    pendingPledges: number;
    currentCapitalRaised: number;
    pctFunded: number;
    spotsRemaining: number;
    totalCutsRedeemed: number;
    recentPatrons: {
      id: string;
      passNumber: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      status: string;
      cutsUsed: number;
      totalCuts: number;
      amountPaid: number;
      paymentMethod?: string;
      createdAt: string;
    }[];
  };
  orders: {
    total: number;
    pending: number;
    paid: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    preorderCount?: number;
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
    type: 'order' | 'booking' | 'founder_pass';
    title: string;
    subtitle: string;
    amount: number;
    status: string;
    timestamp: string;
    isPreorder?: boolean;
  }[];
}

export default function AdminDashboardPage() {
  const pathname = usePathname();
  const basePrefix = pathname.startsWith('/admin') ? '/admin' : '';
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [batchData, setBatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMetrics() {
    setLoading(true);
    try {
      const [reportingRes, batchRes] = await Promise.all([
        adminFetch('/api/reporting'),
        adminFetch('/api/batches').catch(() => null),
      ]);
      if (reportingRes.ok) {
        const data = await reportingRes.json();
        setMetrics(data);
      }
      if (batchRes && batchRes.ok) {
        const bData = await batchRes.json();
        setBatchData(bData);
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
            Real-time unified intelligence across Dissafyt Streetwear, Pre-order Drops, and Ace of Fyt Barbershop.
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
            <div className="text-[11px] text-stone-400 mt-2 flex flex-wrap items-center gap-1.5 border-t border-stone-800/80 pt-2 font-mono">
              <span>In-Stock: R {(metrics?.overview.inStockCommerceRevenue ?? metrics?.overview.commerceRevenue ?? 0).toFixed(0)}</span>
              <span>&bull;</span>
              <span className="text-amber-400">Pre-orders: R {(metrics?.overview.preorderRevenue || 0).toFixed(0)}</span>
              <span>&bull;</span>
              <span>Barber: R {(metrics?.overview.barbershopRevenue || 0).toFixed(0)}</span>
              {(metrics?.overview.founderPassRevenue || 0) > 0 && (
                <>
                  <span>&bull;</span>
                  <span className="text-amber-500 font-bold">Founder: R {(metrics?.overview.founderPassRevenue || 0).toFixed(0)}</span>
                </>
              )}
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

        {/* Commerce Orders & Pre-orders */}
        <Card className="border-stone-800 bg-stone-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">Commerce & Pre-orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : metrics?.overview.totalOrders ?? 0}
            </div>
            <div className="text-xs text-stone-400 mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-amber-400 font-medium">
                {metrics?.overview.preorderOrdersCount ?? 0} Pre-orders ({metrics?.overview.preorderUnitsCount ?? 0} pcs)
              </span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-medium">{metrics?.orders.paid ?? 0} Paid</span>
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

      {/* ============================================================== */}
      {/* WORKING CAPITAL PRE-ORDER BATCH POOL                          */}
      {/* ============================================================== */}
      <Card className="border-amber-500/40 bg-gradient-to-br from-stone-900/90 via-stone-950 to-stone-900/90 relative overflow-hidden shadow-xl shadow-amber-500/5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />
        
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-[10px] font-black uppercase tracking-wider">
                <Layers className="w-3 h-3 text-amber-400 animate-pulse" />
                Working Capital Pre-Order Pool
              </span>
              <span className="text-xs font-mono text-stone-400">
                {batchData?.analytics?.batch?.batch_code || 'batch-01'} &bull; Status: {batchData?.analytics?.batch?.status || 'accumulating'}
              </span>
            </div>
            <CardTitle className="text-xl text-white flex items-center">
              <Layers className="mr-2 h-5 w-5 text-amber-400" />
              {batchData?.analytics?.batch?.batch_name || 'Batch 01 — Cape Town Streetwear Drop'}
            </CardTitle>
            <CardDescription className="text-xs">
              Automated R10,000 manufacturing ceiling. Atomic row-level spot reservation protects against wholesale blank over-allocation with automated 48h settlement cascade.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`${basePrefix}/commerce/batches?edit=true`}>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-mono font-bold"
              >
                <Sliders className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Edit Batch Parameters
              </Button>
            </Link>
            <Link href={`${basePrefix}/commerce/batches`}>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono uppercase tracking-wider shadow-lg shadow-amber-500/10"
              >
                Open Batches Engine &rarr;
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* 4 Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* 1. Working Capital Cap */}
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
              <div className="text-[11px] font-mono uppercase text-stone-400">Capital Budget Ceiling</div>
              <div className="text-2xl font-black font-mono text-amber-400">
                R {(batchData?.analytics?.budgetCap || 10000).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-stone-500">
                Fixed manufacturing allocation
              </div>
            </div>

            {/* 2. Remaining Headroom */}
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
              <div className="text-[11px] font-mono uppercase text-stone-400">Remaining Budget</div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                R {(batchData?.analytics?.remainingBudget ?? 10000).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-emerald-500 font-bold">
                Available for R0 pre-orders
              </div>
            </div>

            {/* 3. Wholesale COGS Allocated */}
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
              <div className="text-[11px] font-mono uppercase text-stone-400">Wholesale COGS Claimed</div>
              <div className="text-2xl font-black font-mono text-orange-400">
                R {(batchData?.analytics?.allocatedCogs || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-stone-500">
                {batchData?.analytics?.totalUnits || 0} blank garments reserved
              </div>
            </div>

            {/* 4. Projected Net Profit */}
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
              <div className="text-[11px] font-mono uppercase text-stone-400">Projected Retail Net</div>
              <div className="text-2xl font-black font-mono text-white">
                R {(batchData?.analytics?.projectedNetProfit || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-stone-400">
                Retail: R {(batchData?.analytics?.projectedRetail || 0).toFixed(0)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-stone-300 uppercase font-semibold">
                Working Capital Allocation:{' '}
                <strong className="text-amber-400">
                  {batchData?.analytics
                    ? Math.round(((batchData.analytics.allocatedCogs || 0) / (batchData.analytics.budgetCap || 10000)) * 100)
                    : 0}%
                </strong>
              </span>
              <span className="text-stone-400">
                R {(batchData?.analytics?.allocatedCogs || 0).toLocaleString()} / R {(batchData?.analytics?.budgetCap || 10000).toLocaleString()} Ceiling
              </span>
            </div>
            <div className="h-3 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 transition-all duration-700 shadow-md shadow-amber-500/40"
                style={{
                  width: `${Math.max(
                    2,
                    Math.min(
                      100,
                      batchData?.analytics
                        ? Math.round(((batchData.analytics.allocatedCogs || 0) / (batchData.analytics.budgetCap || 10000)) * 100)
                        : 0
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================== */}
      {/* FOUNDER'S PASS & PHYSICAL BUILDOUT CAPITAL POOL               */}
      {/* ============================================================== */}
      <Card className="border-[#ff5500]/40 bg-gradient-to-br from-stone-900/90 via-stone-950 to-stone-900/90 relative overflow-hidden shadow-xl shadow-[#ff5500]/5">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff5500] via-amber-500 to-[#ff7700]" />
        
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ff5500]/20 border border-[#ff5500]/40 text-[#ff5500] font-mono text-[10px] font-black uppercase tracking-wider">
                <Flame className="w-3 h-3 fill-[#ff5500] animate-pulse" />
                Physical Buildout Capital
              </span>
              <span className="text-xs font-mono text-stone-400">
                1 Norwalk Way, Bernadino Heights Studio
              </span>
            </div>
            <CardTitle className="text-xl text-white flex items-center">
              <Crown className="mr-2 h-5 w-5 text-amber-400" />
              Founder Pass &amp; Capital Telemetry
            </CardTitle>
            <CardDescription className="text-xs">
              Live tracking of 50 prepaid patron passes (R1,200 for 12 cuts) funding Belmont chairs, custom mirrors, and studio stations
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
              TARGET: R 60,000.00
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* 4 Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* 1. Capital Collected */}
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
              <div className="text-[11px] font-mono uppercase text-stone-400">Capital Collected</div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                R {(metrics?.founderPass?.currentCapitalRaised || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-stone-500">
                {metrics?.founderPass?.pctFunded || 0}% of R 60,000 goal
              </div>
            </div>

            {/* 2. Active Passes */}
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
              <div className="text-[11px] font-mono uppercase text-stone-400">Passes Claimed</div>
              <div className="text-2xl font-black font-mono text-white flex items-baseline gap-1.5">
                <span>{metrics?.founderPass?.activePaidPasses || 0}</span>
                <span className="text-xs font-normal text-stone-500">/ 50 Max</span>
              </div>
              <div className="text-[10px] font-mono text-[#ff5500] font-bold">
                {metrics?.founderPass?.spotsRemaining ?? 50} Passes Remaining
              </div>
            </div>

            {/* 3. Pledged Waitlist */}
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
              <div className="text-[11px] font-mono uppercase text-stone-400">Waitlist Pledges</div>
              <div className="text-2xl font-black font-mono text-amber-300">
                {metrics?.founderPass?.pendingPledges || 0}
              </div>
              <div className="text-[10px] font-mono text-stone-500">
                Awaiting payment completion
              </div>
            </div>

            {/* 4. Haircut Redemptions */}
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1">
              <div className="text-[11px] font-mono uppercase text-stone-400">Cuts Delivered</div>
              <div className="text-2xl font-black font-mono text-blue-400 flex items-baseline gap-1.5">
                <span>{metrics?.founderPass?.totalCutsRedeemed || 0}</span>
                <span className="text-xs font-normal text-stone-500">
                  / {((metrics?.founderPass?.activePaidPasses || 0) * 12)} Entitled
                </span>
              </div>
              <div className="text-[10px] font-mono text-stone-500">
                12 cuts/year prepaid entitlement
              </div>
            </div>
          </div>

          {/* Progress Bar towards R60k buildout */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-stone-300 uppercase font-semibold">
                Studio Buildout Funding Progress: <strong className="text-amber-400">{metrics?.founderPass?.pctFunded || 0}%</strong>
              </span>
              <span className="text-stone-400">
                R {(metrics?.founderPass?.currentCapitalRaised || 0).toLocaleString()} / R 60,000 Target
              </span>
            </div>
            <div className="h-3 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff5500] via-amber-500 to-emerald-500 transition-all duration-700 shadow-md shadow-[#ff5500]/40"
                style={{ width: `${Math.max(2, Math.min(100, metrics?.founderPass?.pctFunded || 0))}%` }}
              />
            </div>
          </div>

          {/* Recent Patrons Roster */}
          <div className="space-y-3 pt-2 border-t border-stone-800/80">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-stone-300 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>Founding Patron Roster ({metrics?.founderPass?.totalPasses || 0} Total Backers)</span>
              </span>
              <span className="text-[11px] font-mono text-stone-500">
                Direct WhatsApp updates for studio milestones
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-stone-500 text-xs font-mono">Loading founder patrons...</div>
            ) : !metrics?.founderPass?.recentPatrons || metrics.founderPass.recentPatrons.length === 0 ? (
              <div className="py-6 text-center text-stone-500 text-xs font-mono rounded-lg bg-stone-950/40 border border-stone-800/60">
                No founder passes registered yet. Online purchases and counter pledges will appear here live.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400 text-[11px]">
                      <th className="pb-2 font-medium">Pass #</th>
                      <th className="pb-2 font-medium">Patron Name</th>
                      <th className="pb-2 font-medium">Contact</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Cuts Used</th>
                      <th className="pb-2 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {metrics.founderPass.recentPatrons.map((patron) => {
                      const cleanPhone = (patron.customerPhone || '').replace(/[^0-9]/g, '');
                      const waText = encodeURIComponent(
                        `Hi ${patron.customerName}, this is Dissafyt Admin regarding your Founder Pass #${patron.passNumber} at 1 Norwalk Way studio.`
                      );
                      const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : null;

                      return (
                        <tr key={patron.id} className="hover:bg-stone-950/60 transition-colors">
                          <td className="py-2.5 font-bold text-amber-400">{patron.passNumber}</td>
                          <td className="py-2.5 font-medium text-white">{patron.customerName}</td>
                          <td className="py-2.5 text-stone-400">
                            <div>{patron.customerPhone || '—'}</div>
                            <div className="text-[10px] text-stone-500">{patron.customerEmail}</div>
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                patron.status === 'active'
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                  : patron.status === 'exhausted'
                                  ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                              }`}
                            >
                              {patron.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-stone-300">
                            {patron.cutsUsed} / {patron.totalCuts} cuts
                          </td>
                          <td className="py-2.5 text-right">
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 text-emerald-300 text-[10px] font-bold transition-all"
                              >
                                <Phone className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              href="/admin/commerce/orders"
              className="text-xs text-amber-500 hover:text-amber-400 flex items-center font-medium"
            >
              View Orders <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg bg-stone-900/80 border border-stone-800 text-center">
                <div className="text-xs text-stone-400 mb-1">Pending</div>
                <div className="text-xl font-bold text-stone-200">{metrics?.orders.pending ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-center">
                <div className="text-xs text-amber-400 mb-1">Pre-orders</div>
                <div className="text-xl font-bold text-amber-300">{metrics?.orders.preorderCount ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-center">
                <div className="text-xs text-emerald-400 mb-1">Paid</div>
                <div className="text-xl font-bold text-emerald-300">{metrics?.orders.paid ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-800/40 text-center">
                <div className="text-xs text-blue-400 mb-1">Processing</div>
                <div className="text-xl font-bold text-blue-300">{metrics?.orders.processing ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-center">
                <div className="text-xs text-emerald-400 mb-1">Shipped</div>
                <div className="text-xl font-bold text-emerald-300">{metrics?.orders.shipped ?? 0}</div>
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
              href="/admin/barbershop"
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
              href="/admin/finance"
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
                            ? act.isPreorder
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : act.type === 'founder_pass'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {act.type === 'order' ? (
                          <ShoppingBag className="h-4 w-4" />
                        ) : act.type === 'founder_pass' ? (
                          <Crown className="h-4 w-4" />
                        ) : (
                          <Scissors className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                          <span>{act.title}</span>
                          {act.isPreorder && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/40">
                              Pre-order
                            </span>
                          )}
                        </div>
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
