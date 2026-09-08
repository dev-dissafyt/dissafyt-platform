import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { LayoutDashboard, Users, ShoppingBag, Scissors, Settings, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DISSafyt Platform Administration',
  description: 'Central operational control for DISSafyt Platform.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-stone-950 text-stone-100 flex antialiased">
        {/* Admin Sidebar */}
        <aside className="w-64 border-r border-stone-800 bg-stone-900/50 flex flex-col justify-between p-4">
          <div className="space-y-6">
            <div className="flex items-center space-x-2 px-2 py-3 border-b border-stone-800">
              <span className="font-extrabold text-lg tracking-wider text-amber-500 uppercase">
                DISSafyt
              </span>
              <span className="rounded bg-stone-800 px-1.5 py-0.5 text-xs text-stone-400 font-mono">
                ADMIN
              </span>
            </div>

            <nav className="space-y-1 text-sm font-medium">
              <Link
                href="/"
                className="flex items-center space-x-3 rounded-md px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-amber-500" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/customers"
                className="flex items-center space-x-3 rounded-md px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
              >
                <Users className="h-4 w-4 text-amber-500" />
                <span>Customers</span>
              </Link>
              <Link
                href="/commerce"
                className="flex items-center space-x-3 rounded-md px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
              >
                <ShoppingBag className="h-4 w-4 text-amber-500" />
                <span>Products & Catalog</span>
              </Link>
              <Link
                href="/commerce/orders"
                className="flex items-center space-x-3 rounded-md px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-white transition-colors pl-6 text-xs"
              >
                <span className="text-amber-400">&bull;</span>
                <span>Customer Orders</span>
              </Link>
              <Link
                href="/barbershop"
                className="flex items-center space-x-3 rounded-md px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
              >
                <Scissors className="h-4 w-4 text-amber-500" />
                <span>Barbershop</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center space-x-3 rounded-md px-3 py-2 text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4 text-amber-500" />
                <span>Settings</span>
              </Link>
            </nav>
          </div>

          <div className="p-3 rounded-md border border-stone-800 bg-stone-900/80 text-xs text-stone-400 space-y-1">
            <div className="flex items-center text-amber-400 font-semibold">
              <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Privileged Access
            </div>
            <p>Backend role enforcement active.</p>
          </div>
        </aside>

        {/* Main Content View */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-stone-800 bg-stone-950/80 px-8 flex items-center justify-between">
            <div className="text-sm font-semibold text-stone-300">
              Platform Administration
            </div>
            <div className="text-xs text-stone-500 font-mono">
              Port: 3001 &bull; API: Shared Platform
            </div>
          </header>
          <main className="flex-1 p-8 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
