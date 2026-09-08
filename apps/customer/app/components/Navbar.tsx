'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Scissors, User, Menu, X, ArrowRight } from 'lucide-react';
import { getSupabaseBrowserClient } from '@dissafyt/database';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        setUser(data?.session?.user || null);

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
        });

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (e) {
        console.error('Navbar session check error:', e);
      }
    }
    checkAuth();
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'Barbershop', href: '/book' },
    { label: 'My Account', href: '/account' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-extrabold text-xl tracking-wider text-zinc-100 uppercase">
            DISS<span className="text-amber-500">afyt</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors py-1 border-b-2 ${
                  isActive
                    ? 'border-amber-500 text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Action Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          <Link
            href="/checkout"
            className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/80 px-3 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <ShoppingBag className="mr-1.5 h-3.5 w-3.5 text-zinc-400" />
            Cart
          </Link>

          {user ? (
            <Link
              href="/account"
              className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3.5 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              <User className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              Account
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-3.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/book"
            className="inline-flex h-9 items-center justify-center rounded-md bg-amber-500 px-4 text-xs font-bold text-black transition-colors hover:bg-amber-400"
          >
            <Scissors className="mr-1.5 h-3.5 w-3.5" />
            Book Cut
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center space-x-2">
          <Link
            href="/checkout"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300"
          >
            <ShoppingBag className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950 px-4 py-5 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-md ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 font-bold'
                      : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-4 w-4 text-zinc-600" />
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
            <Link
              href="/book"
              className="flex items-center justify-center h-10 rounded-md bg-amber-500 text-black font-bold text-xs"
            >
              <Scissors className="mr-1.5 h-4 w-4" /> Book Appointment
            </Link>

            {user ? (
              <Link
                href="/account"
                className="flex items-center justify-center h-10 rounded-md border border-zinc-700 bg-zinc-900 text-white text-xs font-semibold"
              >
                <User className="mr-1.5 h-4 w-4 text-amber-500" /> Manage My Account
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center justify-center h-10 rounded-md border border-zinc-700 bg-zinc-900 text-white text-xs"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
