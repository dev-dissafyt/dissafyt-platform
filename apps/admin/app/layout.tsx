import type { Metadata } from 'next';
import './globals.css';
import { AdminShell } from '../components/admin-shell';

export const metadata: Metadata = {
  title: 'Dissafyt Platform Administration',
  description: 'Central operational control for Dissafyt Platform.',
};

export default function RootAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-stone-950 text-stone-100 antialiased selection:bg-amber-500 selection:text-black">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
