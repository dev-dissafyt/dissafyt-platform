'use client';

import { useEffect, useState, useRef } from 'react';
import { Shield, LogOut, ChevronDown, Check, ShoppingBag, UserCheck } from 'lucide-react';
import { getActiveOperator, logoutAdmin, switchAdminOperator, AdminOperator } from '@/lib/operator';

const AUTHORIZED_ADMINS = [
  {
    email: 'curtislee@dissafyt.com',
    fullName: 'Curtis-Lee',
    role: 'admin' as const,
    title: 'Master Admin',
    badge: '👑 Master',
  },
  {
    email: 'dissafyt@gmail.com',
    fullName: 'Dissafyt Flagship',
    role: 'admin' as const,
    title: 'Shop & Store Owner',
    badge: '💈 Owner',
  },
];

export function OperatorSwitcher({ inDrawer = false }: { inDrawer?: boolean } = {}) {
  const [operator, setOperator] = useState<AdminOperator>({
    email: 'curtislee@dissafyt.com',
    role: 'admin',
    fullName: 'Curtis-Lee',
  });
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setOperator(getActiveOperator());

    function handleOperatorChange(e: any) {
      if (e.detail) setOperator(e.detail);
    }

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    window.addEventListener('admin_operator_changed', handleOperatorChange);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('admin_operator_changed', handleOperatorChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function handleSelectAccount(email: string) {
    switchAdminOperator(email);
    setDropdownOpen(false);
    // Reload page to refresh all active queries and RBAC permissions with new operator headers
    window.location.reload();
  }

  if (!mounted) return null;

  const currentAccount = AUTHORIZED_ADMINS.find(
    (a) => a.email.toLowerCase() === operator.email.toLowerCase()
  ) || {
    email: operator.email,
    fullName: operator.fullName || 'Administrator',
    role: operator.role,
    title: 'Platform Admin',
    badge: '⚡ Admin',
  };

  if (inDrawer) {
    return (
      <div className="flex flex-col space-y-2.5 w-full text-xs" ref={dropdownRef}>
        {/* Operator Switcher Trigger in Drawer */}
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 transition-all shadow-sm group"
          title="Click to switch admin account"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold group-hover:scale-105 transition-transform flex-shrink-0">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <div className="flex items-center space-x-1">
                <span className="text-white font-semibold text-xs leading-none truncate">
                  {currentAccount.fullName}
                </span>
                <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 text-[8px] font-mono uppercase text-amber-400 font-bold flex-shrink-0">
                  {currentAccount.badge}
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 leading-tight truncate">
                {currentAccount.email}
              </span>
            </div>
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 text-stone-400 transition-transform flex-shrink-0 ml-1.5 ${
              dropdownOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu (Accordion in Drawer) */}
        {dropdownOpen && (
          <div className="w-full rounded-xl border border-stone-800 bg-stone-950 p-2 shadow-xl space-y-1">
            <div className="px-2 py-1.5 border-b border-stone-800/80">
              <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                Switch Admin Operator
              </p>
            </div>

            {AUTHORIZED_ADMINS.map((acc) => {
              const isSelected = acc.email.toLowerCase() === operator.email.toLowerCase();
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectAccount(acc.email)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/30 text-white'
                      : 'hover:bg-stone-800/60 border border-transparent text-stone-300'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-xs text-white truncate">
                        {acc.fullName}
                      </span>
                      <span className="text-[9px] font-mono text-amber-400 font-bold flex-shrink-0">
                        {acc.badge}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 truncate">
                      {acc.email}
                    </span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-amber-400 ml-2 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Drawer Quick Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href="https://pos.dissafyt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all text-xs font-semibold"
            title="Open In-Store POS Register"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
            <span>POS Register</span>
          </a>

          <button
            type="button"
            onClick={() => logoutAdmin()}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-stone-800 bg-stone-900/80 hover:bg-red-500/10 hover:border-red-500/30 text-stone-400 hover:text-red-300 transition-all text-xs font-semibold cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center space-x-3 text-xs" ref={dropdownRef}>
      {/* Operator Switcher Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 transition-all shadow-sm group"
        title="Click to switch admin account"
      >
        <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold group-hover:scale-105 transition-transform">
          <Shield className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center space-x-1">
            <span className="text-white font-semibold text-xs leading-none">
              {currentAccount.fullName}
            </span>
            <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 text-[8px] font-mono uppercase text-amber-400 font-bold">
              {currentAccount.badge}
            </span>
          </div>
          <span className="text-[10px] font-mono text-stone-400 leading-tight truncate max-w-[150px]">
            {currentAccount.email}
          </span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-stone-400 transition-transform ${dropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-28 top-11 w-64 rounded-2xl border border-stone-800 bg-stone-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1">
          <div className="px-3 py-2 border-b border-stone-800/80">
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              Switch Admin Operator
            </p>
            <p className="text-[11px] text-stone-300">
              Select authorized account
            </p>
          </div>

          {AUTHORIZED_ADMINS.map((acc) => {
            const isSelected = acc.email.toLowerCase() === operator.email.toLowerCase();
            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectAccount(acc.email)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border border-amber-500/30 text-white'
                    : 'hover:bg-stone-800/60 border border-transparent text-stone-300'
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-xs text-white">
                      {acc.fullName}
                    </span>
                    <span className="text-[9px] font-mono text-amber-400 font-bold">
                      {acc.badge}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">
                    {acc.email}
                  </span>
                </div>
                {isSelected && <Check className="h-4 w-4 text-amber-400" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Launch POS Register */}
      <a
        href="https://pos.dissafyt.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all text-xs font-semibold"
        title="Open In-Store POS Register (pos.dissafyt.com)"
      >
        <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
        <span className="hidden sm:inline">POS Register</span>
      </a>

      {/* Sign Out Button */}
      <button
        onClick={() => logoutAdmin()}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-stone-800 bg-stone-900/60 hover:bg-red-500/10 hover:border-red-500/30 text-stone-400 hover:text-red-300 transition-all text-xs font-semibold cursor-pointer"
        title="Sign Out of Admin Control Room"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </div>
  );
}
