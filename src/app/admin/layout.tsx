
import ProtectedRoute from '../../components/admin/ProtectedRoute';
import SidebarAdmin from '../../components/admin/SidebarAdmin';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <SidebarAdmin />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
