import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dissafyt Studio — Factory OS & Kasi Kollekt Fulfillment',
  description: 'On-demand production queue, creator studio, and urban streetwear fulfillment desk.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-amber-500 selection:text-black">
        {/* Studio Top Navigation Bar */}
        <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center font-black text-black text-lg tracking-wider shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  S
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-wider text-white uppercase block leading-tight">
                    DISSAFYT <span className="text-amber-400">STUDIO</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase block">
                    Kasi Kollekt Factory OS
                  </span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-zinc-800">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  Factory Queue
                </Link>
                <Link
                  href="/creator"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  Creator Studio & Mockup
                </Link>
                <Link
                  href="/dispatch"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  Kasi Kollekt Dispatch
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1.5"></span>
                Factory Port 3002
              </span>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition"
              >
                Storefront ↗
              </a>
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition"
              >
                Admin ↗
              </a>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Studio Footer */}
        <footer className="border-t border-zinc-900 bg-zinc-950 py-6 mt-12 text-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Dissafyt Studio • Kasi Kollekt Micro-Factory & Fulfillment Engine</p>
        </footer>
      </body>
    </html>
  );
}
