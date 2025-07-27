import Link from 'next/link';
import { HomeIcon, ShoppingBagIcon, GroupIcon, TagIcon, CogIcon, ClipboardListIcon, MessageSquareIcon, PencilIcon } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: HomeIcon, href: '/admin' },
  { name: 'Orders', icon: ShoppingBagIcon, href: '/admin/orders' },
  { name: 'Customers', icon: GroupIcon, href: '/admin/users' },
  { name: 'Products', icon: ClipboardListIcon, href: '/admin/products' },
  { name: 'Categories', icon: TagIcon, href: '/admin/categories' },
  { name: 'Coupons', icon: PencilIcon, href: '/admin/coupons' },
  { name: 'Reviews', icon: MessageSquareIcon, href: '/admin/reviews' },
  { name: 'Settings', icon: CogIcon, href: '/admin/settings' },
];


export default function AdminSidebar() {
  return (
    <aside className="bg-white h-screen w-64 shadow flex flex-col p-4">
      <div className="flex items-center mb-8">
        <span className="font-bold text-xl text-blue-700">Cozy</span>
        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Demo</span>
      </div>
      <nav className="flex-1">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Link href={item.href} className="flex items-center px-3 py-2 rounded hover:bg-blue-50 text-gray-700">
                <item.icon size={20} className="mr-3 text-blue-600" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
