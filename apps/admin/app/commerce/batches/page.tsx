'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
} from '@dissafyt/ui';
import {
  Layers,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Copy,
  Check,
  Phone,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Flame,
  X,
  FileSpreadsheet,
  UserX,
  Lock,
} from 'lucide-react';
import { adminFetch } from '@/lib/operator';

interface BatchOrder {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  status: string;
  total: number;
  reservation_tier?: string;
  batch_settlement_requested_at?: string;
  paymentUrl: string;
  whatsappLink?: string | null;
  order_items?: {
    id: string;
    product_name: string;
    quantity: number;
    total_price: number;
  }[];
}

interface SkuSummary {
  productName: string;
  sizes: Record<string, number>;
  totalUnits: number;
  unitCogs: number;
  totalCogs: number;
  totalRetail: number;
}

interface BatchAnalytics {
  batch: {
    id: string;
    batch_name: string;
    batch_code: string;
    capital_budget: number;
    remaining_budget: number;
    current_cogs_allocated: number;
    current_retail_value: number;
    total_units_reserved: number;
    status: string;
    contingency_buffer_pct?: number;
  };
  budgetCap: number;
  remainingBudget: number;
  allocatedCogs: number;
  projectedRetail: number;
  projectedNetProfit: number;
  totalUnits: number;
  totalOrders: number;
  settledOrdersCount: number;
  awaitingSettlementCount: number;
  expiredOrdersCount: number;
  waitlistCount: number;
  sizeMatrix: Record<string, number>;
  skuMatrix: Record<string, SkuSummary>;
  orders: BatchOrder[];
}

