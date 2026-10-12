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
  working_days?: string[];
  work_start_hour?: number;
  work_end_hour?: number;
  blocked_dates?: string[];
}

const SPECIALTY_LABELS: Record<string, string> = {
  barber: 'Barber',
  nail_tech: 'Nail Technician',
  beautician: 'Beautician',
};

const ALL_WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface DashboardSummary {
  totalBookings: number;
  grossRevenue: number;
  platformSplitPct: number;
  platformFees: number;
  netBarberPayout: number;
  settledPayouts: number;
  pendingChairCash: number;
  onlineGrossRevenue?: number;
  onlineSpecialistShare?: number;
  chairCashRevenue?: number;
  chairPlatformFeeOwed?: number;
  netEftSettlement?: number;
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

  // Schedule & Off-Days state
  const [workingDays, setWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [workStartHour, setWorkStartHour] = useState<number>(9);
  const [workEndHour, setWorkEndHour] = useState<number>(18);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState<string>('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const [activeTab, setActiveTab] = useState<'appointments' | 'schedule' | 'payouts'>('appointments');

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
        setWorkingDays(
          Array.isArray(data.barber.working_days) && data.barber.working_days.length > 0
            ? data.barber.working_days
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        );
        setWorkStartHour(typeof data.barber.work_start_hour === 'number' ? data.barber.work_start_hour : 9);
        setWorkEndHour(typeof data.barber.work_end_hour === 'number' ? data.barber.work_end_hour : 18);
        setBlockedDates(Array.isArray(data.barber.blocked_dates) ? data.barber.blocked_dates : []);
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

  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!barber) return;
    setSavingSchedule(true);
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
          working_days: workingDays,
          work_start_hour: workStartHour,
          work_end_hour: workEndHour,
          blocked_dates: blockedDates,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update schedule');

      setStatusMsg({
        type: 'success',
        text: 'Station shift hours, working days, and blocked off-dates updated.',
      });
      loadDashboard();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error saving schedule' });
    } finally {
      setSavingSchedule(false);
    }
  }

  function toggleWorkDay(day: string) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function addBlockedDate() {
    if (!newBlockedDate) return;
    if (!blockedDates.includes(newBlockedDate)) {
      setBlockedDates((prev) => [...prev, newBlockedDate].sort());
    }
    setNewBlockedDate('');
  }

  function removeBlockedDate(dateStr: string) {
    setBlockedDates((prev) => prev.filter((d) => d !== dateStr));
  }

  const specialtyLabel = SPECIALTY_LABELS[barber?.specialty || 'barber'] || 'Specialist';
  const netEft = summary?.netEftSettlement ?? 0;

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

        {/* Financial & True Cash vs Online Settlement Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-stone-900/50 border-stone-800 backdrop-blur-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-xs uppercase tracking-wider font-medium">
                <span>Online Share (85% Held)</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                + R {(summary?.onlineSpecialistShare ?? summary?.settledPayouts ?? 0).toFixed(2)}
              </div>
              <p className="text-[11px] text-stone-500">
                85% of R {(summary?.onlineGrossRevenue ?? 0).toFixed(2)} collected online & memberships
              </p>
            </CardContent>
          </Card>

          <Card className="bg-stone-900/50 border-stone-800 backdrop-blur-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-xs uppercase tracking-wider font-medium">
                <span>In-Chair 15% Fee Owed</span>
                <Percent className="h-4 w-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400">
                - R {(summary?.chairPlatformFeeOwed ?? 0).toFixed(2)}
              </div>
              <p className="text-[11px] text-stone-500">
                15% studio fee on R {(summary?.chairCashRevenue ?? 0).toFixed(2)} paid in chair
              </p>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/10 border-amber-500/30 backdrop-blur-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-amber-400 text-xs uppercase tracking-wider font-bold">
                <span>Net Weekly EFT Settlement</span>
                <DollarSign className="h-4 w-4 text-amber-400" />
              </div>
              <div className={`text-2xl font-bold font-mono ${netEft >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                {netEft >= 0 ? `R ${netEft.toFixed(2)}` : `- R ${Math.abs(netEft).toFixed(2)}`}
              </div>
              <p className="text-[11px] text-amber-400/80">
                {netEft >= 0
                  ? 'Online 85% Share minus In-Chair 15% Platform Fee'
                  : 'Net studio fee balance due from in-chair cash'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-stone-900/50 border-stone-800 backdrop-blur-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-stone-400 text-xs uppercase tracking-wider font-medium">
                <span>Total Take-Home (85%)</span>
                <Smartphone className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                R {summary?.netBarberPayout.toFixed(2) || '0.00'}
              </div>
              <p className="text-[11px] text-stone-500">
                Combined net earnings across {summary?.totalBookings || 0} sessions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-800 pb-2">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'appointments'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Client Sessions & Settlement Ledger ({cashflow.length})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10'
                : 'text-stone-400 hover:text-white hover:bg-stone-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Shift Hours & Off-Days
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
            PayFast & Banking Vault
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
                    (Direct 85% Split + Anti-Poaching Privacy Masking)
                  </span>
                </h2>
                <p className="text-xs text-stone-400">
                  Client phone numbers and emails are masked for POPIA privacy compliance.
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
                      <th className="py-3 px-4 font-semibold text-right text-amber-400">Specialist Net (85%)</th>
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
                                Member Covered (+85% EFT)
                              </span>
                            ) : item.paymentStatus === 'paid_online' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Paid Online (+85% EFT)
                              </span>
                            ) : item.paymentStatus === 'paid_in_chair' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                Paid in Chair (-15% Fee)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700">
                                Pay in Chair (-15% Fee)
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

        {/* Tab 2: Shift Hours & Blocked Off-Days */}
        {activeTab === 'schedule' && (
          <Card className="bg-stone-900/50 border-stone-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Station Shift Hours & Blocked Off-Days
              </CardTitle>
              <p className="text-xs text-stone-400">
                Customize your active working days, daily shift hours, and block off specific dates for sick leave or personal days without deactivating your profile.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSchedule} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Active Working Days
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_WEEK_DAYS.map((day) => {
                      const active = workingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleWorkDay(day)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            active
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-stone-950 border-stone-800 text-stone-500 hover:text-stone-300'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-stone-300">Shift Start Hour (SAST)</Label>
                    <select
                      value={workStartHour}
                      onChange={(e) => setWorkStartHour(Number(e.target.value))}
                      className="w-full rounded-md border border-stone-800 bg-stone-950 px-3 py-2 text-xs text-white font-mono"
                    >
                      {[7, 8, 9, 10, 11, 12, 13, 14].map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-stone-300">Shift End Hour (SAST)</Label>
                    <select
                      value={workEndHour}
                      onChange={(e) => setWorkEndHour(Number(e.target.value))}
                      className="w-full rounded-md border border-stone-800 bg-stone-950 px-3 py-2 text-xs text-white font-mono"
                    >
                      {[13, 14, 15, 16, 17, 18, 19, 20, 21].map((h) => (
                        <option key={h} value={h}>
                          {String(h).padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-stone-800">
                  <Label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                    Blocked Off-Dates (Sick Leave / Time Off)
                  </Label>
                  <div className="flex flex-wrap items-center gap-2 max-w-md">
                    <Input
                      type="date"
                      value={newBlockedDate}
                      onChange={(e) => setNewBlockedDate(e.target.value)}
                      className="bg-stone-950 border-stone-800 text-white text-xs font-mono w-48"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addBlockedDate}
                      className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs"
                    >
                      + Block Date
                    </Button>
                  </div>
                  {blockedDates.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {blockedDates.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-xs font-mono text-rose-300"
                        >
                          {d}
                          <button
                            type="button"
                            onClick={() => removeBlockedDate(d)}
                            className="text-rose-400 hover:text-white font-bold"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-500">No blocked off-dates configured.</p>
                  )}
                </div>

                <div className="pt-4 border-t border-stone-800 flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingSchedule}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-6 h-10"
                  >
                    {savingSchedule ? 'Saving Schedule...' : 'Save Station Schedule'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
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
