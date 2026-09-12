'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Layers, 
  ArrowUpRight, 
  Sparkles, 
  Shirt, 
  Store, 
  CheckCircle2, 
  Clock, 
  PieChart, 
  BarChart3,
  RefreshCw,
  Info
} from 'lucide-react';
import type { CreatorSalesSummary, StackedReturnsMetrics } from '@dissafyt/api';
import { getActivePersona } from '@/lib/persona';

export default function CreatorSalesPage() {
  const [sales, setSales] = useState<CreatorSalesSummary | null>(null);
  const [stacked, setStacked] = useState<StackedReturnsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModelTab, setActiveModelTab] = useState<'drip' | 'stacked'>('drip');

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const persona = getActivePersona();
      const brandParam = persona.brandId ? `?brandId=${persona.brandId}` : '';
      const res = await fetch(`/api/creator/sales${brandParam}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales);
        setStacked(data.stackedReturns);
        if (data.sales.deal_type === 'stacked_returns') {
          setActiveModelTab('stacked');
        }
      }
    } catch (err) {
      console.error('Failed to load creator sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();

    const handlePersonaChange = () => {
      fetchSalesData();
    };
    window.addEventListener('studio_persona_changed', handlePersonaChange);
    return () => window.removeEventListener('studio_persona_changed', handlePersonaChange);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Brand Commerce Analytics • {sales?.brand_name || 'Your Brand'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sales Velocity & Drip Income Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Real-time financial transparency. Monitor product drop revenue, net royalty earnings, 
            unit volume curves across sizes and colorways, and physical studio rack sell-through.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSalesData}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <Link
            href="/payouts"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payout Ledger</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Aggregating brand sales ledger...</p>
        </div>
      ) : (
        <>
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
              <span className="text-zinc-500 text-xs font-mono uppercase block">Total Gross Revenue</span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                R{sales?.total_gross_revenue.toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 flex items-center space-x-1">
                <ShoppingBag className="w-3 h-3 text-emerald-400" />
                <span>{sales?.total_units_sold} total garments sold</span>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
              <span className="text-zinc-500 text-xs font-mono uppercase block">Total Royalties Earned</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                R{sales?.total_royalties_earned.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-500/80 mt-1">
                {sales?.deal_type === 'stacked_returns' ? 'Option A: Stacked wholesale' : 'Option B: Drip income'}
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
              <span className="text-zinc-500 text-xs font-mono uppercase block">Available for Payout</span>
              <div className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">
                R{sales?.available_for_payout.toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-purple-400" />
                <span>Cleared & ready for EFT</span>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
              <span className="text-zinc-500 text-xs font-mono uppercase block">Pending Clearance</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                R{sales?.royalties_pending_clearance.toLocaleString()}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>7-day holding window</span>
              </div>
            </div>
          </div>

          {/* Model Switcher Tabs */}
          <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
            <button
              onClick={() => setActiveModelTab('drip')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeModelTab === 'drip'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white bg-zinc-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Drip Income & Volume Curve</span>
            </button>
            <button
              onClick={() => setActiveModelTab('stacked')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeModelTab === 'stacked'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white bg-zinc-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Option A: Stacked Returns Wholesale Rack</span>
            </button>
          </div>

          {/* TAB 1: DRIP INCOME & VOLUME METRICS */}
          {activeModelTab === 'drip' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Cut Popularity */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                  <Shirt className="w-4 h-4 text-emerald-400" />
                  <span>Garment Cut Breakdown</span>
                </h3>
                <div className="space-y-3">
                  {sales?.by_category.map((cat, idx) => (
                    <div key={idx} className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-zinc-200">{cat.name}</span>
                        <span className="font-mono text-emerald-400 font-bold">R{cat.revenue}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                        <span>{cat.units} unit(s) sold</span>
                        <span>{Math.round((cat.units / (sales?.total_units_sold || 1)) * 100)}% of sales</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colorway & Size Curves */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-amber-400" />
                  <span>Colorway & Size Distribution</span>
                </h3>

                {/* Colors */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase block">Garment Colors</span>
                  <div className="space-y-2">
                    {sales?.by_color.map((c, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-300">
                          <span>{c.color}</span>
                          <span className="font-mono text-zinc-400">{c.count} ({c.percentage}%)</span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-500 h-2 rounded-full"
                            style={{ width: `${c.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase block mb-2">
                    Size Demand Curve
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {sales?.by_size.map((s, idx) => (
                      <div key={idx} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                        <div className="font-black text-white text-base">{s.size}</div>
                        <div className="text-[10px] text-zinc-500">{s.count} units</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unit Margin Transparency Card */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>Unit Margin Transparency</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Every garment sold through Dissafyt follows a transparent fee structure.
                  </p>

                  <div className="mt-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-3 text-xs">
                    <div className="flex justify-between text-zinc-300">
                      <span>Customer Retail Price</span>
                      <span className="font-mono font-bold text-white">R450.00</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>Blank Garment (240gsm Boxy)</span>
                      <span className="font-mono">- R120.00</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>Direct-to-Film (DTF) Print & Press</span>
                      <span className="font-mono">- R60.00</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>QC & Kasi Kollekt Fulfillment Desk</span>
                      <span className="font-mono">Included</span>
                    </div>
                    <div className="border-t border-zinc-800 pt-2.5 flex justify-between font-bold text-emerald-400 text-sm">
                      <span>Your Net Payout ("Drip Income")</span>
                      <span className="font-mono">R270.00 (60%)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <Link
                    href="/payouts"
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center space-x-1.5"
                  >
                    <span>View Payout Ledger & Bank Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPTION A "STACKED RETURNS" WHOLESALE RACK TRACKER */}
          {activeModelTab === 'stacked' && stacked && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-xs font-mono uppercase text-amber-400 font-bold">
                    Option A Wholesale Model
                  </span>
                  <h3 className="text-xl font-black text-white">
                    Stacked Returns Wholesale Rack Tracker
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Pre-funded inventory batch displayed on physical hangers in Ace of Fyt barbershop + online shop.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {stacked.break_even_reached ? '🎉 Break-Even Achieved' : 'In Recovery'}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Break-Even Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Batch Sell-Through Progress</span>
                  <span className="font-mono font-bold text-amber-400">
                    {stacked.units_sold_total} / {stacked.initial_batch_size} Units Sold ({Math.round((stacked.units_sold_total / stacked.initial_batch_size) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-3.5 overflow-hidden p-0.5 border border-zinc-800">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(stacked.units_sold_total / stacked.initial_batch_size) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Start: 0 Units</span>
                  <span className="text-amber-400 font-bold">Break-Even: {stacked.break_even_units} Units</span>
                  <span>Batch Complete: {stacked.initial_batch_size} Units</span>
                </div>
              </div>

              {/* Stacked Financial Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Initial Stack Invested</span>
                  <div className="text-xl font-bold text-zinc-200 mt-1">R{stacked.total_stack_invested.toLocaleString()}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">50 units @ R180 cost</div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">In-Studio Barbershop Racks</span>
                  <div className="text-xl font-bold text-amber-400 mt-1">{stacked.units_sold_in_studio_racks} sold</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{stacked.remaining_rack_inventory} hangers remaining</div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Gross Recovered</span>
                  <div className="text-xl font-bold text-white mt-1">R{stacked.gross_recovered.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">+{stacked.roi_percentage}% Stacked ROI</div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Net Stacked Profit</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1">R{stacked.net_stacked_profit.toLocaleString()}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Pure profit above stack</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
