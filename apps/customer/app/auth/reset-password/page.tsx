'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@dissafyt/ui';
import { ShieldCheck, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Check if user has active session from recovery token
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
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
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update password. Your reset link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-2xl">
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
        <CardTitle className="text-2xl font-bold text-white">Create New Password</CardTitle>
        <CardDescription className="text-zinc-400">
          Enter a secure new password for your Dissafyt account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {success ? (
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
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs"
            >
              Continue to Account
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
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
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm py-2.5 transition shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  Updating Password...
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
