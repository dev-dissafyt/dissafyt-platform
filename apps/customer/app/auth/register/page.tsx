'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import Image from 'next/image';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@dissafyt/ui';
import { ShieldCheck } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Create authenticated account via high-speed API (bypasses Supabase SMTP 504 timeout)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setErrorMsg(result.error || 'Failed to create account.');
        setLoading(false);
        return;
      }

      // 2. Automatically log the client in with session persistence
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setSuccessMsg('Account created successfully! Please sign in with your credentials.');
        setLoading(false);
        return;
      }

      // 3. Instant redirect to destination
      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/80">
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
        <CardTitle className="text-2xl font-bold text-white">Join Dissafyt</CardTitle>
        <CardDescription className="text-zinc-400">
          One account for streetwear shopping and barbershop bookings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMsg && (
          <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            {successMsg}
          </div>
        )}
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Phone (for Appointment & Delivery SMS)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="082 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link
            href={`/auth/login${redirectUrl !== '/account' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="text-amber-500 hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>

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

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-zinc-500">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
