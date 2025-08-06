"use client"

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient'
import { toast } from '@/hooks/use-toast'

interface OrderRow {
  id: string
  user_id: string
  total_amount: number
  status: string
  payment_status: string
  payment_intent_id?: string
  created_at: string
  user_name?: string
  user_email?: string
  items_count?: number
}

/**
 * Componente para gestionar las órdenes desde el panel de administración.
 * Permite listar las últimas órdenes, mostrar el nombre del usuario y
 * actualizar el estado de cada orden.
 */
export default function OrdersAdmin() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  const showOrderDetails = (order: OrderRow) => {
    // Verificación ética
    const isEthicalOrder = order.payment_status === 'completed' && order.payment_intent_id
    const ethicalStatus = isEthicalOrder ? '✅ Ética' : '⚠️ Problemática'
    
    toast({ 
      title: `Orden ${order.id.slice(0, 8)}... - ${ethicalStatus}`, 
      description: `Cliente: ${order.user_name} | Total: $${order.total_amount} | Estado Pago: ${order.payment_status} | ${isEthicalOrder ? 'Esta orden siguió el flujo ético: pago confirmado antes de crear la orden.' : 'Esta orden puede tener problemas: no tiene pago confirmado o payment_intent_id.'}`,
      variant: isEthicalOrder ? 'default' : 'destructive'
    })
  }

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true)
      try {
        // Obtener órdenes con información completa
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            total_amount,
            status,
            payment_status,
            payment_intent_id,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          throw error
        }

        // Obtener información de usuarios
        const userIds = Array.from(new Set(ordersData?.map((o) => o.user_id)))
        let userMap: Record<string, { name: string; email: string }> = {}
        
        if (userIds.length > 0) {
          const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', userIds)
          
          if (!userError && users) {
            userMap = Object.fromEntries(
              users.map((u: any) => [u.id, { name: u.name || 'Sin nombre', email: u.email }])
            )
          }
        }

        // Obtener conteo de items por orden
        const orderIds = ordersData?.map(o => o.id) || []
        let itemCountMap: Record<string, number> = {}
        
        if (orderIds.length > 0) {
          const { data: itemCounts, error: itemError } = await supabase
            .from('order_items')
            .select('order_id, quantity')
            .in('order_id', orderIds)
          
          if (!itemError && itemCounts) {
            itemCountMap = itemCounts.reduce((acc: Record<string, number>, item: any) => {
              acc[item.order_id] = (acc[item.order_id] || 0) + item.quantity
              return acc
            }, {})
          }
        }

        const processed = (ordersData || []).map((o) => ({
          ...o,
          user_name: userMap[o.user_id]?.name || 'Usuario desconocido',
          user_email: userMap[o.user_id]?.email || 'Email no disponible',
          items_count: itemCountMap[o.id] || 0,
          created_at: new Date(o.created_at).toLocaleDateString('es-ES')
        })) as OrderRow[]

        setOrders(processed)
      } catch (error: any) {
        toast({ 
          title: 'Error', 
          description: error.message || 'Error al cargar las órdenes', 
          variant: 'destructive' 
        })
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
      
      {/* Estadísticas éticas */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Total de Órdenes</h3>
            <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Órdenes Éticas</h3>
            <p className="text-3xl font-bold text-green-600">
              {orders.filter(order => order.payment_status === 'completed' && order.payment_intent_id).length}
            </p>
            <p className="text-sm text-gray-500">
              {((orders.filter(order => order.payment_status === 'completed' && order.payment_intent_id).length / orders.length) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Órdenes Problemáticas</h3>
            <p className="text-3xl font-bold text-red-600">
              {orders.filter(order => !order.payment_status || order.payment_status !== 'completed' || !order.payment_intent_id).length}
            </p>
            <p className="text-sm text-gray-500">
              {((orders.filter(order => !order.payment_status || order.payment_status !== 'completed' || !order.payment_intent_id).length / orders.length) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}
      
      {loading && (
        <p className="text-gray-600">Cargando órdenes...</p>
      )}
      {!loading && orders.length === 0 && (
        <p className="text-gray-600">No hay órdenes registradas.</p>
      )}
      {!loading && orders.length > 0 && (
        <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
          <thead>
            <tr className="bg-slate-200 text-slate-700">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Ética</th>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">Items</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Estado Orden</th>
              <th className="p-3 text-left">Estado Pago</th>
              <th className="p-3 text-left">PaymentIntent</th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isEthicalOrder = order.payment_status === 'completed' && order.payment_intent_id
              return (
              <tr key={order.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                <td className="p-3 text-center">
                  {isEthicalOrder ? (
                    <span className="text-green-600 text-lg" title="Orden ética: pago confirmado antes de crear la orden">✅</span>
                  ) : (
                    <span className="text-red-600 text-lg" title="Orden problemática: creada sin confirmación de pago">⚠️</span>
                  )}
                </td>
                <td className="p-3">
                  <div>
                    <div className="font-medium">{order.user_name}</div>
                    <div className="text-sm text-gray-500">{order.user_email}</div>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {order.items_count}
                  </span>
                </td>
                <td className="p-3 font-semibold">${order.total_amount.toFixed(2)}</td>
                <td className="p-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="border rounded p-1 text-sm bg-white"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagada</option>
                    <option value="processing">Procesando</option>
                    <option value="shipped">Enviada</option>
                    <option value="delivered">Entregada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status || '')}`}>
                    {order.payment_status || 'No definido'}
                  </span>
                </td>
                <td className="p-3 font-mono text-xs">
                  {order.payment_intent_id ? (
                    <span title={order.payment_intent_id}>
                      {order.payment_intent_id.slice(0, 10)}...
                    </span>
                  ) : (
                    <span className="text-gray-400">Sin PI</span>
                  )}
                </td>
                <td className="p-3 text-sm text-gray-500">{order.created_at}</td>
                <td className="p-3">
                  <button
                    onClick={() => showOrderDetails(order)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver detalles
                  </button>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}