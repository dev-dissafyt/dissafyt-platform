'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@dissafyt/ui';
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Failed to submit reset request.');
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
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
        <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
        <CardDescription className="text-zinc-400">
          {isSubmitted
            ? 'Password reset instructions have been dispatched.'
            : 'Enter your email address and we will send you a secure link to reset your account password.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {isSubmitted ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Check Your Inbox</h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                If an account exists for <span className="text-amber-400 font-mono">{email}</span>, you will receive a secure password reset link shortly.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => setIsSubmitted(false)}
                className="w-full border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs"
              >
                Try Another Email
              </Button>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Account Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-amber-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm py-2.5 transition shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  Sending Link...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Return to Sign In
              </Link>
            </div>
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

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-zinc-500">Loading reset portal...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
