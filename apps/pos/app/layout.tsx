import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dissafyt POS — Studio Register',
  description: 'In-store Point of Sale register for grooming appointments and retail merchandise.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-zinc-950 text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
