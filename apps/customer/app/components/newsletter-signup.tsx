'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

interface NewsletterSignupProps {
  className?: string;
  variant?: 'footer' | 'inline';
}

export function NewsletterSignup({ className = '', variant = 'footer' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          source: variant === 'footer' ? 'website_footer' : 'website_inline',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to join at this moment.');
      }

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Unable to join at this moment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 animate-in zoom-in-95 duration-200 ${className}`}>
        <div className="flex items-center space-x-2.5">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white">
              You&apos;re on the VIP Drop List
            </p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              Watch your inbox for Cape Town streetwear capsules and barber chair openings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {variant === 'footer' && (
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">
            VIP Drop List & Studio Dispatch
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
            Receive exclusive release codes for 280GSM garment capsules and priority barbering chair drops.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/90 p-1 focus-within:border-amber-500 transition-colors">
          <div className="pl-3 text-zinc-500">
            <Mail className="h-4 w-4" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none"
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 text-xs font-extrabold text-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            aria-label="Subscribe to newsletter"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-black" />
            ) : (
              <ArrowRight className="h-4 w-4 text-black" />
            )}
          </button>
        </div>

        {error && (
          <p className="text-[11px] text-red-400 font-mono pl-1">{error}</p>
        )}
      </form>
    </div>
  );
}
