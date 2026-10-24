'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Scissors,
  Settings,
  ShieldAlert,
  DollarSign,
  Award,
  Store,
} from 'lucide-react';
import { OperatorSwitcher } from './operator-switcher';
import { getActiveOperator, AdminOperator, DEFAULT_OPERATOR } from '../lib/operator';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [operator, setOperator] = useState<AdminOperator>(DEFAULT_OPERATOR);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setOperator(getActiveOperator());
    setMounted(true);

    const handleOperatorChanged = (e: any) => {
      if (e.detail) setOperator(e.detail);
    };
    window.addEventListener('admin_operator_changed', handleOperatorChanged);
    return () => window.removeEventListener('admin_operator_changed', handleOperatorChanged);
  }, []);

  const isBranchScoped = mounted && (operator.role === 'barbershop_manager' || operator.role === 'barber');

  // On login page, render clean full-screen view without admin frame
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 h-screen h-[100dvh] bg-stone-950 text-stone-100 flex antialiased w-full overflow-hidden">
      {/* Admin Sidebar - Pinned to Viewport */}
      <aside className="w-64 border-r border-stone-800 bg-stone-900/50 flex flex-col justify-between p-4 flex-shrink-0 h-full overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 py-3 border-b border-stone-800">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Dissafyt"
                width={120}
                height={34}
                className="h-7 w-auto object-contain"
              />
            </Link>
            <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[10px] text-amber-400 font-mono uppercase font-bold tracking-wider">
              {mounted ? (operator.role === 'barbershop_manager' ? 'MANAGER' : operator.role === 'barber' ? 'BARBER' : 'ADMIN') : 'ADMIN'}
            </span>
          </div>

          <nav className="space-y-1 text-sm font-medium">
            <Link
              href="/"
              className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                pathname === '/' ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 text-amber-500" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/barbershop"
              className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                pathname.startsWith('/barbershop') ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Scissors className="h-4 w-4 text-amber-500" />
              <span>{isBranchScoped ? 'Branch Operations' : 'Bookings'}</span>
            </Link>

            <Link
              href="/customers"
              className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                pathname.startsWith('/customers') ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 text-amber-500" />
              <span>Customers</span>
            </Link>

            <Link
              href="/finance"
              className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                pathname.startsWith('/finance') ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span>{isBranchScoped ? 'Branch Payouts' : 'Finance & Payments'}</span>
            </Link>

            {!isBranchScoped && (
              <>
                <Link
                  href="/commerce"
                  className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                    pathname === '/commerce' ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4 text-amber-500" />
                  <span>Products & Catalog</span>
                </Link>
                <Link
                  href="/commerce/orders"
                  className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors pl-6 text-xs ${
                    pathname.startsWith('/commerce/orders') ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <span className="text-amber-400">&bull;</span>
                  <span>Customer Orders</span>
                </Link>
                <Link
                  href="/commerce/batches"
                  className={`flex items-center justify-between rounded-md px-3 py-2 transition-colors pl-6 text-xs ${
                    pathname.startsWith('/commerce/batches') ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-amber-400">&bull;</span>
                    <span>Batches &amp; Working Capital</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                    R10k Pool
                  </span>
                </Link>
                <Link
                  href="/founders-pass"
                  className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                    pathname.startsWith('/founders-pass') ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Founder&apos;s Pass</span>
                </Link>
                <Link
                  href="/settings"
                  className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                    pathname.startsWith('/settings') ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Settings className="h-4 w-4 text-amber-500" />
                  <span>Settings</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="p-3 rounded-md border border-stone-800 bg-stone-900/80 text-xs text-stone-400 space-y-1">
          <div className="flex items-center text-amber-400 font-semibold">
            {isBranchScoped ? <Store className="h-3.5 w-3.5 mr-1" /> : <ShieldAlert className="h-3.5 w-3.5 mr-1" />}
            <span>{isBranchScoped ? 'Branch Studio View' : 'Sovereign Vault'}</span>
          </div>
          <p className="truncate font-medium text-stone-300">
            {operator.locationName ? operator.locationName : 'Cape Town Flagship HQ'}
          </p>
        </div>
      </aside>

      {/* Main Content View - Pinned Header with Scrollable Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <header className="h-16 flex-shrink-0 border-b border-stone-800 bg-stone-950/80 px-8 flex items-center justify-between z-40 backdrop-blur-md">
          <div className="text-sm font-semibold text-stone-300">
            Platform Administration
          </div>
          <div className="flex items-center space-x-4">
            <OperatorSwitcher />
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto min-w-0 max-w-full">{children}</main>
      </div>
    </div>
  );
}
