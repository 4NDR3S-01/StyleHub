
import ProtectedRoute from '../../components/admin/ProtectedRoute';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
