'use client';

import React from 'react';
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
} from 'lucide-react';
import { OperatorSwitcher } from './operator-switcher';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // On login page, render clean full-screen view without admin frame
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex antialiased w-full">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-stone-800 bg-stone-900/50 flex flex-col justify-between p-4 flex-shrink-0">
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
            <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[10px] text-stone-400 font-mono">
              ADMIN
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
              href="/customers"
              className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                pathname.startsWith('/customers') ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 text-amber-500" />
              <span>Customers</span>
            </Link>
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
              href="/barbershop"
              className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                pathname.startsWith('/barbershop') ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Scissors className="h-4 w-4 text-amber-500" />
              <span>Barbershop</span>
            </Link>
            <Link
              href="/finance"
              className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                pathname.startsWith('/finance') ? 'bg-stone-800 text-white font-bold' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <DollarSign className="h-4 w-4 text-amber-500" />
              <span>Finance & Payments</span>
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
          </nav>
        </div>

        <div className="p-3 rounded-md border border-stone-800 bg-stone-900/80 text-xs text-stone-400 space-y-1">
          <div className="flex items-center text-amber-400 font-semibold">
            <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Sovereign Vault
          </div>
          <p>Cape Town Flagship Admin</p>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-stone-800 bg-stone-950/80 px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
          <div className="text-sm font-semibold text-stone-300">
            Platform Administration
          </div>
          <div className="flex items-center space-x-4">
            <OperatorSwitcher />
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
