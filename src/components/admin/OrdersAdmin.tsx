"use client"

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient'
import { toast } from '@/hooks/use-toast'

interface OrderRow {
  id: string
  user_id: string
  total: number
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
    const isEthicalOrder = order.payment_status === 'paid' && order.payment_intent_id
    const ethicalStatus = isEthicalOrder ? '✅ Ética' : '⚠️ Problemática'
    
    toast({ 
      title: `Orden ${order.id.slice(0, 8)}... - ${ethicalStatus}`, 
      description: `Cliente: ${order.user_name} | Total: $${order.total} | Estado Pago: ${order.payment_status} | ${isEthicalOrder ? 'Esta orden siguió el flujo ético: pago confirmado antes de crear la orden.' : 'Esta orden puede tener problemas: no tiene pago confirmado o payment_intent_id.'}`,
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
            total,
            status,
            payment_status,
            payment_intent_id,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(100)

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
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-orange-100 text-orange-800'
      case 'partially_refunded':
        return 'bg-orange-100 text-orange-700'
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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes</h1>
          <p className="mt-2 text-sm text-gray-600">
            Administra y monitorea todas las órdenes del sistema
          </p>
        </div>
        
        {/* Estadísticas éticas */}
        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow-lg rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">#</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Total de Órdenes</h3>
                    <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow-lg rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Órdenes Éticas</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {orders.filter(order => order.payment_status === 'paid' && order.payment_intent_id).length}
                    </p>
                    <p className="text-sm text-gray-500">
                      {((orders.filter(order => order.payment_status === 'paid' && order.payment_intent_id).length / orders.length) * 100).toFixed(1)}% del total
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow-lg rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">!</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Órdenes Problemáticas</h3>
                    <p className="text-3xl font-bold text-red-600">
                      {orders.filter(order => !order.payment_status || order.payment_status !== 'paid' || !order.payment_intent_id).length}
                    </p>
                    <p className="text-sm text-gray-500">
                      {((orders.filter(order => !order.payment_status || order.payment_status !== 'paid' || !order.payment_intent_id).length / orders.length) * 100).toFixed(1)}% del total
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-300 h-10 w-10"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
            <p className="text-gray-600 text-center mt-4">Cargando órdenes...</p>
          </div>
        )}
        
        {!loading && orders.length === 0 && (
          <div className="bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-gray-400 text-2xl">📦</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes registradas</h3>
            <p className="text-gray-500">Las órdenes aparecerán aquí cuando los clientes realicen compras.</p>
          </div>
        )}
      {!loading && orders.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-700 to-slate-600 text-white">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Ética</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Estado Orden</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Estado Pago</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Payment ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => {
                  const isEthicalOrder = order.payment_status === 'paid' && order.payment_intent_id
                  return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-4">
                      <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {order.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {isEthicalOrder ? (
                        <span 
                          className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full text-green-600 text-lg" 
                          title="Orden ética: pago confirmado antes de crear la orden"
                        >
                          ✅
                        </span>
                      ) : (
                        <span 
                          className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full text-red-600 text-lg" 
                          title="Orden problemática: creada sin confirmación de pago"
                        >
                          ⚠️
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 truncate">{order.user_name}</div>
                        <div className="text-sm text-gray-500 truncate">{order.user_email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {order.items_count} items
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${order.total.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="processing">Procesando</option>
                        <option value="shipped">Enviada</option>
                        <option value="delivered">Entregada</option>
                        <option value="cancelled">Cancelada</option>
                        <option value="refunded">Reembolsada</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status || '')}`}>
                        {order.payment_status || 'No definido'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {order.payment_intent_id ? (
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded max-w-24 truncate" title={order.payment_intent_id}>
                          {order.payment_intent_id.slice(0, 10)}...
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin PI</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{order.created_at}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => showOrderDetails(order)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}