import Link from 'next/link';
import { LayoutDashboard, List, Box, Users, ShoppingCart } from 'lucide-react';

const links = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Categorías', href: '/admin/categories', icon: List },
  { name: 'Productos', href: '/admin/products', icon: Box },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
  { name: 'Pedidos', href: '/admin/orders', icon: ShoppingCart },
];

export default function SidebarAdmin() {
  return (
    <aside className="w-64 bg-white border-r flex flex-col py-8 px-4 shadow-lg min-h-screen">
      <div className="mb-10 text-center">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">StyleHub Admin</span>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {links.map(({ name, href, icon: Icon }) => (
            <li key={name}>
              <Link href={href} className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-50 text-gray-700 font-medium transition-colors group">
                <Icon size={20} className="text-slate-700 group-hover:text-blue-600 transition-colors" />
                <span className="group-hover:text-blue-600 transition-colors">{name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