export default function AdminBatchesPage() {
  const [analytics, setAnalytics] = useState<BatchAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Modals & Drawers
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [editBudgetCap, setEditBudgetCap] = useState('10000');
  const [editBufferPct, setEditBufferPct] = useState('5');
  const [editBatchName, setEditBatchName] = useState('');
  const [copiedProcurement, setCopiedProcurement] = useState(false);
  const [copiedLinkOrderId, setCopiedLinkOrderId] = useState<string | null>(null);

  async function loadBatchData() {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await adminFetch('/api/batches');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
        if (data.analytics?.batch) {
          setEditBudgetCap(String(data.analytics.batch.capital_budget || 10000));
          setEditBufferPct(String(data.analytics.batch.contingency_buffer_pct || 5));
          setEditBatchName(data.analytics.batch.batch_name || 'Batch 01');
        }
      } else {
        setStatusMsg('Failed to load batch data');
      }
    } catch {
      setStatusMsg('Network error loading batch data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatchData();
  }, []);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!analytics?.batch.id) return;
    setActionLoading(true);
    try {
      const res = await adminFetch('/api/batches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: analytics.batch.id,
          capital_budget: parseFloat(editBudgetCap) || 10000,
          contingency_buffer_pct: parseFloat(editBufferPct) || 5,
          batch_name: editBatchName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
        setShowConfigModal(false);
        setStatusMsg('Batch working capital configuration updated successfully.');
      } else {
        const err = await res.json();
        setStatusMsg(err.error || 'Failed to update configuration');
      }
    } catch {
      setStatusMsg('Network error while saving settings');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleNotifySettlement() {
    if (!analytics?.batch.id) return;
    if (!confirm(`Dispatch PayFast settlement balance links to all unconfirmed backers in this batch?`)) return;
    setActionLoading(true);
    try {
      const res = await adminFetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'notify_settlement',
          batchId: analytics.batch.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(`Dispatched settlement links to ${data.notifiedCount} backer(s).`);
        loadBatchData();
      } else {
        setStatusMsg(data.error || 'Failed to send notifications');
      }
    } catch {
      setStatusMsg('Network error dispatching settlement notices');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReleaseGhostSpot(orderId: string, orderNumber: string) {
    if (!confirm(`Release reservation for Order #${orderNumber}? This will return its COGS back to the R10,000 pool and promote the next customer on the waitlist.`)) return;
    setActionLoading(true);
    try {
      const res = await adminFetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'release_ghost',
          orderId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(`Released spot for Order #${orderNumber}.${data.promotedOrderId ? ' Automatically promoted waitlist customer!' : ''}`);
        loadBatchData();
      } else {
        setStatusMsg(data.error || 'Failed to release spot');
      }
    } catch {
      setStatusMsg('Network error releasing spot');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleForceUnlock() {
    if (!analytics?.batch.id) return;
    if (!confirm(`Force-unlock Batch 01 for production now? This locks the current order count and transitions to payment collection.`)) return;
    setActionLoading(true);
    try {
      const res = await adminFetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'force_unlock',
          batchId: analytics.batch.id,
        }),
      });

      if (res.ok) {
        setStatusMsg('Batch manually unlocked for production!');
        loadBatchData();
      }
    } catch {
      setStatusMsg('Network error force-unlocking batch');
    } finally {
      setActionLoading(false);
    }
  }

  function copyProcurementText() {
    if (!analytics) return;
    const lines = [
      `==================================================`,
      `DISSAFYT WHOLESALE PROCUREMENT ORDER — ${analytics.batch.batch_name.toUpperCase()}`,
      `Total Garments: ${analytics.totalUnits} Units | Budget Consumed: R ${analytics.allocatedCogs.toFixed(2)}`,
      `==================================================`,
      ``,
      `BLANK GARMENT BREAKDOWN:`,
      ...Object.values(analytics.skuMatrix).map((sku) => {
        const sizeBreakdown = Object.entries(sku.sizes)
          .map(([sz, qty]) => `${sz}: ${qty}`)
          .join(' | ');
        return `• ${sku.productName} (${sku.totalUnits} units)\n   Sizes: [ ${sizeBreakdown} ]\n   Wholesale Subtotal: R ${sku.totalCogs.toFixed(2)}`;
      }),
      ``,
      `AGGREGATE SIZE TOTALS FOR MILL:`,
      ...Object.entries(analytics.sizeMatrix).map(([size, count]) => `  - Size ${size}: ${count} blanks`),
      ``,
      `Printed & Packaged at: 1 Norwalk Way, Bernadino Heights, Cape Town`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedProcurement(true);
    setTimeout(() => setCopiedProcurement(false), 2500);
  }

  const budgetPct = analytics
    ? Math.min(100, Math.round((analytics.allocatedCogs / (analytics.budgetCap || 1)) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
              DISSAFYT GARMENT LAB // PRODUCTION PIPELINE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight mt-1">
            Batch 01 &bull; Bounded Working Capital Command
          </h1>
          <p className="text-xs text-stone-400 max-w-2xl mt-1">
            Manage your R10,000 founder manufacturing allocation. Multi-SKU orders are atomically metered against wholesale blank COGS with automated settlement and ghost reservation releases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBatchData}
            disabled={loading}
            className="border-stone-800 text-stone-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProcurementModal(true)}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
            Supplier Procurement Sheet
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfigModal(true)}
            className="border-stone-800 text-white"
          >
            Configure Budget
          </Button>

          <Button
            size="sm"
            onClick={handleNotifySettlement}
            disabled={actionLoading || analytics?.batch.status === 'in_production'}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Broadcast Settlement Links
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-lg bg-stone-900 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-stone-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Capital Budget */}
        <Card className="border-stone-800 bg-stone-900/60 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span>Working Capital Cap</span>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            R {analytics?.budgetCap.toFixed(2) || '10,000.00'}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-1">
            R {analytics?.remainingBudget.toFixed(2) || '0.00'} Headroom Remaining
          </div>
        </Card>

        {/* Card 2: Wholesale COGS Consumed */}
        <Card className="border-stone-800 bg-stone-900/60 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span>Wholesale COGS Consumed</span>
            <Layers className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 font-mono mt-2">
            R {analytics?.allocatedCogs.toFixed(2) || '0.00'}
          </div>
          <div className="text-[11px] font-mono text-stone-400 mt-1">
            {budgetPct}% of R10,000 ceiling claimed
          </div>
        </Card>

        {/* Card 3: Top-Line Retail Value */}
        <Card className="border-stone-800 bg-stone-900/60 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span>Projected Order Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            R {analytics?.projectedRetail.toFixed(2) || '0.00'}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 font-bold mt-1">
            +R {analytics?.projectedNetProfit.toFixed(2) || '0.00'} Net Profit
          </div>
        </Card>

        {/* Card 4: Reserved Units */}
        <Card className="border-stone-800 bg-stone-900/60 p-5">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span>Committed Garments</span>
            <Package className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {analytics?.totalUnits || 0} Units
          </div>
          <div className="text-[11px] font-mono text-stone-400 mt-1">
            Across {analytics?.totalOrders || 0} Backers ({analytics?.waitlistCount || 0} Waitlisted)
          </div>
        </Card>
      </div>

      {/* Visual Fuel Gauge Bar */}
      <Card className="border-stone-800 bg-stone-900/40 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white uppercase">Batch 01 Capital Saturation:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                budgetPct >= 100
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {analytics?.batch.status.toUpperCase() || 'ACCUMULATING'}
            </span>
          </div>

          <div className="text-stone-400">
            {budgetPct >= 100 ? (
              <span className="text-amber-400 font-bold">R0 Subsidized Pool Filled &bull; Subsequent Orders Require 50% Deposit</span>
            ) : (
              <span>R0 Founder-Backed Reservations Open</span>
            )}
          </div>
        </div>

        <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-stone-800 relative">
          <div
            className={`h-full transition-all duration-500 ${
              budgetPct >= 95
                ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
            style={{ width: `${Math.max(2, budgetPct)}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-mono text-stone-500">
          <span>R 0.00</span>
          <span>50% (R 5,000.00)</span>
          <span>100% (R 10,000.00 Cap)</span>
        </div>
      </Card>

      {/* Backers & Orders Ledger */}
      <Card className="border-stone-800 bg-stone-900/40">
        <CardHeader className="border-b border-stone-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-white">
                Batch Backers Ledger ({analytics?.orders.length || 0})
              </CardTitle>
              <CardDescription className="text-xs text-stone-400 mt-0.5">
                Real-time allocations, PayFast settlement statuses, and 1-click ghost spot releases.
              </CardDescription>
            </div>

            {analytics?.batch.status === 'accumulating' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceUnlock}
                className="text-xs border-stone-700 text-stone-300 hover:text-white"
              >
                <Lock className="h-3.5 w-3.5 mr-1" />
                Force-Unlock Partial Batch Early
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-xs font-mono text-stone-500">
              Loading batch allocations...
            </div>
          ) : !analytics?.orders || analytics.orders.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Package className="h-8 w-8 text-stone-600 mx-auto" />
              <div className="text-sm font-bold text-white">No Pre-orders In This Batch Yet</div>
              <p className="text-xs text-stone-500">
                Customers pre-ordering from the Streetwear Drop Room will atomically register here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950/80 text-stone-400 font-mono uppercase text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Collector</th>
                    <th className="py-3 px-4">Garments</th>
                    <th className="py-3 px-4">Retail Total</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono text-stone-300">
                  {analytics.orders.map((order) => {
                    const isSettled =
                      order.status === 'paid' ||
                      order.status === 'processing' ||
                      order.status === 'shipped';

                    return (
                      <tr key={order.id} className="hover:bg-stone-800/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          #{order.order_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{order.customer_name || 'Collector'}</div>
                          <div className="text-[10px] text-stone-500">{order.customer_email}</div>
                          {order.customer_phone && (
                            <div className="text-[10px] text-amber-400">{order.customer_phone}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            {order.order_items?.map((item) => (
                              <div key={item.id} className="text-[11px] text-stone-300">
                                {item.quantity}x {item.product_name}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-400">
                          R {Number(order.total).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          {order.reservation_tier === 'subsidized_free' ? (
                            <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase">
                              Founder R0
                            </span>
                          ) : order.reservation_tier === 'waitlist' ? (
                            <span className="rounded bg-stone-800 text-stone-400 border border-stone-700 px-2 py-0.5 text-[9px] font-bold uppercase">
                              Waitlist
                            </span>
                          ) : (
                            <span className="rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase">
                              50% Deposit
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                              isSettled
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : order.status === 'batch_payment_requested'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : order.status === 'cancelled'
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'bg-stone-800 text-stone-400'
                            }`}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {order.whatsappLink && (
                              <a
                                href={order.whatsappLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                                title="Send WhatsApp Payment Link"
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                            )}

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(order.paymentUrl);
                                setCopiedLinkOrderId(order.order_number);
                                setTimeout(() => setCopiedLinkOrderId(null), 2000);
                              }}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                              title="Copy Settlement Link"
                            >
                              {copiedLinkOrderId === order.order_number ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>

                            {!isSettled && order.status !== 'cancelled' && (
                              <button
                                onClick={() => handleReleaseGhostSpot(order.id, order.order_number)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                                title="Release Ghost Spot to Waitlist"
                              >
                                <UserX className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Procurement Matrix Modal */}
      {showProcurementModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div>
                <div className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                  FACTORY ORDER SPECIFICATION
                </div>
                <h3 className="text-xl font-black uppercase text-white mt-0.5">
                  Supplier Procurement Matrix &bull; Vic Bay / Baron
                </h3>
              </div>
              <button
                onClick={() => setShowProcurementModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Aggregated sizing requirements across all {analytics?.totalOrders || 0} customer pre-orders in this drop. Copy this block to issue your wholesale blank purchase order.
            </p>

            <div className="space-y-4">
              {analytics &&
                Object.values(analytics.skuMatrix).map((sku) => (
                  <div
                    key={sku.productName}
                    className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-white text-sm">{sku.productName}</div>
                      <div className="text-xs font-mono text-amber-400 font-bold">
                        {sku.totalUnits} Units &bull; R {sku.totalCogs.toFixed(2)} COGS
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-stone-800/80">
                      {Object.entries(sku.sizes).map(([sz, qty]) => (
                        <div key={sz} className="text-center p-2 rounded-lg bg-stone-900 border border-stone-800">
                          <div className="text-[10px] font-mono text-stone-500 uppercase">Size {sz}</div>
                          <div className="text-base font-black text-white font-mono">{qty}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowProcurementModal(false)}
                className="text-stone-400"
              >
                Close
              </Button>
              <Button
                onClick={copyProcurementText}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase"
              >
                {copiedProcurement ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy PO for Blank Supplier
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-white">Batch Budget Configuration</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-stone-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-stone-300">Batch Name</Label>
                <Input
                  value={editBatchName}
                  onChange={(e) => setEditBatchName(e.target.value)}
                  className="bg-stone-950 border-stone-800 text-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-stone-300">Working Capital Ceiling (ZAR)</Label>
                <Input
                  type="number"
                  step="500"
                  value={editBudgetCap}
                  onChange={(e) => setEditBudgetCap(e.target.value)}
                  className="bg-stone-950 border-stone-800 text-white font-mono text-base font-bold text-amber-400"
                  required
                />
                <p className="text-[10px] text-stone-400">
                  Total founder capital allocated to sponsor R0 pre-orders.
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-stone-300">Supplier Price Contingency Buffer (%)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="20"
                  value={editBufferPct}
                  onChange={(e) => setEditBufferPct(e.target.value)}
                  className="bg-stone-950 border-stone-800 text-white font-mono"
                  required
                />
                <p className="text-[10px] text-stone-400">
                  Safe buffer (e.g. 5%) to absorb unexpected blank price or shipping increases.
                </p>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowConfigModal(false)}
                  className="text-stone-400"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                >
                  {actionLoading ? 'Saving...' : 'Save Parameters'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
