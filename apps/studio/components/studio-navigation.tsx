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

  if (!mounted) {
    return (
      <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-zinc-800">
        <Link
          href="/"
          className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          Factory Queue
        </Link>
      </nav>
    );
  }

  const isOperator = persona.role === 'staff';
  const isCreator = persona.role === 'creator';
  const isAdmin = persona.role === 'admin';

  return (
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
  );
}
