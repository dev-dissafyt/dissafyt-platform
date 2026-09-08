'use client';

import { useEffect, useState } from 'react';
import { Shield, ShieldAlert, UserCheck, Scissors } from 'lucide-react';
import { getActiveOperator, setActiveOperator, AdminOperator } from '../lib/operator';

export function OperatorSwitcher() {
  const [operator, setOperator] = useState<AdminOperator>({ email: 'admin@dissafyt.com', role: 'admin' });
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

  function handleRoleChange(newRole: 'admin' | 'staff' | 'barber') {
    const updated: AdminOperator = {
      email: newRole === 'admin' ? 'admin@dissafyt.com' : `${newRole}@dissafyt.com`,
      role: newRole,
    };
    setActiveOperator(updated);
    setOperator(updated);
  }

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-stone-900 border border-stone-800">
        {operator.role === 'admin' && <Shield className="h-3.5 w-3.5 text-amber-500" />}
        {operator.role === 'staff' && <UserCheck className="h-3.5 w-3.5 text-sky-400" />}
        {operator.role === 'barber' && <Scissors className="h-3.5 w-3.5 text-emerald-400" />}
        <span className="text-stone-300 font-mono hidden sm:inline">{operator.email}</span>
      </div>

      <select
        value={operator.role}
        onChange={(e) => handleRoleChange(e.target.value as any)}
        className="bg-stone-900 border border-stone-800 text-stone-300 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
        title="Simulate RBAC Operator Account Role"
      >
        <option value="admin">Role: Admin (Full Access)</option>
        <option value="staff">Role: Staff (Restricted)</option>
        <option value="barber">Role: Barber (Provider)</option>
      </select>
    </div>
  );
}
