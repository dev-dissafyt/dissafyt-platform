import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dissafyt POS — Studio Register',
  description: 'In-store Point of Sale register for grooming appointments and retail merchandise.',
};

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {children}
    </div>
  );
}
