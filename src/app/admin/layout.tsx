import SidebarAdmin from '../../components/admin/SidebarAdmin';

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
