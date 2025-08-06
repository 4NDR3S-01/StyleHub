"use client"

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient'
import { toast } from '@/hooks/use-toast'
import { Eye, Package, MapPin, CreditCard, Calendar, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface OrderItem {
  id: string
  product_name: string
  variant_name?: string
  quantity: number
  price: number
  total: number
}

interface OrderRow {
  id: string
  user_id: string
  order_number: string
  total: number
  subtotal: number
  tax: number
  shipping: number
  discount: number
  status: string
  payment_status: string
  payment_method: string
  address: any
  created_at: string
  updated_at: string
  user_name?: string
  user_email?: string
  order_items: OrderItem[]
}

/**
 * Componente para gestionar las órdenes desde el panel de administración.
 * Permite listar las últimas órdenes, mostrar detalles completos y
 * actualizar el estado de cada orden.
 */
export default function OrdersAdmin() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      // Obtener órdenes con todos los campos necesarios
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          order_number,
          total,
          subtotal,
          tax,
          shipping,
          discount,
          status,
          payment_status,
          payment_method,
          address,
          created_at,
          updated_at,
          order_items (
            id,
            product_name,
            variant_name,
            quantity,
            price,
            total
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100) // Aumentar a 100 órdenes

      if (error) {
        console.error('Error fetching orders:', error)
        toast({ title: 'Error', description: 'No se pudieron cargar las órdenes: ' + error.message, variant: 'destructive' })
        return
      }

      console.log('Órdenes cargadas:', ordersData?.length || 0)

      // Mapeo de usuarios
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
        } else if (userError) {
          console.warn('Error fetching users:', userError)
        }
      }

      const processed = (ordersData || []).map((o) => ({
        ...o,
        user_name: userMap[o.user_id]?.name || 'Usuario desconocido',
        user_email: userMap[o.user_id]?.email || '',
        address: typeof o.address === 'string' ? JSON.parse(o.address) : o.address,
      })) as OrderRow[]

      setOrders(processed)
      console.log('Órdenes procesadas correctamente')
    } catch (error: any) {
      console.error('Error general:', error)
      toast({ title: 'Error', description: 'Error inesperado: ' + error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder({ ...selectedOrder, status })
    }
    toast({ title: 'Éxito', description: 'Estado actualizado correctamente' })
  }

  const updatePaymentStatus = async (id: string, paymentStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, payment_status: paymentStatus } : o)))
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder({ ...selectedOrder, payment_status: paymentStatus })
    }
    toast({ title: 'Éxito', description: 'Estado de pago actualizado correctamente' })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      partially_refunded: 'bg-orange-100 text-orange-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const viewOrderDetails = (order: OrderRow) => {
    setSelectedOrder(order)
    setShowDetails(true)
  }

  if (showDetails && selectedOrder) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">
            Detalles de Orden #{selectedOrder.order_number}
          </h1>
          <Button onClick={() => setShowDetails(false)} variant="outline">
            ← Volver a la lista
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{selectedOrder.user_name}</p>
                <p className="text-sm text-gray-600">{selectedOrder.user_email}</p>
              </div>
              <Separator />
              <div>
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Dirección de envío
                </p>
                <div className="text-sm space-y-1">
                  <p>{selectedOrder.address?.street}</p>
                  <p>{selectedOrder.address?.city}, {selectedOrder.address?.state}</p>
                  <p>{selectedOrder.address?.zip} - {selectedOrder.address?.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado y pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Estado y Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor={`order-status-${selectedOrder.id}`} className="text-sm font-medium mb-2 block">Estado de la orden</label>
                <select
                  id={`order-status-${selectedOrder.id}`}
                  value={selectedOrder.status}
                  onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="processing">Procesando</option>
                  <option value="shipped">Enviada</option>
                  <option value="delivered">Entregada</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="refunded">Reembolsada</option>
                </select>
              </div>
              
              <div>
                <label htmlFor={`payment-status-${selectedOrder.id}`} className="text-sm font-medium mb-2 block">Estado del pago</label>
                <select
                  id={`payment-status-${selectedOrder.id}`}
                  value={selectedOrder.payment_status}
                  onChange={(e) => updatePaymentStatus(selectedOrder.id, e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="failed">Fallido</option>
                  <option value="refunded">Reembolsado</option>
                  <option value="partially_refunded">Parcialmente reembolsado</option>
                </select>
              </div>

              <div>
                <p className="text-sm font-medium">Método de pago</p>
                <p className="text-sm text-gray-600 capitalize">{selectedOrder.payment_method}</p>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Creada</p>
                <p className="text-sm text-gray-600">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Última actualización</p>
                <p className="text-sm text-gray-600">{formatDate(selectedOrder.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Productos */}
        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedOrder.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-sm text-gray-600">{item.variant_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.total.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            {/* Totales */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento:</span>
                  <span>-${selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Impuestos:</span>
                <span>${selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío:</span>
                <span>${selectedOrder.shipping.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Gestión de Órdenes</h1>
        <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>
      
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Cargando órdenes...</p>
        </div>
      )}
      
      {!loading && orders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay órdenes registradas.</p>
          </CardContent>
        </Card>
      )}
      
      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-lg">
                        Orden #{order.order_number}
                      </h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge className={getPaymentStatusColor(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium">{order.user_name}</p>
                        <p className="text-gray-600">{order.user_email}</p>
                      </div>
                      <div>
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                        <p className="text-gray-600">{order.order_items.length} productos</p>
                      </div>
                      <div>
                        <p className="font-medium capitalize">{order.payment_method}</p>
                        <p className="text-gray-600">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="border rounded p-1 text-sm flex-1"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmada</option>
                          <option value="processing">Procesando</option>
                          <option value="shipped">Enviada</option>
                          <option value="delivered">Entregada</option>
                          <option value="cancelled">Cancelada</option>
                          <option value="refunded">Reembolsada</option>
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewOrderDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}