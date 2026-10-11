'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@dissafyt/ui';
import { MailCheck, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [searchParams]);

  async function handleUnsubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update preferences.');
      }

      setUnsubscribed(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
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
          {unsubscribed ? 'Preferences Updated' : 'Email Preferences'}
        </CardTitle>
        <CardDescription className="text-zinc-400">
          {unsubscribed
            ? 'You have opted out of promotional communications.'
            : 'Manage your Dissafyt VIP drop notices and studio announcements.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {unsubscribed ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-white">Unsubscribed Successfully</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <strong>{email}</strong> has been removed from marketing broadcasts. You will still receive essential receipts and appointment confirmations for active orders.
              </p>
            </div>
            <Link href="/" className="block">
              <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs uppercase tracking-wider py-2.5">
                Return to Dissafyt Home
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUnsubscribe} className="space-y-4">
            {errorMsg && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="unsubscribe-email">Email Address</Label>
              <Input
                id="unsubscribe-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-amber-500"
              />
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              By unsubscribing, you will no longer receive early streetwear drop notifications, artist drops, or studio promotions. Critical transactional receipts remain active.
            </p>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider py-2.5 transition shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </span>
              ) : (
                'Unsubscribe From Marketing'
              )}
            </Button>
          </form>
        )}

        {/* Security Trust Badge */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between font-mono">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            <span>Encrypted Privacy</span>
          </div>
          <span>Dissafyt Concierge</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-zinc-500">Loading preferences...</div>}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
