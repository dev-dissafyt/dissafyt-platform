'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Printer, 
  Truck, 
  Shirt, 
  TrendingUp, 
  CreditCard,
  Layers
} from 'lucide-react';
import { getActivePersona, PRESET_PERSONAS, StudioPersona } from '../lib/persona';

export function StudioNavigation() {
  const pathname = usePathname();
  const [persona, setPersona] = useState<StudioPersona>(PRESET_PERSONAS[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPersona(getActivePersona());

    const handlePersonaChange = (e: any) => {
      if (e.detail) setPersona(e.detail);
    };

    window.addEventListener('studio_persona_changed', handlePersonaChange);
    return () => window.removeEventListener('studio_persona_changed', handlePersonaChange);
  }, []);

  if (!mounted || pathname === '/login') {
    return null;
  }

  const isOperator = persona.role === 'staff';
  const isCreator = persona.role === 'creator';
  const isAdmin = persona.role === 'admin';

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-zinc-800">
        {/* Operator & Admin Navigation */}
        {(isOperator || isAdmin) && (
          <>
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname === '/'
                  ? 'bg-zinc-800 text-amber-400 font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Factory Queue</span>
            </Link>
            <Link
              href="/dispatch"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname === '/dispatch'
                  ? 'bg-zinc-800 text-cyan-400 font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Kasi Kollekt Dispatch</span>
            </Link>
          </>
        )}

        {/* Creator & Admin Navigation */}
        {(isCreator || isAdmin) && (
          <>
            <Link
              href="/creator"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname === '/creator'
                  ? 'bg-zinc-800 text-amber-400 font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Garment Lab & Drops</span>
            </Link>
            <Link
              href="/creator/sales"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname === '/creator/sales'
                  ? 'bg-zinc-800 text-emerald-400 font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Sales & Drip Profits</span>
            </Link>
            <Link
              href="/creator/payouts"
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                pathname === '/creator/payouts'
                  ? 'bg-zinc-800 text-purple-400 font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payouts & Banking</span>
            </Link>
          </>
        )}
      </nav>

      {/* Mobile Bottom Workstation Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-3 py-2 flex items-center justify-around text-xs shadow-2xl">
        {(isOperator || isAdmin) && (
          <>
            <Link
              href="/"
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition ${
                pathname === '/' ? 'text-amber-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Printer className="w-4 h-4 mb-0.5" />
              <span>Queue</span>
            </Link>
            <Link
              href="/dispatch"
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition ${
                pathname === '/dispatch' ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4 mb-0.5" />
              <span>Dispatch</span>
            </Link>
          </>
        )}
        {(isCreator || isAdmin) && (
          <>
            <Link
              href="/creator"
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition ${
                pathname === '/creator' ? 'text-amber-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shirt className="w-4 h-4 mb-0.5" />
              <span>Lab</span>
            </Link>
            <Link
              href="/creator/sales"
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition ${
                pathname === '/creator/sales' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 mb-0.5" />
              <span>Sales</span>
            </Link>
            <Link
              href="/creator/payouts"
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold transition ${
                pathname === '/creator/payouts' ? 'text-purple-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4 mb-0.5" />
              <span>Payouts</span>
            </Link>
          </>
        )}
      </div>
    </>
  );
}
