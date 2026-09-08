import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import './globals.css';

import { Navbar } from './components/Navbar';

export const metadata: Metadata = {
  title: 'Dissafyt Platform',
  description: 'Unified digital platform for Dissafyt commerce, services and community.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 antialiased selection:bg-amber-500 selection:text-black">
        {/* Responsive Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-zinc-800 bg-zinc-950 py-10 text-center text-sm text-zinc-500">
          <div className="container mx-auto max-w-7xl px-4 flex flex-col items-center">
            <Link href="/" className="mb-4 inline-block">
              <Image
                src="/logo.png"
                alt="Dissafyt"
                width={130}
                height={38}
                className="h-7 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="mb-2 text-zinc-400">
              &copy; {new Date().getFullYear()} Dissafyt Platform. All rights reserved.
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
