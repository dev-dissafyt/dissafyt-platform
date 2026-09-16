'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, ShoppingBag, Scissors, User, Menu, X, ArrowRight, Search, Sparkles } from 'lucide-react';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { useCart } from '../context/cart-context';
import { ThemeToggle } from './theme-toggle';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const { totalCount, openCart } = useCart();

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

  // Track scroll position to enhance sticky header styling
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleOpenSearch = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open_site_search'));
    }
  };

  const navLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Shop', href: '/shop', icon: ShoppingBag },
    { label: 'Barbershop', href: '/book', icon: Scissors },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-250 ease-out border-b ${
        scrolled
          ? 'border-zinc-800/90 bg-zinc-950/95 backdrop-blur-md shadow-lg shadow-black/40 dark:bg-zinc-950/95 dark:border-zinc-800/90 light:bg-white/95 light:border-zinc-200'
          : 'border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm dark:bg-zinc-950/80 dark:border-zinc-800/60 light:bg-white/80 light:border-zinc-200/80'
      }`}
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Location Pill */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 transition-transform duration-200 hover:scale-[1.02] active:scale-95">
            <Image
              src="/logo.png"
              alt="Dissafyt"
              width={140}
              height={40}
              className="h-8 w-auto object-contain brightness-110"
              priority
            />
          </Link>
          <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-[10px] font-mono tracking-widest text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>CPT // FLAGSHIP</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 text-xs font-semibold uppercase tracking-wider">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center space-x-1.5 py-1 border-b-2 transition-all duration-200 hover:scale-[1.03] active:scale-95 ${
                  isActive
                    ? 'border-amber-500 text-white font-bold'
                    : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-600'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 transition-colors ${isActive ? 'text-amber-500' : 'text-zinc-400 group-hover:text-white'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Action Buttons */}
        <div className="hidden md:flex items-center space-x-2.5">
          {/* Global Search Button (Cmd+K) */}
          <button
            type="button"
            onClick={handleOpenSearch}
            className="inline-flex h-9 items-center space-x-2 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 text-xs font-medium text-zinc-400 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Search platform"
            title="Search garments and services (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden lg:inline">Search</span>
            <kbd className="rounded border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Shopping Bag Button */}
          <button
            type="button"
            onClick={openCart}
            className="relative inline-flex h-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 text-xs font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label={`Open shopping cart (${totalCount} items)`}
          >
            <ShoppingBag className="mr-1.5 h-3.5 w-3.5 text-zinc-400" />
            <span>Cart</span>
            {totalCount > 0 && (
              <span className="ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-black animate-in zoom-in-50">
                {totalCount}
              </span>
            )}
          </button>

          {user ? (
            <Link
              href="/account"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 text-xs font-semibold text-zinc-200 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800 hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <User className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              Account
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/90 px-3.5 text-xs font-medium text-zinc-200 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800 hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/book"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 px-4 text-xs font-extrabold text-black uppercase tracking-wider transition-all duration-200 shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Scissors className="mr-1.5 h-3.5 w-3.5" />
            Book Chair
          </Link>
        </div>

        {/* Mobile Header Buttons */}
        <div className="flex md:hidden items-center space-x-2">
          {/* Mobile Search */}
          <button
            type="button"
            onClick={handleOpenSearch}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white transition-all active:scale-95"
            aria-label="Search site"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Mobile Theme Toggle */}
          <ThemeToggle className="h-8 w-8" />

          {/* Mobile Cart Button */}
          <button
            type="button"
            onClick={openCart}
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white transition-all active:scale-95"
            aria-label={`Open shopping cart (${totalCount} items)`}
          >
            <ShoppingBag className="h-4 w-4" />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-black">
                {totalCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown / Slide-Down Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950/98 backdrop-blur-xl px-4 py-5 space-y-4 animate-in slide-in-from-top-3 duration-200">
          <nav className="flex flex-col space-y-2.5 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all active:scale-98 ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20'
                      : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span>{link.label}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-zinc-600" />
                </Link>
              );
            })}

            {/* Quick Search Action */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleOpenSearch();
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-zinc-900 w-full text-left transition-all active:scale-98"
            >
              <span className="flex items-center space-x-2.5">
                <Search className="h-4 w-4 text-amber-500" />
                <span>Search Garments & Cuts</span>
              </span>
              <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                ⌘K
              </span>
            </button>

            {/* Mobile Shopping Bag Row */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openCart();
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-zinc-900 w-full text-left transition-all active:scale-98"
            >
              <span className="flex items-center space-x-2.5">
                <ShoppingBag className="h-4 w-4 text-amber-500" />
                <span>Shopping Bag</span>
              </span>
              {totalCount > 0 ? (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'}
                </span>
              ) : (
                <span className="text-xs text-zinc-500 font-mono">Empty</span>
              )}
            </button>
          </nav>

          <div className="pt-4 border-t border-zinc-800/80 flex flex-col gap-2.5">
            <Link
              href="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center h-11 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all active:scale-98 shadow-md shadow-amber-500/10"
            >
              <Scissors className="mr-2 h-4 w-4" /> Book Appointment
            </Link>

            {user ? (
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center h-10 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-all active:scale-98"
              >
                <User className="mr-1.5 h-4 w-4 text-amber-500" /> Manage My Account
              </Link>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center h-10 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-all active:scale-98"
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
