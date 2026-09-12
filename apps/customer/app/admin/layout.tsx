import React from 'react';
import { AdminShell } from '@/app/components/admin-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
