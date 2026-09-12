import React from 'react';
import Link from 'next/link';
import { Scissors, ShoppingBag, ArrowUpRight } from 'lucide-react';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0e12] text-zinc-100 flex flex-col font-sans">
      {/* POS Top Bar */}
      <header className="border-b border-zinc-800/80 bg-black/80 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm tracking-wider uppercase text-white">ACE OF FYT POS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                REGISTER LIVE
              </span>
            </div>
            <p className="text-[10px] font-mono text-zinc-500">CHAIRSIDE CHECKOUT // DISSAFYT FLAGSHIP</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono text-zinc-400">
          <Link href="/?app=ops" className="hover:text-amber-400 flex items-center space-x-1 transition-colors">
            <span>Factory Ops</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-600" />
          </Link>
          <Link href="/?app=admin" className="hover:text-amber-400 flex items-center space-x-1 transition-colors">
            <span>Admin HQ</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-600" />
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
