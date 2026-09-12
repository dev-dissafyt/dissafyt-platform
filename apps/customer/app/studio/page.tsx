'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Layers, ArrowRight, Palette, DollarSign, Shirt, TrendingUp, ShieldCheck } from 'lucide-react';

export default function StudioHomePage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-950/20 via-black to-black p-8 sm:p-12">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>DISSAFYT CREATIVE STUDIO // CAPE TOWN</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase">
            Heavyweight Drip. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">
              Zero Production Friction.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Welcome to the Ace of Fyt Creative Lab. Partner with Cape Town’s premier streetwear brand. Upload your high-res graphics, test them on 240gsm boxy blanks, set your retail margins, and start earning royalties on every drop.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              href="/creator?app=studio"
              className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-purple-600/20 flex items-center space-x-2"
            >
              <span>Launch Creator Suite</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/creator?app=studio&tab=mockup"
              className="px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold text-sm tracking-wider uppercase transition-colors flex items-center space-x-2"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Garment Mockup Lab</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Palette className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base uppercase tracking-wider">3D Garment Sandbox</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Live preview of front chest stamps and oversized back prints on heavyweight 240gsm cotton and 380gsm hoodies.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base uppercase tracking-wider">Automated Profit Splits</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Transparent creator earnings. Select 70/30 royalty or 50/50 profit splits with automated ledger tracking.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base uppercase tracking-wider">Factory Sync</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Every approved drop seamlessly queues into the Dissafyt Factory Ops floor for direct-to-garment execution.
          </p>
        </div>
      </div>
    </div>
  );
}
