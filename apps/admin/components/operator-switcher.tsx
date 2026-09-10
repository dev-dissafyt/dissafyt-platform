'use client';

import { useEffect, useState } from 'react';
import { Shield, LogOut, User } from 'lucide-react';
import { getActiveOperator, logoutAdmin, AdminOperator } from '../lib/operator';

export function OperatorSwitcher() {
  const [operator, setOperator] = useState<AdminOperator>({
    email: 'curtislee@dissafyt.com',
    role: 'admin',
    fullName: 'Curtis-Lee',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOperator(getActiveOperator());

    function handleOperatorChange(e: any) {
      if (e.detail) setOperator(e.detail);
    }
    window.addEventListener('admin_operator_changed', handleOperatorChange);
    return () => window.removeEventListener('admin_operator_changed', handleOperatorChange);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center space-x-3 text-xs">
      {/* Operator Identity Badge */}
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 shadow-sm">
        <div className="h-6 w-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
          <Shield className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-white font-semibold text-xs leading-none">
            {operator.fullName || (operator.email.startsWith('curtis') ? 'Curtis-Lee' : 'Administrator')}
          </span>
          <span className="text-[10px] font-mono text-stone-400 leading-tight">
            {operator.email}
          </span>
        </div>
        <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono uppercase text-amber-400 font-bold ml-1">
          {operator.role}
        </span>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={() => logoutAdmin()}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-stone-800 bg-stone-900/60 hover:bg-red-500/10 hover:border-red-500/30 text-stone-400 hover:text-red-300 transition-all text-xs font-semibold"
        title="Sign Out of Admin Control Room"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </div>
  );
}
