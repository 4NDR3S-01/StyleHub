'use client';

import React, { useEffect, useState } from 'react';
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
      href: '/admin/clientes',
    },
    {
      label: 'Pedidos',
      value: stats.orders,
      icon: <ShoppingCart size={32} className="text-[#ff6f61] drop-shadow-lg" />,
      href: '/admin/ordenes',
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map(card => (
          <a
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl px-7 py-6 flex flex-col items-center justify-center hover:shadow-md transition-shadow border border-slate-100 group min-h-[140px] shadow-sm"
            style={{ boxShadow: '0 2px 8px 0 rgba(60,72,100,0.04)' }}
          >
            <div className="flex flex-col items-center justify-center w-full">
              <div className="mb-2">{card.icon}</div>
              <span className="text-3xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mb-1 break-words">{card.value}</span>
              <span className="text-base text-gray-600 font-medium text-center break-words">{card.label}</span>
            </div>
          </a>
        ))}
      </div>
      {/* Aquí puedes agregar más widgets, gráficas o tablas como en la imagen de referencia */}
    </div>
  );
}
