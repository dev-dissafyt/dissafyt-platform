'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scissors,
  DollarSign,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Building,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Percent,
  Smartphone,
  Landmark,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label } from '@dissafyt/ui';

interface CashflowItem {
  bookingId: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  isSubscriptionCovered: boolean;
  grossAmount: number;
  platformFeePct: number;
  platformFeeAmount: number;
  netBarberAmount: number;
  locationName: string;
  notes?: string | null;
}

interface BarberProfile {
  id: string;
  user_id?: string | null;
  display_name: string;
  specialty?: 'barber' | 'nail_tech' | 'beautician' | string;
  bio?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  location_id?: string | null;
  location?: {
    id: string;
    name: string;
    address: string;
    city: string;
    google_maps_url?: string | null;
  } | null;
  commission_split_pct: number;
  payfast_merchant_id?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_type?: string | null;
  bank_branch_code?: string | null;
  bank_account_hash?: string | null;
  has_station_pin?: boolean;
  pos_terminal_id?: string | null;
}

const SPECIALTY_LABELS: Record<string, string> = {
  barber: 'Barber',
  nail_tech: 'Nail Technician',
  beautician: 'Beautician',
};

interface DashboardSummary {
  totalBookings: number;
  grossRevenue: number;
  platformSplitPct: number;
  platformFees: number;
  netBarberPayout: number;
  settledPayouts: number;
  pendingChairCash: number;
}

