'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  DollarSign, 
  Building, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw,
  FileText,
  ShieldCheck,
  TrendingUp,
  X
} from 'lucide-react';
import { getActivePersona } from '../../../lib/persona';

interface BankingDetails {
  bank_name: string;
  account_holder: string;
  account_number: string;
  branch_code: string;
  account_type: string;
}

interface PayoutRecord {
  id: string;
  amount: number;
  status: 'paid' | 'processing' | 'pending';
  reference: string;
  created_at: string;
  processed_at?: string;
}

const SA_BANKS = [
  { name: 'First National Bank (FNB)', code: '250655' },
  { name: 'Capitec Bank', code: '470010' },
  { name: 'Standard Bank', code: '051001' },
  { name: 'Nedbank', code: '198765' },
  { name: 'Absa Bank', code: '632005' },
  { name: 'TymeBank', code: '678910' },
];

export default function CreatorPayoutsPage() {
  const [banking, setBanking] = useState<BankingDetails>({
    bank_name: 'First National Bank (FNB)',
    account_holder: 'Skhanda Heritage Enterprise',
    account_number: '••••••••4892',
    branch_code: '250655',
    account_type: 'cheque',
  });
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestAmount, setRequestAmount] = useState<number>(1500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEditingBank, setIsEditingBank] = useState(false);

  const availableBalance = 2030; // Cleared royalties ready for EFT

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      const persona = getActivePersona();
      const brandParam = persona.brandId ? `?brandId=${persona.brandId}` : '';
      const res = await fetch(`/api/creator/payouts${brandParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.banking) setBanking(data.banking);
        if (data.payouts) setPayouts(data.payouts);
      }
    } catch (err) {
      console.error('Failed to load payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutData();

    const handlePersonaChange = () => {
      fetchPayoutData();
    };
    window.addEventListener('studio_persona_changed', handlePersonaChange);
    return () => window.removeEventListener('studio_persona_changed', handlePersonaChange);
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestAmount < 500) {
      setErrorMsg('Minimum EFT payout request is R500.00');
      return;
    }
    if (requestAmount > availableBalance) {
      setErrorMsg(`Amount cannot exceed your available balance of R${availableBalance}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const persona = getActivePersona();

      const res = await fetch('/api/creator/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: persona.brandId || 'b0000000-0000-0000-0000-000000000001',
          amount: requestAmount,
          banking,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRequestSuccess(`Payout request for R${requestAmount.toLocaleString()} submitted successfully! Ref: ${data.payoutId}`);
        setPayouts((prev) => [
          {
            id: data.payoutId || `pay-${Date.now()}`,
            amount: requestAmount,
            status: 'pending',
            reference: `EFT-REQ-${Date.now().toString().slice(-6)}`,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setTimeout(() => setRequestSuccess(null), 5000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to request payout');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-purple-400 text-xs font-mono uppercase tracking-widest mb-1">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Dissafyt Payouts Desk • Banking & EFT Remittance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Creator Earnings & South African Payouts
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Direct EFT settlements into your South African bank account. Royalties are held for 7 days post-delivery 
            before moving to your cleared available balance.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPayoutData}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/creator/sales"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sales Analytics</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Payout Action & Banking Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Available Balance & Payout Request */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <span className="text-xs font-mono uppercase text-zinc-500 block">Cleared Available Balance</span>
            <div className="text-3xl font-black text-purple-400">
              R{availableBalance.toLocaleString()}.00
            </div>
            <p className="text-xs text-zinc-400">
              Funds cleared through customer delivery verification. Minimum payout threshold is R500.00.
            </p>

            {requestSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-300 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{requestSuccess}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-xs text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="pt-2 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400 uppercase">Payout Request Amount (ZAR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500 font-bold text-xs">R</span>
                  <input
                    type="number"
                    min={500}
                    max={availableBalance}
                    step={100}
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || availableBalance < 500}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs tracking-wide transition shadow-lg shadow-purple-600/20 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <DollarSign className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Request...' : 'Initiate EFT Payout'}</span>
              </button>
            </form>
          </div>

          {/* South African Banking Details Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                <Building className="w-4 h-4 text-amber-400" />
                <span>South African Bank Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingBank(!isEditingBank)}
                className="text-xs text-amber-400 hover:underline"
              >
                {isEditingBank ? 'Cancel' : 'Edit Details'}
              </button>
            </div>

            {isEditingBank ? (
              <div className="space-y-3 pt-2 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-zinc-400">Bank</label>
                  <select
                    value={banking.bank_name}
                    onChange={(e) => {
                      const selected = SA_BANKS.find((b) => b.name === e.target.value);
                      setBanking({
                        ...banking,
                        bank_name: e.target.value,
                        branch_code: selected ? selected.code : banking.branch_code,
                      });
                    }}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                  >
                    {SA_BANKS.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-zinc-400">Account Holder Name</label>
                  <input
                    type="text"
                    value={banking.account_holder}
                    onChange={(e) => setBanking({ ...banking, account_holder: e.target.value })}
                    className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-400">Account Number</label>
                    <input
                      type="text"
                      value={banking.account_number}
                      onChange={(e) => setBanking({ ...banking, account_number: e.target.value })}
                      className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-400">Branch Code</label>
                    <input
                      type="text"
                      value={banking.branch_code}
                      onChange={(e) => setBanking({ ...banking, branch_code: e.target.value })}
                      className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingBank(false)}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition"
                >
                  Save Banking Details
                </button>
              </div>
            ) : (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Bank Name</span>
                  <span className="text-zinc-200 font-semibold">{banking.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Account Holder</span>
                  <span className="text-zinc-200 font-semibold">{banking.account_holder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Account Number</span>
                  <span className="font-mono text-zinc-200">{banking.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Branch Code</span>
                  <span className="font-mono text-zinc-400">{banking.branch_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Account Type</span>
                  <span className="text-zinc-300 uppercase">{banking.account_type}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Historical Payout Ledger (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white tracking-tight mb-4 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Historical Payout Ledger</span>
            </h3>

            {payouts.length === 0 ? (
              <p className="text-xs text-zinc-500 py-8 text-center">No payout history recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {payouts.map((pay) => (
                  <div
                    key={pay.id}
                    className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white text-sm">
                          R{pay.amount.toLocaleString()}.00
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            pay.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : pay.status === 'processing'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {pay.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-1">
                        Ref: {pay.reference} • {new Date(pay.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-zinc-400">
                      <span>EFT Direct to {banking.bank_name.split(' ')[0]}</span>
                      {pay.processed_at && (
                        <div className="text-emerald-500 text-[10px]">
                          Cleared {new Date(pay.processed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
