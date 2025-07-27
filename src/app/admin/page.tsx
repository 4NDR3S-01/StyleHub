import AdminDashboard from '../../components/admin/AdminDashboard';
import SidebarAdmin from '../../components/admin/SidebarAdmin';

export default function AdminPage() {
  return (
    <div>
      <SidebarAdmin />
      <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>
      <AdminDashboard />
    </div>
  );
}
