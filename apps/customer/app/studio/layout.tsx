import React from 'react';
import Link from 'next/link';
import { Sparkles, Layers, ArrowUpRight, Palette, Store } from 'lucide-react';
import { PersonaSwitcher } from '@/app/components/persona-switcher';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans">
      {/* Studio Header */}
      <header className="border-b border-zinc-800/80 bg-black/70 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="h-9 w-9 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm tracking-wider uppercase text-white">ACE OF FYT</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    STUDIO LAB
                  </span>
                </div>
                <p className="text-[10px] font-mono text-zinc-500 tracking-tight">STREETWEAR CREATOR & DESIGN SUITE</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 font-mono text-xs">
              <Link
                href="/creator?app=studio"
                className="px-3 py-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Creator Portal</span>
              </Link>
              <Link
                href="/creator?app=studio&tab=mockup"
                className="px-3 py-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center space-x-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Garment Lab</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-3 text-xs font-mono text-zinc-400 border-r border-zinc-800 pr-4">
              <Link href="/?app=ops" className="hover:text-amber-400 flex items-center space-x-1 transition-colors">
                <span>Factory Ops</span>
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

      {/* Main Studio View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
