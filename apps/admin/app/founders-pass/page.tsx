'use client';

import React, { useEffect, useState } from 'react';
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
  Award,
  Crown,
  DollarSign,
  Scissors,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  RefreshCw,
  Search,
  Flame,
  ShieldCheck,
  Mail,
  Phone,
} from 'lucide-react';
import { adminFetch } from '../../lib/operator';

interface CampaignSettings {
  id: string;
  price_per_pass: number;
  total_cuts: number;
  total_spots: number;
  capital_target: number;
  is_active: boolean;
  updated_at: string;
}

interface BuildoutStats {
  totalSpots: number;
  claimedSpots: number;
  totalCapitalTarget: number;
  currentCapital: number;
  pctFunded: number;
  remainingSpots: number;
  pricePerPass?: number;
  totalCuts?: number;
}

interface FounderPass {
  id: string;
  pass_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_cuts: number;
  cuts_used: number;
  amount_paid: number;
  status: string;
  payment_method?: string;
  payment_ref?: string;
  notes?: string;
  created_at: string;
}

export default function AdminFoundersPassPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Campaign Settings
  const [settings, setSettings] = useState<CampaignSettings>({
    id: 'default',
    price_per_pass: 1200,
    total_cuts: 12,
    total_spots: 50,
    capital_target: 60000,
    is_active: true,
    updated_at: '',
  });

  // Editable Form State
  const [pricePerPass, setPricePerPass] = useState('1200');
  const [totalCuts, setTotalCuts] = useState('12');
  const [totalSpots, setTotalSpots] = useState('50');
  const [capitalTarget, setCapitalTarget] = useState('60000');
  const [isActive, setIsActive] = useState(true);

  // Live Stats & Ledger
  const [stats, setStats] = useState<BuildoutStats | null>(null);
  const [passes, setPasses] = useState<FounderPass[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Grant Modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantName, setGrantName] = useState('');
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPhone, setGrantPhone] = useState('');
  const [grantIsPaid, setGrantIsPaid] = useState(true);
  const [grantNotes, setGrantNotes] = useState('');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await adminFetch('/api/founders-pass');
      if (!res.ok) {
        throw new Error('Failed to load campaign parameters');
      }
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        setPricePerPass(String(data.settings.price_per_pass));
        setTotalCuts(String(data.settings.total_cuts));
        setTotalSpots(String(data.settings.total_spots));
        setCapitalTarget(String(data.settings.capital_target));
        setIsActive(Boolean(data.settings.is_active));
      }
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.passes) {
        setPasses(data.passes);
      }
    } catch (err: any) {
      console.error('Failed to load founder pass admin data:', err);
      setMessage({ text: err.message || 'Error loading data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const price = parseFloat(pricePerPass);
    const cuts = parseInt(totalCuts, 10);
    const spots = parseInt(totalSpots, 10);
    const target = parseFloat(capitalTarget);

    if (isNaN(price) || price <= 0) {
      setMessage({ text: 'Please enter a valid price per pass', type: 'error' });
      setSaving(false);
      return;
    }
    if (isNaN(cuts) || cuts <= 0) {
      setMessage({ text: 'Total cuts must be at least 1', type: 'error' });
      setSaving(false);
      return;
    }
    if (isNaN(spots) || spots <= 0) {
      setMessage({ text: 'Total spots must be at least 1', type: 'error' });
      setSaving(false);
      return;
    }

    try {
      const res = await adminFetch('/api/founders-pass', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_per_pass: price,
          total_cuts: cuts,
          total_spots: spots,
          capital_target: isNaN(target) ? price * spots : target,
          is_active: isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setSettings(data.settings);
      if (data.stats) setStats(data.stats);
      setMessage({ text: 'Campaign parameters updated successfully!', type: 'success' });
    } catch (err: any) {
      console.error('Save error:', err);
      setMessage({ text: err.message || 'Failed to update campaign parameters', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleManualGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!grantName.trim() || !grantEmail.trim() || !grantPhone.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    setGranting(true);
    try {
      const res = await adminFetch('/api/founders-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: grantName.trim(),
          email: grantEmail.trim(),
          phone: grantPhone.trim(),
          isPaid: grantIsPaid,
          notes: grantNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to grant pass');
      }

      setGrantModalOpen(false);
      setGrantName('');
      setGrantEmail('');
      setGrantPhone('');
      setGrantNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error granting pass');
    } finally {
      setGranting(false);
    }
  }

  // Filtered passes
  const filteredPasses = passes.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.customer_name?.toLowerCase().includes(q) ||
      p.customer_email?.toLowerCase().includes(q) ||
      p.customer_phone?.toLowerCase().includes(q) ||
      p.pass_number?.toLowerCase().includes(q)
    );
  });

  const parsedPrice = parseFloat(pricePerPass) || 0;
  const parsedCuts = parseInt(totalCuts, 10) || 1;
  const parsedSpots = parseInt(totalSpots, 10) || 1;
  const costPerCut = parsedCuts > 0 ? (parsedPrice / parsedCuts).toFixed(2) : '0.00';
  const calculatedMaxCapital = parsedPrice * parsedSpots;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-500 uppercase tracking-widest font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Barbershop Buildout // 1 Norwalk Way</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white uppercase mt-1">
            Founder&apos;s Pass Campaign Controls
          </h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Manage campaign parameters (cuts, pricing, spots, capital goals) and monitor founding patrons.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-stone-800 text-stone-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setGrantModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Manual Grant Pass
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center space-x-3 text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
              : 'bg-red-950/40 border-red-500/50 text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-stone-900/60 border-stone-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-stone-400 text-xs font-mono">
              <span>Backer Allocation</span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {stats?.claimedSpots ?? 0}{' '}
              <span className="text-sm font-normal text-stone-400">/ {stats?.totalSpots ?? 50} spots</span>
            </div>
            <div className="text-xs text-amber-400/90 font-mono mt-1">
              {stats?.remainingSpots ?? 0} spots remaining
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/60 border-stone-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-stone-400 text-xs font-mono">
              <span>Capital Target Pool</span>
              <Building className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              R {(stats?.currentCapital ?? 0).toLocaleString('en-ZA')}{' '}
              <span className="text-sm font-normal text-stone-400">
                / R {(stats?.totalCapitalTarget ?? 60000).toLocaleString('en-ZA')}
              </span>
            </div>
            <div className="text-xs text-emerald-400 font-mono mt-1">
              {stats?.pctFunded ?? 0}% buildout goal backed
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/60 border-stone-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-stone-400 text-xs font-mono">
              <span>Pass Retail Price</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              R {Number(settings.price_per_pass).toFixed(2)}
            </div>
            <div className="text-xs text-stone-400 font-mono mt-1">
              R {(Number(settings.price_per_pass) / Number(settings.total_cuts || 1)).toFixed(2)} / cut
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/60 border-stone-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-stone-400 text-xs font-mono">
              <span>Annual Entitlement</span>
              <Scissors className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {settings.total_cuts} Master Cuts
            </div>
            <div className="text-xs text-stone-400 font-mono mt-1">
              365-day validity from activation
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Parameter Controls Form */}
      <Card className="bg-stone-900/40 border-stone-800 shadow-xl">
        <CardHeader className="border-b border-stone-800/80 pb-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">
              Campaign Parameters & Financial Settings
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-stone-400">
            Changes saved here immediately update the customer landing page, dedicated Founder&apos;s Pass page, and PayFast payment checkout amounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Price Per Pass */}
              <div className="space-y-2">
                <Label htmlFor="pricePerPass" className="text-xs font-mono uppercase text-stone-300">
                  Price Per Pass (ZAR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-500 font-mono text-sm">R</span>
                  <Input
                    id="pricePerPass"
                    type="number"
                    step="10"
                    min="100"
                    value={pricePerPass}
                    onChange={(e) => setPricePerPass(e.target.value)}
                    className="pl-8 bg-stone-950 border-stone-800 text-white font-mono"
                    placeholder="1200"
                    required
                  />
                </div>
                <p className="text-[11px] text-stone-500">
                  Customer pays this upfront.
                </p>
              </div>

              {/* Number of Cuts */}
              <div className="space-y-2">
                <Label htmlFor="totalCuts" className="text-xs font-mono uppercase text-stone-300">
                  Number of Cuts
                </Label>
                <Input
                  id="totalCuts"
                  type="number"
                  min="1"
                  max="52"
                  value={totalCuts}
                  onChange={(e) => setTotalCuts(e.target.value)}
                  className="bg-stone-950 border-stone-800 text-white font-mono"
                  placeholder="12"
                  required
                />
                <p className="text-[11px] text-stone-500">
                  Credited to customer punch-card balance.
                </p>
              </div>

              {/* Total Spots / Allocation */}
              <div className="space-y-2">
                <Label htmlFor="totalSpots" className="text-xs font-mono uppercase text-stone-300">
                  Total Spots Available
                </Label>
                <Input
                  id="totalSpots"
                  type="number"
                  min="1"
                  max="1000"
                  value={totalSpots}
                  onChange={(e) => setTotalSpots(e.target.value)}
                  className="bg-stone-950 border-stone-800 text-white font-mono"
                  placeholder="50"
                  required
                />
                <p className="text-[11px] text-stone-500">
                  Hard allocation cap for exclusivity.
                </p>
              </div>

              {/* Total Capital Target */}
              <div className="space-y-2">
                <Label htmlFor="capitalTarget" className="text-xs font-mono uppercase text-stone-300">
                  Buildout Target (ZAR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-500 font-mono text-sm">R</span>
                  <Input
                    id="capitalTarget"
                    type="number"
                    step="1000"
                    min="1000"
                    value={capitalTarget}
                    onChange={(e) => setCapitalTarget(e.target.value)}
                    className="pl-8 bg-stone-950 border-stone-800 text-white font-mono"
                    placeholder="60000"
                    required
                  />
                </div>
                <p className="text-[11px] text-stone-500">
                  Total capital target for progress tracking.
                </p>
              </div>
            </div>

            {/* Live Pricing Breakdown Preview */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="text-stone-500">Effective Per Cut:</span>{' '}
                  <strong className="text-amber-400">R {costPerCut}</strong>
                </div>
                <div className="hidden sm:block text-stone-700">|</div>
                <div>
                  <span className="text-stone-500">Max Gross Capital:</span>{' '}
                  <strong className="text-white">R {calculatedMaxCapital.toLocaleString('en-ZA')}</strong>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-stone-700 text-amber-500 focus:ring-amber-500 bg-stone-900"
                  />
                  <span>Campaign Active on Storefront</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-6"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving Changes...' : 'Save Campaign Parameters'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Passes Backer Ledger */}
      <Card className="bg-stone-900/40 border-stone-800">
        <CardHeader className="border-b border-stone-800/80 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">
                Founding Patrons Ledger
              </CardTitle>
              <CardDescription className="text-xs text-stone-400">
                All issued Founder Passes, punch-card redemption balances, and payment states.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-500" />
              <Input
                placeholder="Search patron, email, pass..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-stone-950 border-stone-800 text-xs text-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-stone-950/80 text-stone-400 border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4 font-bold uppercase">Pass Code</th>
                  <th className="py-3 px-4 font-bold uppercase">Patron Details</th>
                  <th className="py-3 px-4 font-bold uppercase">Punch Card (Cuts)</th>
                  <th className="py-3 px-4 font-bold uppercase">Paid / Method</th>
                  <th className="py-3 px-4 font-bold uppercase">Status</th>
                  <th className="py-3 px-4 font-bold uppercase">Issued Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 text-stone-300">
                {filteredPasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500">
                      {loading ? 'Loading ledger...' : 'No founder passes found matching search query.'}
                    </td>
                  </tr>
                ) : (
                  filteredPasses.map((pass) => {
                    const cutsUsed = pass.cuts_used || 0;
                    const totalCuts = pass.total_cuts || 12;
                    const cutsRemaining = Math.max(0, totalCuts - cutsUsed);

                    return (
                      <tr key={pass.id} className="hover:bg-stone-800/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-amber-400 whitespace-nowrap">
                          {pass.pass_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-sans font-bold text-white text-sm">{pass.customer_name}</div>
                          <div className="text-stone-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-stone-500" />
                              {pass.customer_email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-500" />
                              {pass.customer_phone}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="font-bold text-white">
                              {cutsRemaining} / {totalCuts} left
                            </div>
                            <span className="text-[10px] text-stone-500">({cutsUsed} used)</span>
                          </div>
                          <div className="w-24 h-1.5 bg-stone-800 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, (cutsUsed / totalCuts) * 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-white">
                            R {Number(pass.amount_paid).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-stone-500 uppercase">
                            {pass.payment_method || 'payfast'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                              pass.status === 'active'
                                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                                : pass.status === 'pending_payment'
                                ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                                : 'bg-stone-800 border-stone-700 text-stone-400'
                            }`}
                          >
                            {pass.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-400 whitespace-nowrap">
                          {pass.created_at ? new Date(pass.created_at).toLocaleDateString('en-ZA') : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Manual Grant Modal */}
      {grantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-display font-bold text-white uppercase text-base flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Issue Manual Founder Pass
              </h3>
              <button
                type="button"
                onClick={() => setGrantModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualGrant} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="grantName" className="text-xs text-stone-300">
                  Full Name
                </Label>
                <Input
                  id="grantName"
                  value={grantName}
                  onChange={(e) => setGrantName(e.target.value)}
                  placeholder="e.g. Chad Peterson"
                  className="bg-stone-950 border-stone-800 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="grantEmail" className="text-xs text-stone-300">
                  Email Address
                </Label>
                <Input
                  id="grantEmail"
                  type="email"
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="patron@dissafyt.com"
                  className="bg-stone-950 border-stone-800 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="grantPhone" className="text-xs text-stone-300">
                  WhatsApp / Phone Number
                </Label>
                <Input
                  id="grantPhone"
                  value={grantPhone}
                  onChange={(e) => setGrantPhone(e.target.value)}
                  placeholder="+27 82 123 4567"
                  className="bg-stone-950 border-stone-800 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="grantNotes" className="text-xs text-stone-300">
                  Admin Notes (Optional)
                </Label>
                <Input
                  id="grantNotes"
                  value={grantNotes}
                  onChange={(e) => setGrantNotes(e.target.value)}
                  placeholder="e.g. VIP partner, paid cash at studio"
                  className="bg-stone-950 border-stone-800 text-white"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={grantIsPaid}
                    onChange={(e) => setGrantIsPaid(e.target.checked)}
                    className="rounded border-stone-700 text-amber-500 focus:ring-amber-500 bg-stone-900"
                  />
                  <span>Mark as Paid & Activate immediately ({settings.total_cuts} cuts)</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-stone-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGrantModalOpen(false)}
                  className="border-stone-800 text-stone-400"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={granting}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
                >
                  {granting ? 'Issuing...' : 'Issue Founder Pass'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
