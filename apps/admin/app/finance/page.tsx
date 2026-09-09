'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@dissafyt/ui';
import { DollarSign, ShieldCheck, ArrowUpRight, Search, RefreshCw, CreditCard, ShoppingBag, Scissors } from 'lucide-react';
import Link from 'next/link';

interface PaymentAuditRecord {
  id: string;
  user_id: string;
  provider: string;
  provider_reference?: string | null;
  amount: number;
  currency: string;
  status: string;
  related_type: string;
  related_id: string;
  created_at: string;
  customer_name?: string | null;
  customer_email?: string | null;
}

export default function FinancePage() {
  const [records, setRecords] = useState<PaymentAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (e) {
      console.error('Failed to load payment logs:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  const liveRecords = records.filter((r) => (r as any).is_test !== true);

  const filtered = liveRecords.filter((r) => {
    const matchesSearch =
      (r.provider_reference && r.provider_reference.toLowerCase().includes(search.toLowerCase())) ||
      (r.customer_email && r.customer_email.toLowerCase().includes(search.toLowerCase())) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      r.id.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'all' || r.related_type === filterType;
    return matchesSearch && matchesType;
  });

  const totalAudited = liveRecords
    .filter((r) => r.status === 'paid' || r.status === 'completed')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const subscriptionTotal = liveRecords
    .filter((r) => (r.status === 'paid' || r.status === 'completed') && r.related_type === 'subscription')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const orderTotal = liveRecords
    .filter((r) => (r.status === 'paid' || r.status === 'completed') && r.related_type === 'order')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const bookingTotal = liveRecords
    .filter((r) => (r.status === 'paid' || r.status === 'completed') && r.related_type === 'booking')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Finance & Payment Audit</h1>
          <p className="text-sm text-stone-400">
            Immutable transaction records and PayFast settlement logs across commerce and barbershop operations.
          </p>
        </div>
        <Button
          onClick={fetchPayments}
          disabled={loading}
          variant="outline"
          className="border-stone-800 text-stone-300 hover:bg-stone-800 self-start sm:self-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-stone-800 bg-stone-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">Audited Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              R {totalAudited.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-stone-400 mt-2 flex items-center justify-between border-t border-stone-800/80 pt-2">
              <span>Subs: R {subscriptionTotal.toFixed(0)}</span>
              <span>&bull;</span>
              <span>Orders: R {orderTotal.toFixed(0)}</span>
              <span>&bull;</span>
              <span>Walk-in: R {bookingTotal.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-800 bg-stone-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{liveRecords.length}</div>
            <p className="text-xs text-stone-500 mt-1">Verified settled transactions</p>
          </CardContent>
        </Card>

        <Card className="border-stone-800 bg-stone-900/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-300">Active Gateway</CardTitle>
            <ShieldCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">PayFast</div>
            <p className="text-xs text-emerald-400 mt-1 font-mono">Merchant 17675995 (Live)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by PayFast ref, customer email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-md text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'order', 'booking', 'subscription'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                filterType === t
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Records Table */}
      <Card className="border-stone-800 bg-stone-900/40">
        <CardHeader>
          <CardTitle className="text-lg text-white">Payment Audit Log</CardTitle>
          <CardDescription>
            Real-time audit log of all gateway events received by the Dissafyt Platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-stone-500">Loading audit records...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-stone-500 space-y-2">
              <p>No payment records matching your filter criteria.</p>
              <p className="text-xs text-stone-600">
                Incoming PayFast ITN webhooks will automatically append immutable entries here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-300">
                <thead className="border-b border-stone-800 text-xs uppercase text-stone-500 bg-stone-900/50">
                  <tr>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Provider Ref</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono text-xs">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-800/30 transition-colors">
                      <td className="py-3 px-4 text-stone-400 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString('en-ZA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-sans text-xs">
                          {item.related_type === 'order' ? (
                            <span className="inline-flex items-center text-amber-400">
                              <ShoppingBag className="h-3 w-3 mr-1" />
                              Order
                            </span>
                          ) : item.related_type === 'booking' ? (
                            <span className="inline-flex items-center text-blue-400">
                              <Scissors className="h-3 w-3 mr-1" />
                              Barbershop
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-purple-400">
                              <CreditCard className="h-3 w-3 mr-1" />
                              Membership
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="text-stone-200 font-medium">{item.customer_name || 'Customer'}</div>
                        <div className="text-stone-500 text-xs">{item.customer_email || '—'}</div>
                      </td>
                      <td className="py-3 px-4 text-stone-300">
                        {item.provider_reference ? (
                          <span className="bg-stone-800 px-2 py-0.5 rounded text-amber-400">
                            {item.provider_reference}
                          </span>
                        ) : (
                          <span className="text-stone-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-white font-sans whitespace-nowrap">
                        R {Number(item.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-sans font-semibold uppercase ${
                            item.status === 'paid' || item.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : item.status === 'pending'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
