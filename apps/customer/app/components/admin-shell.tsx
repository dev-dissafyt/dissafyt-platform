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
  Menu,
  X,
} from 'lucide-react';
import { OperatorSwitcher } from './operator-switcher';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // On login page, render clean full-screen view without admin frame
  if (pathname === '/login' || pathname === '/admin/login') {
    return <>{children}</>;
  }

  const basePrefix = pathname.startsWith('/admin') ? '/admin' : '';

  const navItems = [
    {
      name: 'Dashboard',
      href: basePrefix || '/',
      icon: LayoutDashboard,
      isActive: pathname === '/admin' || pathname === '/',
    },
    {
      name: 'Customers',
      href: `${basePrefix}/customers`,
      icon: Users,
      isActive:
        pathname === '/admin/customers' ||
        pathname === '/customers' ||
        pathname.startsWith('/admin/customers/') ||
        pathname.startsWith('/customers/'),
    },
    {
      name: 'Products & Catalog',
      href: `${basePrefix}/commerce`,
      icon: ShoppingBag,
      isActive:
        (pathname === '/admin/commerce' || pathname === '/commerce') &&
        !pathname.includes('/orders'),
    },
    {
      name: 'Customer Orders',
      href: `${basePrefix}/commerce/orders`,
      icon: null,
      isSubItem: true,
      isActive:
        pathname.startsWith('/admin/commerce/orders') ||
        pathname.startsWith('/commerce/orders'),
    },
    {
      name: 'Barbershop',
      href: `${basePrefix}/barbershop`,
      icon: Scissors,
      isActive:
        pathname.startsWith('/admin/barbershop') ||
        pathname.startsWith('/barbershop'),
    },
    {
      name: 'Finance & Payments',
      href: `${basePrefix}/finance`,
      icon: DollarSign,
      isActive:
        pathname.startsWith('/admin/finance') ||
        pathname.startsWith('/finance'),
    },
    {
      name: 'Settings',
      href: `${basePrefix}/settings`,
      icon: Settings,
      isActive:
        pathname.startsWith('/admin/settings') ||
        pathname.startsWith('/settings'),
    },
  ];

  const currentItem = navItems.find((item) => item.isActive);
  const currentTitle = currentItem?.name || 'Administration';

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex antialiased w-full">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar / Collapsible Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-stone-900 border-r border-stone-800 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 lg:bg-stone-900/50 lg:z-auto flex-shrink-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between px-2 py-3 border-b border-stone-800">
            <Link
              href={basePrefix || '/'}
              onClick={() => setMobileOpen(false)}
              className="flex items-center space-x-2"
            >
              <Image
                src="/logo.png"
                alt="Dissafyt"
                width={120}
                height={34}
                className="h-7 w-auto object-contain"
              />
              <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[10px] text-stone-400 font-mono">
                ADMIN
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Active Operator Switcher (In Collapsible Drawer for Mobile) */}
          <div className="lg:hidden pb-3 border-b border-stone-800">
            <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider mb-2 px-1">
              Active Operator
            </div>
            <OperatorSwitcher inDrawer={true} />
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 rounded-md px-3 py-2.5 transition-colors ${
                    item.isSubItem ? 'pl-6 text-xs' : ''
                  } ${
                    item.isActive
                      ? 'bg-stone-800 text-white font-bold'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  {Icon ? (
                    <Icon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  ) : item.isSubItem ? (
                    <span className="text-amber-400">&bull;</span>
                  ) : null}
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info badge */}
        <div className="p-3 rounded-md border border-stone-800 bg-stone-900/80 text-xs text-stone-400 space-y-1 mt-6">
          <div className="flex items-center text-amber-400 font-semibold">
            <ShieldAlert className="h-3.5 w-3.5 mr-1 flex-shrink-0" /> Sovereign Vault
          </div>
          <p className="truncate">Cape Town Flagship Admin</p>
        </div>
      </aside>

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar (Responsive) */}
        <header className="h-16 border-b border-stone-800 bg-stone-950/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            {/* Hamburger button on mobile */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-1.5 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <div className="text-xs text-stone-500 uppercase tracking-wider font-mono lg:hidden">
                {currentTitle}
              </div>
              <div className="hidden lg:block text-sm font-semibold text-stone-300">
                Platform Administration
              </div>
            </div>
          </div>

          {/* Desktop Operator Switcher (Hidden on Mobile) */}
          <div className="hidden lg:flex items-center space-x-2 sm:space-x-4">
            <OperatorSwitcher />
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto min-w-0 max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
