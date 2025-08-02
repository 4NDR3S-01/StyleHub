'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Box, List, Users, ShoppingCart, TrendingUp, UserPlus } from 'lucide-react';
import dynamic from 'next/dynamic';
import SampleDataLoader from './SampleDataLoader';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Carga dinámica de Chart.js para evitar SSR issues
const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Devuelve la clase de badge según el estado de la orden
function getOrderStatusClass(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'confirmed':
      return 'bg-blue-100 text-blue-700';
    case 'processing':
      return 'bg-purple-100 text-purple-700';
    case 'shipped':
      return 'bg-green-100 text-green-700';
    case 'delivered':
      return 'bg-green-200 text-green-800';
    case 'cancelled':
      return 'bg-red-200 text-red-800';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    users: 0,
    orders: 0,
  });
  const [salesData, setSalesData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [userData, setUserData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [newUsers, setNewUsers] = useState<any[]>([]);

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

    async function fetchSalesAndUsers() {
      // Últimos 30 días
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().slice(0, 10);
      });
      // Ventas por día
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at')
        .gte('created_at', days[0] + 'T00:00:00.000Z');
      const salesCount: Record<string, number> = {};
      days.forEach(day => { salesCount[day] = 0; });
      (orders || []).forEach((o: any) => {
        const d = o.created_at.slice(0, 10);
        if (salesCount[d] !== undefined) salesCount[d]++;
      });
      setSalesData({ labels: days.map(d => d.slice(5)), data: days.map(d => salesCount[d]) });

      // Usuarios nuevos por día
      const { data: users } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', days[0] + 'T00:00:00.000Z');
      const userCount: Record<string, number> = {};
      days.forEach(day => { userCount[day] = 0; });
      (users || []).forEach((u: any) => {
        const d = u.created_at.slice(0, 10);
        if (userCount[d] !== undefined) userCount[d]++;
      });
      setUserData({ labels: days.map(d => d.slice(5)), data: days.map(d => userCount[d]) });
    }

    async function fetchRecentOrders() {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);
      // Obtener nombre de usuario
      let userMap: Record<string, string> = {};
      if (orders && orders.length > 0) {
        const userIds = Array.from(new Set(orders.map(o => o.user_id)));
        const { data: users } = await supabase
          .from('users')
          .select('id, name')
          .in('id', userIds);
        userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u.name]));
      }
      setRecentOrders((orders || []).map(o => ({
        ...o,
        user_name: userMap[o.user_id] || 'Usuario',
        created_at: o.created_at.slice(0, 10),
      })));
    }

    async function fetchTopProducts() {
      // Top productos por cantidad en order_items
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .limit(1000);
      const prodCount: Record<string, number> = {};
      (items || []).forEach((i: any) => {
        prodCount[i.product_id] = (prodCount[i.product_id] || 0) + i.quantity;
      });
      const prodIds = Object.keys(prodCount);
      let prodNames: Record<string, string> = {};
      if (prodIds.length > 0) {
        const { data: prods } = await supabase
          .from('products')
          .select('id, name')
          .in('id', prodIds);
        prodNames = Object.fromEntries((prods || []).map((p: any) => [p.id, p.name]));
      }
      const top = prodIds
        .map(id => ({ name: prodNames[id] || id, ventas: prodCount[id] }))
        .sort((a, b) => b.ventas - a.ventas)
        .slice(0, 5);
      setTopProducts(top);
    }

    async function fetchNewUsers() {
      const { data: users } = await supabase
        .from('users')
        .select('name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      setNewUsers(users || []);
    }

    fetchStats();
    fetchSalesAndUsers();
    fetchRecentOrders();
    fetchTopProducts();
    fetchNewUsers();
  }, []);

  const cards = [
    {
      label: 'Productos',
      value: stats.products,
      color: 'blue',
      icon: <Box size={32} className="text-blue-900" />,
      href: '/admin/productos',
    },
    {
      label: 'Categorías',
      value: stats.categories,
      color: 'green',
      icon: <List size={32} className="text-green-900" />,
      href: '/admin/categorias',
    },
    {
      label: 'Usuarios',
      value: stats.users,
      color: 'purple',
      icon: <Users size={32} className="text-purple-900" />,
      href: '/admin/usuarios',
    },
    {
      label: 'Órdenes',
      value: stats.orders,
      color: 'red',
      icon: <ShoppingCart size={32} className="text-red-900" />,
      href: '/admin/orders',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <a
            key={card.label}
            href={card.href}
            className={
              `relative rounded-2xl p-7 flex flex-col items-center justify-center shadow-xl border border-slate-200 bg-gradient-to-br ` +
              [
                'from-blue-200 via-blue-300 to-blue-400',
                'from-green-200 via-green-300 to-green-400',
                'from-purple-200 via-purple-300 to-purple-400',
                'from-red-200 via-red-300 to-red-400',
              ][idx]
              +
              ' hover:scale-[1.03] hover:shadow-2xl transition-all duration-200 group overflow-hidden'
            }
          >
            <div className={`absolute top-3 right-3 text-7xl pointer-events-none select-none text-${card.color}-900`}>
              {card.icon}
            </div>
            <div className="z-10 flex flex-col items-center">
              <span className={`text-4xl font-extrabold text-${card.color}-900 drop-shadow-sm group-hover:text-${card.color}-700 transition-colors`}>{card.value}</span>
              <span className={`mt-2 text-lg font-semibold text-${card.color}-800 tracking-wide uppercase`}>{card.label}</span>
            </div>
          </a>
        ))}
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl shadow-xl p-6 bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400 border border-blue-300">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-blue-500" />
            <span className="font-bold text-lg">Ventas últimos 30 días</span>
          </div>
          <div className="bg-blue-100 rounded-xl p-4 shadow-inner">
            <Chart
              data={{
                labels: salesData.labels,
                datasets: [
                  {
                    label: 'Órdenes',
                    data: salesData.data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    tension: 0.4,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } },
                },
              }}
              height={220}
            />
          </div>
        </div>
        <div className="rounded-2xl shadow-xl p-6 bg-gradient-to-br from-purple-200 via-purple-300 to-purple-400 border border-purple-300">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="text-purple-500" />
            <span className="font-bold text-lg">Usuarios nuevos últimos 30 días</span>
          </div>
          <div className="bg-purple-100 rounded-xl p-4 shadow-inner">
            <Chart
              data={{
                labels: userData.labels,
                datasets: [
                  {
                    label: 'Usuarios',
                    data: userData.data,
                    borderColor: '#a21caf',
                    backgroundColor: 'rgba(168,85,247,0.1)',
                    tension: 0.4,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } },
                },
              }}
              height={220}
            />
          </div>
        </div>
      </div>

      {/* Últimas órdenes (placeholder) */}
      <div className="rounded-2xl shadow-xl p-6 bg-gradient-to-br from-red-200 via-red-300 to-red-400 border border-red-300">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="text-red-400" />
          <span className="font-bold text-lg">Últimas órdenes</span>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-slate-700 text-center py-8 font-semibold">No hay órdenes recientes aún.</div>
        ) : (
          <table className="w-full text-sm rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-red-300 text-red-900">
                <th className="p-2">#</th>
                <th className="p-2">Usuario</th>
                <th className="p-2">Total</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, idx) => (
                <tr key={order.id} className={
                  'border-b last:border-0 ' +
                  (idx % 2 === 0 ? 'bg-red-100' : 'bg-red-200')
                }>
                  <td className="p-2 font-mono text-xs text-red-900">{order.order_number}</td>
                  <td className="p-2 text-red-900">{order.user_name}</td>
                  <td className="p-2 font-bold text-blue-700">${order.total}</td>
                  <td className="p-2">
                    <span className={
                      'px-2 py-1 rounded-full text-xs font-bold ' + getOrderStatusClass(order.status)
                    }>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-2 text-xs text-slate-500">{order.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Resumen de actividad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl shadow-xl p-6 bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400 border border-blue-300">
          <div className="font-bold text-lg mb-4">Productos más vendidos</div>
          <ul className="space-y-2">
            {topProducts.map((prod, idx) => (
              <li key={prod.name} className="flex justify-between items-center px-2 py-2 rounded-lg hover:bg-blue-200 transition">
                <span className="font-medium text-blue-900">{prod.name}</span>
                <span className="font-bold text-blue-700">{prod.ventas} ventas</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl shadow-xl p-6 bg-gradient-to-br from-purple-200 via-purple-300 to-purple-400 border border-purple-300">
          <div className="font-bold text-lg mb-4">Usuarios nuevos</div>
          <ul className="space-y-2">
            {newUsers.map((user, idx) => (
              <li key={user.email} className="flex flex-col px-2 py-2 rounded-lg hover:bg-purple-200 transition">
                <span className="font-semibold text-purple-900">{user.name}</span>
                <span className="text-xs text-slate-700">{user.email}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Herramientas de desarrollo */}
      {/* <div className="border-t pt-8">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Herramientas de Desarrollo</h3>
        <SampleDataLoader />
      </div> */}
    </div>
  );
}
