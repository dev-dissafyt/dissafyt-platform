'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label } from '@dissafyt/ui';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, KeyRound } from 'lucide-react';
import { PasswordInput } from '../../components/password-input';

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInvalidLink, setIsInvalidLink] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initializeRecoverySession() {
      try {
        const supabase = getSupabaseBrowserClient();

        // 1. Inspect URL Hash (#error=... or #access_token=...)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashString = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hashString);

          // Check if Supabase passed an error in the hash fragment
          const hashError = hashParams.get('error') || hashParams.get('error_description');
          if (hashError) {
            const description = hashParams.get('error_description') || hashError;
            const decoded = decodeURIComponent(description.replace(/\+/g, ' '));
            if (mounted) {
              setErrorMsg(
                decoded.toLowerCase().includes('expired')
                  ? 'This password reset link has expired. For your security, reset links are single-use and valid for 60 minutes.'
                  : decoded
              );
              setIsInvalidLink(true);
              setCheckingAuth(false);
            }
            return;
          }

          // Check for direct recovery access_token in hash fragment
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            const { data, error: setSessionErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!setSessionErr && data.session) {
              if (mounted) {
                setSessionReady(true);
                setCheckingAuth(false);
              }
              return;
            }
          }
        }

        // 2. Inspect URL Search Params (?code=... for PKCE flow)
        if (typeof window !== 'undefined' && window.location.search) {
          const searchParams = new URLSearchParams(window.location.search);
          const code = searchParams.get('code');
          const searchError = searchParams.get('error_description') || searchParams.get('error');

          if (searchError) {
            if (mounted) {
              setErrorMsg(decodeURIComponent(searchError.replace(/\+/g, ' ')));
              setIsInvalidLink(true);
              setCheckingAuth(false);
            }
            return;
          }

          if (code) {
            const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeErr && data.session) {
              if (mounted) {
                setSessionReady(true);
                setCheckingAuth(false);
              }
              return;
            }
          }
        }

        // 3. Fallback check for existing active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (mounted) {
            setSessionReady(true);
            setCheckingAuth(false);
          }
          return;
        }

        // 4. Listen for auth state transitions (PASSWORD_RECOVERY event)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            if (mounted) {
              setSessionReady(true);
              setCheckingAuth(false);
            }
          }
        });

        // Grace period before marking link as unauthenticated
        setTimeout(() => {
          if (mounted) {
            setCheckingAuth(false);
          }
        }, 1200);

        return () => {
          subscription.unsubscribe();
        };
      } catch (err: any) {
        console.warn('[ResetPassword] Session resolution exception:', err);
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    }

    initializeRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/account');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      if (msg.toLowerCase().includes('session') || msg.toLowerCase().includes('login') || msg.toLowerCase().includes('expired')) {
        setErrorMsg('Your security token has expired or is invalid. Please request a fresh password reset email.');
        setIsInvalidLink(true);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/90 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-3 text-center flex flex-col items-center">
        <Link href="/" className="inline-block mb-1">
          <Image
            src="/logo.png"
            alt="Dissafyt"
            width={140}
            height={42}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
        <CardTitle className="text-2xl font-bold text-white tracking-wide">
          {success ? 'Password Reset Successful' : isInvalidLink ? 'Link Expired' : 'Create New Password'}
        </CardTitle>
        <CardDescription className="text-zinc-400">
          {success
            ? 'Your credentials have been securely updated.'
            : isInvalidLink
            ? 'This recovery link is no longer valid.'
            : 'Enter a strong new password for your Dissafyt profile.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {checkingAuth ? (
          <div className="py-8 text-center space-y-3">
            <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-zinc-400 font-mono">Verifying cryptographic token...</div>
          </div>
        ) : isInvalidLink ? (
          <div className="space-y-5 text-center py-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300 text-left leading-relaxed">
              {errorMsg || 'The password reset link has expired or has already been used.'}
            </div>
            <p className="text-xs text-zinc-400">
              For your account protection, reset links are single-use and expire within 60 minutes.
            </p>
            <Link href="/auth/forgot-password" className="block">
              <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider py-2.5">
                Request Fresh Reset Link <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ) : success ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Password Updated!</h3>
              <p className="text-xs text-zinc-400">
                Your credentials have been securely refreshed. Redirecting you to your account...
              </p>
            </div>
            <Button
              onClick={() => router.push('/account')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs uppercase tracking-wider"
            >
              Continue to Account
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            {errorMsg && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <PasswordInput
                id="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <PasswordInput
                id="confirm-password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-amber-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider py-2.5 transition shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  Updating Credentials...
                </span>
              ) : (
                'Set New Password'
              )}
            </Button>
          </form>
        )}

        {/* Security Trust Badge */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between font-mono">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <span>Dissafyt Cape Town</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-zinc-500">Loading reset portal...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
