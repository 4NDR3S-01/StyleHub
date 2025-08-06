'use client'

import ProtectedRoute from '../../components/admin/ProtectedRoute';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { ReactNode, useState } from 'react';
import AdminHeader from '../../components/admin/AdminHeader';

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-slate-200 flex-col min-h-screen">
          <AdminSidebar />
        </aside>
        {/* Sidebar Mobile Overlay */}
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
          onClick={() => setSidebarOpen(false)}
          tabIndex={0}
        />
        {/* Sidebar Mobile Drawer */}
        <aside
          className={`fixed top-0 left-0 z-50 w-64 h-full bg-white border-r border-slate-200 transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-200 lg:hidden`}
        >
          <AdminSidebar />
        </aside>
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 flex justify-center items-start p-4 sm:p-8">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-4 sm:p-8 min-h-[60vh] flex flex-col gap-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
