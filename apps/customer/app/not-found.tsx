'use client';

import Link from 'next/link';
import { ArrowLeft, Scissors, ShoppingBag, Search, Sparkles } from 'lucide-react';
import { Button } from '@dissafyt/ui';

export default function NotFound() {
  const handleOpenSearch = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open_site_search'));
    }
  };

  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Background Gold Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-xl text-center space-y-6">
        {/* Top Tag */}
        <div className="inline-flex items-center space-x-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1 text-xs font-mono text-amber-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>VAULT ARCHIVE // ERROR 404</span>
        </div>

        {/* Big Typography */}
        <div className="space-y-2">
          <h1 className="font-display text-5xl sm:text-7xl font-black uppercase tracking-tight text-white leading-none">
            Drop Not Found
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
            The streetwear garment, barber chair schedule, or link you are seeking has rotated out of stock or moved to a new URL.
          </p>
        </div>

        {/* Quick Search Shortcut */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleOpenSearch}
            className="inline-flex items-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-all hover:border-amber-500/40 hover:bg-zinc-800 hover:text-white hover:scale-[1.02] active:scale-95"
          >
            <Search className="h-4 w-4 text-amber-500" />
            <span>Search Garments & Barbershop Cuts</span>
            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider h-11 px-5 rounded-xl shadow-lg shadow-amber-500/10 hover:scale-[1.02] active:scale-95">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Flagship
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" className="border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-semibold uppercase tracking-wider h-11 px-5 rounded-xl hover:scale-[1.02] active:scale-95">
              <ShoppingBag className="mr-2 h-4 w-4 text-amber-500" /> Streetwear Drops
            </Button>
          </Link>
          <Link href="/book">
            <Button variant="outline" className="border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-semibold uppercase tracking-wider h-11 px-5 rounded-xl hover:scale-[1.02] active:scale-95">
              <Scissors className="mr-2 h-4 w-4 text-amber-500" /> Book Haircut
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
