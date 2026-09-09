'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, Sparkles, Factory, LogOut } from 'lucide-react';
import { 
  getActivePersona, 
  loginStudioPersona, 
  logoutStudioPersona, 
  PRESET_PERSONAS, 
  StudioPersona,
  isStudioAuthenticated 
} from '../lib/persona';

export function PersonaSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [persona, setPersona] = useState<StudioPersona>(PRESET_PERSONAS[0]);
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isStudioAuthenticated());
    setPersona(getActivePersona());

    const handlePersonaChange = (e: any) => {
      if (e.detail) {
        setPersona(e.detail);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
    };

    window.addEventListener('studio_persona_changed', handlePersonaChange);
    return () => window.removeEventListener('studio_persona_changed', handlePersonaChange);
  }, []);

  if (!mounted || pathname === '/login') return null;

  const handleSelect = (p: StudioPersona) => {
    loginStudioPersona(p);
    setPersona(p);

    // If switched to creator and currently on factory floor route, redirect to /creator
    if (p.role === 'creator' && (pathname === '/' || pathname.startsWith('/dispatch'))) {
      router.push('/creator');
    } else if (p.role === 'staff' && pathname.startsWith('/creator')) {
      router.push('/');
    }
  };

  const handleSignOut = () => {
    logoutStudioPersona();
    router.push('/login');
  };

  const isOnCreator = pathname.startsWith('/creator');

  return (
    <div className="flex items-center space-x-2">
      {/* Admin Quick Workstation Toggle */}
      {persona.role === 'admin' && (
        <button
          type="button"
          onClick={() => router.push(isOnCreator ? '/' : '/creator')}
          className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm ${
            isOnCreator
              ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}
          title={isOnCreator ? 'Jump to Factory Floor' : 'Jump to Creator Studio'}
        >
          {isOnCreator ? (
            <>
              <Factory className="w-3.5 h-3.5" />
              <span>To Factory Floor</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>To Creator Studio</span>
            </>
          )}
        </button>
      )}

      {/* Active Workstation / Persona Indicator */}
      <div className="relative inline-block text-left">
        <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs shadow-sm">
          {persona.role === 'creator' ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          ) : persona.role === 'staff' ? (
            <Factory className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-rose-400" />
          )}

          {persona.role === 'admin' ? (
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
                  {p.email === 'dissafyt@gmail.com'
                    ? '👑 Owner: dissafyt@gmail.com'
                    : p.role === 'creator'
                    ? `🎨 Creator: ${p.brandName?.split(' ')[0]}`
                    : p.role === 'staff'
                    ? '🏭 Operator: Factory Floor'
                    : '🛡️ Admin: Full Access'}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-zinc-200 text-xs font-semibold">
              {persona.role === 'creator'
                ? `🎨 ${persona.brandName?.split(' ')[0] || 'Creator'}`
                : '🏭 Factory Operator'}
            </span>
          )}
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        type="button"
        onClick={handleSignOut}
        title="Sign Out of Studio"
        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs transition"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </div>
  );
}
