"use client"

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient'
import { toast } from '@/hooks/use-toast'

interface OrderRow {
  id: string
  user_id: string
  total: number
  status: string
  created_at: string
  user_name?: string
}

/**
 * Componente para gestionar las órdenes desde el panel de administración.
 * Permite listar las últimas órdenes, mostrar el nombre del usuario y
 * actualizar el estado de cada orden.
 */
export default function OrdersAdmin() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      // Obtener órdenes con user_id y total
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id,user_id,total,status,created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
        setLoading(false)
        return
      }
      // Mapeo de usuarios
      const userIds = Array.from(new Set(ordersData?.map((o) => o.user_id)))
      let userMap: Record<string, string> = {}
      if (userIds.length > 0) {
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id,name')
          .in('id', userIds)
        if (!userError) {
          userMap = Object.fromEntries(users!.map((u: any) => [u.id, u.name]))
        }
      }
      const processed = (ordersData || []).map((o) => ({
        ...o,
        user_name: userMap[o.user_id] || 'Usuario',
        created_at: o.created_at.slice(0, 10),
      })) as OrderRow[]
      setOrders(processed)
      setLoading(false)
    }
    fetchOrders()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    toast({ title: 'Éxito', description: 'Estado actualizado correctamente' })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Órdenes</h1>
      {loading ? (
        <p className="text-gray-600">Cargando órdenes...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-600">No hay órdenes registradas.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-200 text-slate-700">
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left">Total</th>
              <th className="p-2 text-left">Estado</th>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b last:border-b-0">
                <td className="p-2 font-mono text-xs">{order.id}</td>
                <td className="p-2">{order.user_name}</td>
                <td className="p-2 font-semibold">${order.total.toFixed(2)}</td>
                <td className="p-2">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="border rounded p-1 text-sm"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="processing">Procesando</option>
                    <option value="shipped">Enviada</option>
                    <option value="delivered">Entregada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </td>
                <td className="p-2 text-sm text-gray-500">{order.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}