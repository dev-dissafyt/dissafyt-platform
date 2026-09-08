import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import './globals.css';

export const metadata: Metadata = {
  title: 'DISSafyt Platform',
  description: 'Unified digital platform for DISSafyt commerce, services and community.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 antialiased selection:bg-amber-500 selection:text-black">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
          <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center space-x-3">
              <span className="font-bold text-xl tracking-wider text-zinc-100 uppercase">
                DISS<span className="text-amber-500">afyt</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-zinc-400">
              <Link href="/" className="transition-colors hover:text-zinc-100">
                Home
              </Link>
              <Link href="/shop" className="transition-colors hover:text-zinc-100">
                Shop
              </Link>
              <Link href="/book" className="transition-colors hover:text-zinc-100">
                Barbershop (Ace of Fyt)
              </Link>
              <Link href="/account" className="transition-colors hover:text-zinc-100">
                My Account
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              <Link
                href="/checkout"
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                Cart
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
              >
                Sign In
              </Link>
              <Link
                href="/book"
                className="inline-flex h-9 items-center justify-center rounded-md bg-amber-500 px-4 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
              >
                Book Cut
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-sm text-zinc-500">
          <div className="container mx-auto max-w-7xl px-4">
            <p className="mb-2 text-zinc-400">
              &copy; {new Date().getFullYear()} DISSafyt Platform. All rights reserved.
            </p>
            <p className="text-xs text-zinc-600">
              Unified Commerce & Barbershop Services &bull; Secure Payments by PayFast
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
