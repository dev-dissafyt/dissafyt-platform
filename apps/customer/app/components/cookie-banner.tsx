'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';

const STORAGE_KEY = 'dissafyt_cookie_consent';

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Delay showing banner slightly for smooth entrance
        const timer = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleConsent = (mode: 'all' | 'essential') => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      id="cookie-banner"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-40 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 no-print text-white"
      role="region"
      aria-label="Cookie consent banner"
    >
      <div className="flex items-start space-x-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0 mt-0.5">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-xs text-zinc-300 leading-relaxed">
            We use essential cookies to maintain your shopping cart, preserve your sessions, and secure PayFast ZAR checkout. View our{' '}
            <Link href="/privacy" className="text-amber-400 underline hover:text-amber-300">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => handleConsent('all')}
              className="rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={() => handleConsent('essential')}
              className="rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:scale-[1.02] active:scale-95"
            >
              Essential Only
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleConsent('essential')}
          className="text-zinc-500 hover:text-white p-1"
          aria-label="Dismiss cookie banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
