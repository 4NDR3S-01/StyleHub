'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Box, List, Users, ShoppingCart } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    users: 0,
    orders: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const [{ count: products }, { count: categories }, { count: users }, { count: orders }] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        products: products ?? 0,
        categories: categories ?? 0,
        users: users ?? 0,
        orders: orders ?? 0,
      });
    }
    fetchStats();
  }, []);

  const cards = [
    {
      label: 'Productos',
      value: stats.products,
      icon: <Box size={32} className="text-blue-500" />,
      href: '/admin/productos',
    },
    {
      label: 'Categorías',
      value: stats.categories,
      icon: <List size={32} className="text-green-500" />,
      href: '/admin/categorias',
    },
    {
      label: 'Usuarios',
      value: stats.users,
      icon: <Users size={32} className="text-purple-500" />,
      href: '/admin/usuarios',
    },
    {
      label: 'Pedidos',
      value: stats.orders,
      icon: <ShoppingCart size={32} className="text-red-400" />,
      href: '/admin/orders',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map(card => (
        <a
          key={card.label}
          href={card.href}
          className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center hover:shadow-xl transition-shadow border border-gray-100 group"
        >
          {card.icon}
          <span className="mt-4 text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{card.value}</span>
          <span className="mt-2 text-lg text-gray-600">{card.label}</span>
        </a>
      ))}
    </div>
  );
}
