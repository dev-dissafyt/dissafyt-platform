import React from 'react';
import Link from 'next/link';
import { Truck, Printer, Sparkles, Layers, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { PersonaSwitcher } from '@/app/components/persona-switcher';

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0e12] text-zinc-100 flex flex-col font-sans">
      {/* Factory Floor Top Navigation */}
      <header className="border-b border-zinc-800/80 bg-black/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="h-9 w-9 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm tracking-wider uppercase text-white">DISSAFYT OPS</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    FACTORY
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-500 tracking-tight">FULFILMENT & DISPATCH // MOTHER CITY</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 font-mono text-xs">
              <Link
                href="/?app=ops"
                className="px-3 py-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Queue</span>
              </Link>
              <Link
                href="/dispatch?app=ops"
                className="px-3 py-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center space-x-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Courier Dispatch</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-3 text-xs font-mono text-zinc-400 border-r border-zinc-800 pr-4">
              <Link href="/?app=studio" className="hover:text-amber-400 flex items-center space-x-1 transition-colors">
                <span>Studio Lab</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-600" />
              </Link>
              <Link href="/?app=admin" className="hover:text-amber-400 flex items-center space-x-1 transition-colors">
                <span>Admin HQ</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-600" />
              </Link>
            </div>
            <PersonaSwitcher />
          </div>
        </div>
      </header>

      {/* Sub-navigation for mobile */}
      <div className="md:hidden flex border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-2 font-mono text-xs space-x-2">
        <Link href="/?app=ops" className="px-2.5 py-1 rounded bg-zinc-800 text-amber-400">
          Print Queue
        </Link>
        <Link href="/dispatch?app=ops" className="px-2.5 py-1 rounded hover:bg-zinc-800 text-zinc-400">
          Courier Dispatch
        </Link>
      </div>

      {/* Main Factory View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