export default function BarberPortalPage() {
  const [loading, setLoading] = useState(true);
  const [barber, setBarber] = useState<BarberProfile | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashflow, setCashflow] = useState<CashflowItem[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings form state
  const [payfastId, setPayfastId] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccNum, setBankAccNum] = useState('');
  const [bankAccType, setBankAccType] = useState('cheque');
  const [bankBranch, setBankBranch] = useState('');
  const [stationPin, setStationPin] = useState('');
  const [newStationPin, setNewStationPin] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'payouts'>('appointments');

  async function loadDashboard() {
    setLoading(true);
    setStatusMsg(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/barber/dashboard', { headers });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load specialist profile');
      }

      const data = await res.json();
      setBarber(data.barber);
      setSummary(data.summary);
      setCashflow(data.cashflow || []);

      // Populate form
      if (data.barber) {
        setPayfastId(data.barber.payfast_merchant_id || '');
        setBankName(data.barber.bank_name || '');
        setBankAccNum(data.barber.bank_account_number || '');
        setBankAccType(data.barber.bank_account_type || 'cheque');
        setBankBranch(data.barber.bank_branch_code || '');
        setStationPin('');
        setNewStationPin('');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: 'error', text: err.message || 'Could not load specialist dashboard' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!barber) return;
    setSavingSettings(true);
    setStatusMsg(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/barber/dashboard', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          staff_id: barber.id,
          payfast_merchant_id: payfastId,
          bank_name: bankName,
          bank_account_number: bankAccNum,
          bank_account_type: bankAccType,
          bank_branch_code: bankBranch,
          station_pin: stationPin || undefined,
          new_station_pin: newStationPin || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setStatusMsg({
        type: 'success',
        text: 'Payout settings encrypted (AES-256-GCM) and SHA-256 integrity hash updated.',
      });
      loadDashboard();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error saving payout settings' });
    } finally {
      setSavingSettings(false);
    }
  }

  const specialtyLabel = SPECIALTY_LABELS[barber?.specialty || 'barber'] || 'Specialist';

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans pb-24">
      {/* Top Banner */}
      <div className="border-b border-stone-800 bg-stone-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide">
                  {barber?.display_name || 'Studio Specialist'} &bull; Station Portal
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-200 border border-stone-700 uppercase tracking-wider">
                  {specialtyLabel}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3" /> Vault Encrypted
                </span>
              </div>
              <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-stone-500" />
                {barber?.location?.name || 'Dissafyt Studio - Bernie'}
                {barber?.location?.address && ` (${barber.location.address})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[11px] text-stone-400 uppercase tracking-wider font-mono">Platform Split</span>
              <span className="text-xs font-bold text-amber-400">
                15% Platform &bull; 85% Specialist Net
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboard}
              className="border-stone-800 bg-stone-900 text-stone-300 hover:text-white text-xs h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {statusMsg && (
          <div
            className={`rounded-xl p-4 flex items-center gap-3 text-sm border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-stone-900/50 border-stone-800 backdrop-blur-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-xs uppercase tracking-wider font-medium">
                <span>Gross Client Revenue</span>
                <TrendingUp className="h-4 w-4 text-stone-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                R {summary?.grossRevenue.toFixed(2) || '0.00'}
              </div>
              <p className="text-[11px] text-stone-500">
                Total client spend across {summary?.totalBookings || 0} scheduled sessions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-stone-900/50 border-stone-800 backdrop-blur-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-xs uppercase tracking-wider font-medium">
                <span>Platform Fee Split (15%)</span>
                <Percent className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                - R {summary?.platformFees.toFixed(2) || '0.00'}
              </div>
              <p className="text-[11px] text-stone-500">
                Dissafyt platform facilities, booking & payment fee
              </p>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/10 border-amber-500/30 backdrop-blur-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-amber-400 text-xs uppercase tracking-wider font-bold">
                <span>Net Barber Payout (85%)</span>
                <DollarSign className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300">
                R {summary?.netBarberPayout.toFixed(2) || '0.00'}
              </div>
              <p className="text-[11px] text-amber-400/80">
                Your direct take-home earnings across all clients
              </p>
            </CardContent>
          </Card>

          <Card className="bg-stone-900/50 border-stone-800 backdrop-blur-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-xs uppercase tracking-wider font-medium">
                <span>POS & Card Terminal</span>
                <Smartphone className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle className="h-4 w-4" />
                {barber?.pos_terminal_id ? `Station POS: ${barber.pos_terminal_id}` : 'Terminal Ready for Deployment'}
              </div>
              <p className="text-[11px] text-stone-500">
                Assigned hardware terminal for in-person contactless taps
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-2 border-b border-stone-800 pb-2">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'appointments'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Client Sessions & Cashflow Ledger ({cashflow.length})
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'payouts'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            PayFast & Banking Settings
          </button>
        </div>

        {/* Tab 1: Client Cashflow Ledger */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Client Cashflow per Appointment</span>
                  <span className="text-xs font-mono font-normal text-stone-400">
                    (Direct 85% Split Calculated Live)
                  </span>
                </h2>
                <p className="text-xs text-stone-400">
                  Detailed ledger breakdown showing client identity, gross price, platform fee, and net barber earnings.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-stone-800 bg-stone-900/40 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950/80 text-stone-400 border-b border-stone-800 uppercase tracking-wider text-[11px] font-mono">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Client</th>
                      <th className="py-3 px-4 font-semibold">Service</th>
                      <th className="py-3 px-4 font-semibold">Date & Time</th>
                      <th className="py-3 px-4 font-semibold">Location</th>
                      <th className="py-3 px-4 font-semibold text-right">Gross Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Platform Fee (15%)</th>
                      <th className="py-3 px-4 font-semibold text-right text-amber-400">Barber Net (85%)</th>
                      <th className="py-3 px-4 font-semibold text-center">Settlement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-sans">
                    {cashflow.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-stone-500">
                          <Scissors className="h-8 w-8 mx-auto mb-2 opacity-40 text-amber-500" />
                          No client appointments booked for your station yet.
                        </td>
                      </tr>
                    ) : (
                      cashflow.map((item) => (
                        <tr key={item.bookingId} className="hover:bg-stone-900/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-stone-400" />
                              {item.clientName}
                            </div>
                            {item.clientPhone && (
                              <div className="text-[11px] text-stone-400 font-mono">
                                {item.clientPhone}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium text-stone-200">
                            {item.serviceName}
                            {item.isSubscriptionCovered && (
                              <span className="block text-[10px] text-emerald-400 font-mono">
                                &bull; VIP Member Cut
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-stone-300">
                            <div className="font-mono text-[11px]">
                              {new Date(item.startTime).toLocaleDateString('en-ZA', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                            </div>
                            <div className="text-[11px] text-amber-400/90 font-mono">
                              {new Date(item.startTime).toLocaleTimeString('en-ZA', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })}{' '}
                              SAST
                            </div>
                          </td>
                          <td className="py-3 px-4 text-stone-400 text-[11px]">
                            {item.locationName}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-white">
                            R {item.grossAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-stone-400">
                            - R {item.platformFeeAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                            R {item.netBarberAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.isSubscriptionCovered || item.paymentStatus === 'membership_covered' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Member Covered
                              </span>
                            ) : item.paymentStatus === 'paid_online' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                PayFast Settled
                              </span>
                            ) : item.paymentStatus === 'paid_in_chair' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                Paid in Chair
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700">
                                Pay on Arrival
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payouts & Banking Settings */}
        {activeTab === 'payouts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Card className="bg-stone-900/50 border-stone-800 shadow-xl">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-amber-500" />
                      Payout & Banking Preferences
                    </CardTitle>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      AES-256-GCM + SHA-256 Hashed
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Set up your PayFast merchant account or direct bank details to receive your 85% earnings automatically. Account numbers are encrypted at rest and verified via SHA-256 hash.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    {/* PayFast-to-PayFast Account Split */}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="payfast" className="text-sm font-bold text-amber-300 flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          PayFast Account Split (Recommended)
                        </Label>
                        <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                          Instant Split
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed">
                        Enter your PayFast Merchant ID or registered PayFast email. Once clients pay online, your 85% net split is routed directly to your PayFast merchant wallet.
                      </p>
                      <Input
                        id="payfast"
                        placeholder="PayFast Merchant ID (e.g. 10023456) or PayFast Email"
                        value={payfastId}
                        onChange={(e) => setPayfastId(e.target.value)}
                        className="bg-stone-950 border-stone-800 text-white placeholder-stone-600 font-mono text-sm"
                      />
                    </div>

                    {/* Direct EFT Banking Details */}
                    <div className="space-y-4 pt-2">
                      <div className="border-b border-stone-800 pb-2 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <Label className="text-sm font-bold text-white flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-stone-400" />
                            South African Banking Details (Direct EFT Alternative)
                          </Label>
                          <p className="text-xs text-stone-400">
                            Used for scheduled weekly bank transfers if not using PayFast wallet.
                          </p>
                        </div>
                        {barber?.bank_account_hash && (
                          <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded">
                            SHA-256: {barber.bank_account_hash.slice(0, 22)}...
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="bankName" className="text-xs text-stone-300">
                            Bank Name
                          </Label>
                          <Input
                            id="bankName"
                            placeholder="e.g. FNB, Capitec, Standard Bank"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="bg-stone-950 border-stone-800 text-white text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="accType" className="text-xs text-stone-300">
                            Account Type
                          </Label>
                          <select
                            id="accType"
                            value={bankAccType}
                            onChange={(e) => setBankAccType(e.target.value)}
                            className="w-full rounded-md border border-stone-800 bg-stone-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="cheque">Cheque / Current Account</option>
                            <option value="savings">Savings Account</option>
                            <option value="transmission">Transmission Account</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="accNum" className="text-xs text-stone-300">
                            Account Number (Masked / Encrypted)
                          </Label>
                          <Input
                            id="accNum"
                            placeholder="Enter new account number to replace"
                            value={bankAccNum}
                            onChange={(e) => setBankAccNum(e.target.value)}
                            className="bg-stone-950 border-stone-800 text-white text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="branch" className="text-xs text-stone-300">
                            Branch Code
                          </Label>
                          <Input
                            id="branch"
                            placeholder="Branch Code (e.g. 250655)"
                            value={bankBranch}
                            onChange={(e) => setBankBranch(e.target.value)}
                            className="bg-stone-950 border-stone-800 text-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Station Security PIN (Salted Scrypt Hash) */}
                    <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-white flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          Station Security PIN Protection (Salted Scrypt Hash)
                        </Label>
                        <span className="text-[10px] font-mono text-stone-400">
                          {barber?.has_station_pin ? 'PIN Active' : 'No PIN Set'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400">
                        Protect your banking & payout changes on shared studio stations with a hashed personal security PIN.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {barber?.has_station_pin && (
                          <div className="space-y-1">
                            <Label htmlFor="stationPin" className="text-[11px] text-stone-300">
                              Current Station PIN (Required to save changes)
                            </Label>
                            <Input
                              id="stationPin"
                              type="password"
                              placeholder="Enter current PIN"
                              value={stationPin}
                              onChange={(e) => setStationPin(e.target.value)}
                              className="bg-stone-900 border-stone-800 text-white text-xs font-mono"
                            />
                          </div>
                        )}
                        <div className="space-y-1">
                          <Label htmlFor="newStationPin" className="text-[11px] text-stone-300">
                            {barber?.has_station_pin ? 'New Station PIN (Optional)' : 'Set Station Security PIN (4+ digits)'}
                          </Label>
                          <Input
                            id="newStationPin"
                            type="password"
                            placeholder="••••"
                            value={newStationPin}
                            onChange={(e) => setNewStationPin(e.target.value)}
                            className="bg-stone-900 border-stone-800 text-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-800 flex justify-end">
                      <Button
                        type="submit"
                        disabled={savingSettings}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-6 h-10 shadow-lg shadow-amber-500/20"
                      >
                        {savingSettings ? 'Encrypting & Saving...' : 'Save Encrypted Payout Details'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Hardware & Terminal Information */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="bg-stone-900/50 border-stone-800">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    Physical Card Machine (POS)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="rounded-lg bg-stone-950 p-3 border border-stone-800 space-y-1.5">
                    <div className="text-[11px] text-stone-400 font-mono">Assigned Terminal ID:</div>
                    <div className="text-sm font-bold text-white font-mono">
                      {barber?.pos_terminal_id || 'PENDING ASSIGNMENT'}
                    </div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Platform Card Machine Allocation
                    </div>
                  </div>

                  <p className="text-stone-400 leading-relaxed">
                    Physical card machines provided by Dissafyt are provisioned directly to your station at{' '}
                    <strong className="text-stone-300">{barber?.location?.name || 'Dissafyt Studio'}</strong>.
                  </p>

                  <div className="border-t border-stone-800 pt-3 text-[11px] text-stone-500 space-y-1.5">
                    <div>&bull; Supports Apple Pay, Google Wallet & Chip/PIN</div>
                    <div>&bull; Automatic daily settlement into your configured payout account</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-stone-900/50 border-stone-800">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Building className="h-4 w-4 text-amber-500" />
                    Studio Station
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-stone-400">
                  <div>
                    <span className="text-white font-semibold block">{barber?.location?.name || 'Dissafyt Studio'}</span>
                    <span>{barber?.location?.address || '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570'}</span>
                  </div>
                  {barber?.location?.google_maps_url && (
                    <a
                      href={barber.location.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      View on Google Maps &rarr;
                    </a>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
