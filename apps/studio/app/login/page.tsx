'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Factory, 
  Sparkles, 
  Shield, 
  Lock, 
  ArrowRight, 
  Printer, 
  Shirt, 
  TrendingUp, 
  Check, 
  AlertCircle,
  Truck
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { PRESET_PERSONAS, StudioPersona, loginStudioPersona } from '../../lib/persona';

function StudioLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [activeTab, setActiveTab] = useState<'preset' | 'email'>('preset');
  const [targetWorkstation, setTargetWorkstation] = useState<'creator' | 'factory'>('creator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fast Persona Quick Login
  const handleQuickLogin = (persona: StudioPersona, forceWorkstation?: 'creator' | 'factory') => {
    loginStudioPersona(persona);
    
    if (redirectUrl) {
      router.push(redirectUrl);
      return;
    }

    if (forceWorkstation) {
      router.push(forceWorkstation === 'creator' ? '/creator' : '/');
      return;
    }

    if (persona.role === 'creator') {
      router.push('/creator');
    } else if (persona.role === 'staff') {
      router.push('/');
    } else {
      // Admin defaults to creator workstation
      router.push('/creator');
    }
  };

  // Quick fill demo account credentials
  const fillCredentials = (accEmail: string, accPass: string, ws: 'creator' | 'factory') => {
    setActiveTab('email');
    setEmail(accEmail);
    setPassword(accPass);
    setTargetWorkstation(ws);
    setErrorMsg(null);
  };

  // Supabase Email / Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        // Determine role based on email or profile
        const userEmail = data.session.user.email?.toLowerCase() || '';
        let role: 'staff' | 'creator' | 'admin' = 'creator';
        let brandId = 'b0000000-0000-0000-0000-000000000001';
        let brandName = 'Skhanda Heritage Co. / Dissafyt';

        if (userEmail.includes('admin') || userEmail === 'dissafyt@gmail.com') {
          role = 'admin';
          brandName = 'Platform Owner (Full Access)';
        } else if (userEmail.includes('operator') || userEmail.includes('staff') || userEmail.includes('factory')) {
          role = 'staff';
          brandName = 'Factory Floor Operator';
        } else if (userEmail.includes('vibecult')) {
          brandId = 'b0000000-0000-0000-0000-000000000002';
          brandName = 'Vibe Cult Cape Town';
        }

        const persona: StudioPersona = {
          email: userEmail,
          role,
          brandId: (role === 'creator' || role === 'admin') ? brandId : undefined,
          brandName,
        };

        loginStudioPersona(persona);

        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (role === 'creator') {
          router.push('/creator');
        } else if (role === 'staff') {
          router.push('/');
        } else {
          // Admin / Owner honors chosen workstation target
          router.push(targetWorkstation === 'creator' ? '/creator' : '/');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-black font-black text-2xl shadow-xl shadow-amber-500/20 mb-2">
            S
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
            DISSAFYT <span className="text-amber-400">STUDIO</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono tracking-wide">
            Kasi Kollekt Factory OS • Creator Design Platform • Dispatch Desk
          </p>
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-[11px] font-medium text-zinc-400">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Authorized Access Only • studio.dissafyt.com</span>
          </div>
        </div>

        {/* Auth Mode Tabs */}
        <div className="bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-2xl flex space-x-1 shadow-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
              activeTab === 'preset'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Role Sign-In Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
              activeTab === 'email'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Supabase Email & Password</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: Role Quick Sign-In Presets */}
        {activeTab === 'preset' && (
          <div className="space-y-3">
            <p className="text-[11px] text-zinc-400 uppercase font-mono tracking-wider px-1">
              One-click access to studio workstations:
            </p>

            {/* Streetwear Creator: Skhanda / Dissafyt */}
            <div
              onClick={() => handleQuickLogin(PRESET_PERSONAS[0], 'creator')}
              className="group cursor-pointer p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-amber-500/50 transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-amber-500/5"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Shirt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">Streetwear Creator Studio</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase">
                      Creator
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Garment lab, 2D mockup designer, drop publishing, sales & payouts.
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono">creator@dissafyt.com</span>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
                <span>Enter Lab</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Operator (Factory Floor Employee) */}
            <div
              onClick={() => handleQuickLogin(PRESET_PERSONAS[1], 'factory')}
              className="group cursor-pointer p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-cyan-500/50 transition-all duration-200 flex items-center justify-between shadow-sm hover:shadow-cyan-500/5"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">Factory Floor Operator</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                      Staff
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Live heat press queue, DTF batches, fold & tag, courier dispatch desk.
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono">operator@dissafyt.com</span>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-400">
                <span>Enter Floor</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Platform Owner - Dual Access Choices */}
            <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-3">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">Platform Owner / Administrator</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold uppercase">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    dissafyt@gmail.com • Full dual-access to Creator Lab and Factory Operations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60">
                <button
                  type="button"
                  onClick={() => handleQuickLogin(PRESET_PERSONAS[2], 'creator')}
                  className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span>Enter as Creator</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin(PRESET_PERSONAS[2], 'factory')}
                  className="py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                >
                  <Factory className="w-3.5 h-3.5" />
                  <span>Enter Factory Floor</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Supabase Email & Password Form */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailLogin} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-4 shadow-xl">
            {/* Quick Demo Credentials Autofill */}
            <div className="space-y-1.5 pb-2 border-b border-zinc-800/80">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                Quick-Fill Active Demo Credentials:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('creator@dissafyt.com', 'Creator2026!', 'creator')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center space-x-1 transition"
                >
                  <Shirt className="w-3 h-3" />
                  <span>🎨 creator@dissafyt.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('operator@dissafyt.com', 'Operator2026!', 'factory')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono flex items-center space-x-1 transition"
                >
                  <Factory className="w-3 h-3" />
                  <span>🏭 operator@dissafyt.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('dissafyt@gmail.com', 'Wat07081', 'creator')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-mono flex items-center space-x-1 transition"
                >
                  <Shield className="w-3 h-3" />
                  <span>👑 dissafyt@gmail.com</span>
                </button>
              </div>
            </div>

            {/* Workstation Target Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 uppercase tracking-wider block">
                Target Workstation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetWorkstation('creator')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition ${
                    targetWorkstation === 'creator'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span>🎨 Creator Studio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetWorkstation('factory')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition ${
                    targetWorkstation === 'factory'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Factory className="w-3.5 h-3.5" />
                  <span>🏭 Factory Floor</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 uppercase tracking-wider block">
                Studio Email Address
              </label>
              <input
                type="email"
                placeholder="creator@brand.com or operator@dissafyt.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-300 uppercase tracking-wider block">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Authenticating with Supabase...</span>
              ) : (
                <>
                  <span>
                    Sign In to {targetWorkstation === 'creator' ? 'Creator Studio' : 'Factory Floor'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* RBAC Security Notice */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 text-[11px] text-zinc-500 space-y-1">
          <p className="font-semibold text-zinc-400">Strict Role Governance Applied:</p>
          <p>• Factory employees only have access to production queue and dispatch manifest.</p>
          <p>• Streetwear creators have isolated access to their brand design lab, cashflow analytics, and payout banking.</p>
        </div>
      </div>
    </div>
  );
}

export default function StudioLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-xs text-zinc-500">
          Loading Dissafyt Studio Workstation Gate...
        </div>
      }
    >
      <StudioLoginContent />
    </Suspense>
  );
}
