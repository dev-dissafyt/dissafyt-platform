'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, Sparkles, Factory, ChevronDown } from 'lucide-react';
import { getActivePersona, setActivePersona, PRESET_PERSONAS, StudioPersona } from '../lib/persona';

export function PersonaSwitcher() {
  const router = useRouter();
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

  if (!mounted) return null;

  const handleSelect = (p: StudioPersona) => {
    setActivePersona(p);
    setPersona(p);

    // If switched to creator and currently on factory floor route, redirect to /creator
    if (p.role === 'creator' && (pathname === '/' || pathname.startsWith('/dispatch'))) {
      router.push('/creator');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative inline-block text-left">
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs shadow-sm">
          {persona.role === 'creator' ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          ) : persona.role === 'staff' ? (
            <Factory className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-rose-400" />
          )}

          <select
            value={persona.email}
            onChange={(e) => {
              const found = PRESET_PERSONAS.find((p) => p.email === e.target.value);
              if (found) handleSelect(found);
            }}
            className="bg-transparent text-zinc-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
          >
            {PRESET_PERSONAS.map((p) => (
              <option key={p.email} value={p.email} className="bg-zinc-900 text-zinc-100">
                {p.role === 'creator'
                  ? `🎨 Creator: ${p.brandName?.split(' ')[0]}`
                  : p.role === 'staff'
                  ? '🏭 Operator: Factory Floor'
                  : '🛡️ Admin: Full Governance'}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
