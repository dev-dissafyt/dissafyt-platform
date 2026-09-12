import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import './globals.css';

import { Navbar } from './components/Navbar';

export const metadata: Metadata = {
  title: 'DISSAFYT // The Sharpest Cut. The Heaviest Drip. — Cape Town Flagship',
  description: 'Premier grooming lounge at Ace of Fyt Barbershop × Dissafyt Streetwear Lab. Cape Town, Western Cape.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const platformApp = headersList.get('x-platform-app') || 'customer';
  const isCustomer = platformApp === 'customer';

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-black text-zinc-50 antialiased selection:bg-amber-500 selection:text-black">
        {/* Responsive Navigation Bar for Storefront */}
        {isCustomer && <Navbar />}

        {/* Main Content Area */}
        <main className="flex-1">{children}</main>

        {/* High-End Editorial Footer */}
        {isCustomer && (
          <footer className="border-t border-zinc-900 bg-black py-12 text-zinc-500">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-zinc-900">
              <div className="md:col-span-2 space-y-4">
                <Link href="/" className="inline-block">
                  <Image
                    src="/logo.png"
                    alt="Dissafyt"
                    width={150}
                    height={42}
                    className="h-8 w-auto object-contain brightness-110"
                  />
                </Link>
                <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                  The intersection of precision barbering and heavyweight streetwear culture.
                  Engineered and operated out of our Cape Town flagship lounge.
                </p>
                <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>CAPE TOWN FLAGSHIP // MOTHER CITY</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Pillars</h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <Link href="/book" className="hover:text-amber-400 transition-colors">
                      Ace of Fyt Barbershop
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop" className="hover:text-amber-400 transition-colors">
                      Dissafyt Streetwear Lab
                    </Link>
                  </li>
                  <li>
                    <Link href="/book" className="hover:text-amber-400 transition-colors">
                      VIP Monthly Guild Memberships
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Studio & Hub</h4>
                <ul className="space-y-2 text-xs text-zinc-400">
                  <li>Dissafyt Studio, Cape Town Flagship</li>
                  <li>Western Cape, South Africa</li>
                  <li className="text-zinc-500">Tue – Sat: 09:00 – 19:00</li>
                  <li className="text-zinc-500">Sun: 10:00 – 16:00</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 gap-3">
              <p>&copy; {new Date().getFullYear()} Dissafyt Platform. All rights reserved.</p>
              <div className="flex items-center space-x-4 text-xs text-zinc-500">
                <Link href="/privacy" className="hover:text-amber-400 transition-colors">
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-amber-400 transition-colors">
                  Terms & Conditions
                </Link>
                <span>•</span>
                <Link href="/data-deletion" className="hover:text-amber-400 transition-colors">
                  Data Deletion
                </Link>
              </div>
              <p className="font-mono text-[11px] text-zinc-500">
                POWERED BY PAYFAST ZAR // EXPRESS NATIONWIDE COURIER
              </p>
            </div>
          </div>
        </footer>
        )}
      </body>
    </html>
  );
}
