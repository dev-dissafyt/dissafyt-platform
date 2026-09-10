'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Scissors, Lock, ArrowRight, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { getSupabaseBrowserClient } from '@dissafyt/database';

function PosLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('curtislee@dissafyt.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.session) {
        throw new Error(error?.message || 'Invalid operator credentials');
      }

      const token = data.session.access_token;
      const userId = data.session.user.id;
      const userEmail = data.session.user.email || email;

      // Verify administrator or staff role in public.user_roles
      const { data: roleRecords } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const roles = (roleRecords || []).map((r: any) => r.role);
      const isAdmin = roles.includes('admin');
      const isStaff = roles.includes('staff');

      if (!isAdmin && !isStaff && userEmail !== 'curtislee@dissafyt.com' && userEmail !== 'dissafyt@gmail.com') {
        await supabase.auth.signOut();
        throw new Error('Access Denied: This POS register is restricted to authorized studio staff and barbers.');
      }

      const assignedRole = isAdmin ? 'admin' : isStaff ? 'staff' : 'admin';

      // Set cookie for Next.js edge middleware
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      document.cookie = `dissafyt_pos_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `dissafyt_pos_operator=${encodeURIComponent(userEmail)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `dissafyt_pos_role=${encodeURIComponent(assignedRole)}; path=/; max-age=${maxAge}; SameSite=Lax`;

      if (redirectUrl && !redirectUrl.startsWith('/login')) {
        router.push(redirectUrl);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-zinc-900 border border-amber-500/30 shadow-lg shadow-amber-500/10 mb-2">
            <Scissors className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Ace of Fyt Studio POS
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-serif">
            Studio Register Portal
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Point of Sale terminal for grooming services, retail apparel, and PayFast card machine walk-in checkout.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-start space-x-2.5">
              <span className="font-bold shrink-0">Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                <span>Staff Operator Email</span>
                <span className="text-[10px] text-zinc-500 font-mono">Barber / Admin</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="curtislee@dissafyt.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] text-zinc-500 font-mono">Protected</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Open Studio Register</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick preset for Curtis-Lee / Operator */}
          <div className="pt-2 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setEmail('curtislee@dissafyt.com');
                setPassword('DissafytAdmin2026!');
              }}
              className="w-full text-center text-[11px] text-zinc-500 hover:text-amber-400 transition-colors py-1 flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-3 h-3" />
              <span>Use Curtis-Lee (Admin Operator)</span>
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-zinc-500 flex items-center justify-center space-x-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            <span>Dissafyt Studio Cape Town • In-Store Register</span>
          </p>
          <p className="text-[10px] text-zinc-600 font-mono">
            Direct Real-Time Sync with PayFast POS & PostgreSQL Inventory
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PosLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500">
          Loading POS Register Portal...
        </div>
      }
    >
      <PosLoginContent />
    </Suspense>
  );
}
