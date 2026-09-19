"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ShieldAlert, ShieldCheck, Lock, ArrowRight, Key, Users, Check } from "lucide-react";
import { getSupabaseBrowserClient } from "@dissafyt/database";
import { setActiveOperator } from "@/lib/operator";

const AUTHORIZED_ACCOUNTS = [
  {
    email: "curtislee@dissafyt.com",
    label: "Curtis-Lee",
    role: "Master Admin",
    badge: "👑 Master",
  },
  {
    email: "dissafyt@gmail.com",
    label: "Dissafyt Flagship",
    role: "Store & Shop Owner",
    badge: "💈 Owner",
  },
];

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("curtislee@dissafyt.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    errorParam === "unauthorized_role"
      ? "Access Denied: Your account does not have platform administrative privileges."
      : null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data.session) {
        throw new Error(error?.message || "Invalid email or password");
      }

      const token = data.session.access_token;
      const userId = data.session.user.id;
      const userEmail = (data.session.user.email || cleanEmail).toLowerCase();

      // Verify administrator or staff role in public.user_roles
      const { data: roleRecords } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const roles = (roleRecords || []).map((r: any) => r.role);
      const isMasterAdmin = userEmail === "curtislee@dissafyt.com" || userEmail === "dissafyt@gmail.com";
      const isAdmin = roles.includes("admin") || isMasterAdmin;
      const isStaff = roles.includes("staff");

      if (!isAdmin && !isStaff) {
        await supabase.auth.signOut();
        throw new Error("Access Denied: This portal is strictly restricted to platform administrators.");
      }

      const assignedRole = isAdmin ? "admin" : "staff";
      const fullName = userEmail === "curtislee@dissafyt.com" ? "Curtis-Lee" : "Dissafyt Flagship";

      // Set cookie for Next.js edge middleware
      const maxAge = 60 * 60 * 24 * 7; // 7 days
      document.cookie = `dissafyt_admin_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `dissafyt_admin_email=${encodeURIComponent(userEmail)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `dissafyt_admin_role=${encodeURIComponent(assignedRole)}; path=/; max-age=${maxAge}; SameSite=Lax`;

      // Update operator state
      setActiveOperator({
        email: userEmail,
        role: assignedRole,
        fullName,
      });

      // Determine redirect destination
      const isSubdomainAdmin = typeof window !== "undefined" && window.location.host.startsWith("admin.");
      if (redirectUrl && !redirectUrl.startsWith("/login") && !redirectUrl.startsWith("/admin/login")) {
        router.push(redirectUrl);
      } else if (isSubdomainAdmin) {
        window.location.href = "/";
      } else {
        window.location.href = "/admin";
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Dissafyt"
              width={160}
              height={45}
              className="h-9 w-auto object-contain"
              priority
            />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400 uppercase tracking-widest font-semibold">
              <Key className="h-3 w-3 mr-1" /> Control Room // Restricted
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Platform Administration
            </h1>
            <p className="text-xs text-stone-400">
              Cape Town Flagship • Central Operations & Management Vault
            </p>
          </div>
        </div>

        {/* Quick-Fill Admin Switcher Buttons */}
        <div className="space-y-2">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 text-center">
            Authorized Platform Operators
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AUTHORIZED_ACCOUNTS.map((acc) => {
              const isSelected = email.toLowerCase() === acc.email.toLowerCase();
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => setEmail(acc.email)}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/10 text-white shadow-sm shadow-amber-500/20"
                      : "border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
                      {acc.badge}
                    </span>
                    {isSelected && <Check className="h-3 w-3 text-amber-400" />}
                  </div>
                  <span className="font-semibold text-xs text-white mt-1">
                    {acc.label}
                  </span>
                  <span className="text-[10px] text-stone-400 truncate font-mono">
                    {acc.email}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-start space-x-2">
              <ShieldAlert className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-300">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="curtislee@dissafyt.com"
                className="w-full rounded-xl border border-stone-800 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-300">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-stone-800 bg-stone-950 px-4 py-3 text-sm text-white placeholder-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-black py-3 px-4 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-stone-800/80 text-[11px] text-stone-500 flex items-center justify-between font-mono">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Dissafyt Sovereign Vault // RBAC</span>
            </div>
            <span>v2.4.0 CPT</span>
          </div>
        </div>

        {/* Security Advisory */}
        <p className="text-center text-[11px] text-stone-600 leading-relaxed max-w-sm mx-auto">
          Both curtislee@dissafyt.com and dissafyt@gmail.com have full administrative privileges to platform bookings, catalog, orders, and finance.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-500 font-mono text-xs">
          Loading Dissafyt Security Portal...
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
