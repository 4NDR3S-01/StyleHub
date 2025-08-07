"use client"

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient'
import { toast } from '@/hooks/use-toast'

interface OrderItem {
  id: string
  product_name: string
  variant_name?: string
  color?: string
  size?: string
  quantity: number
  price: number
  total: number
}

interface OrderDetails {
  id: string
  order_number: string
  user_id: string
  total: number
  subtotal: number
  tax: number
  shipping: number
  discount: number
  status: string
  payment_status: string
  payment_method: string
  payment_intent_id?: string
  address: any
  shipping_address?: any
  billing_address?: any
  tracking_number?: string
  tracking_url?: string
  notes?: string
  created_at: string
  updated_at: string
  user_name?: string
  user_email?: string
  user_phone?: string
  items: OrderItem[]
}

interface OrderDetailsModalProps {
  orderId: string
  isOpen: boolean
  onClose: () => void
}

export default function OrderDetailsModal({ orderId, isOpen, onClose }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails()
    }
  }, [isOpen, orderId])

  const fetchOrderDetails = async () => {
    setLoading(true)
    try {
      // Obtener datos de la orden
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // Obtener información del usuario
      let userData = null
      if (orderData.user_id) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('name, lastname, email, phone')
          .eq('id', orderData.user_id)
          .single()

        if (!userError && user) {
          userData = user
        }
      }

      // Obtener items de la orden
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (itemsError) throw itemsError

      // Combinar datos
      const orderDetails: OrderDetails = {
        ...orderData,
        user_name: userData ? `${userData.name} ${userData.lastname}`.trim() : 'Usuario desconocido',
        user_email: userData?.email || 'Email no disponible',
        user_phone: userData?.phone || 'Teléfono no disponible',
        items: itemsData || []
      }

      setOrder(orderDetails)
    } catch (error: any) {
      console.error('Error fetching order details:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los detalles de la orden',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-purple-100 text-purple-800'
      case 'shipped': return 'bg-indigo-100 text-indigo-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-orange-100 text-orange-800'
      case 'partially_refunded': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Detalles de la Orden
                </h3>
                {order && (
                  <p className="text-sm text-gray-500">
                    #{order.order_number} • {formatDate(order.created_at)}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando detalles...</span>
              </div>
            )}

            {!loading && order && (
              <div className="space-y-6">
                {/* Estados y información ética */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Estado de la Orden</h4>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Estado del Pago</h4>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Verificación Ética</h4>
                    {order.payment_status === 'paid' && order.payment_intent_id ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Ética
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ⚠️ Problemática
                      </span>
                    )}
                  </div>
                </div>

                {/* Información del cliente */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Información del Cliente</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Nombre:</span>
                      <span className="ml-2 text-gray-900">{order.user_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900">{order.user_email}</span>
                    </div>
                    {order.user_phone && (
                      <div>
                        <span className="text-gray-500">Teléfono:</span>
                        <span className="ml-2 text-gray-900">{order.user_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dirección de envío */}
                {order.address && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Dirección de Envío</h4>
                    <div className="text-sm text-gray-900">
                      <div>{order.address.name}</div>
                      <div>{order.address.street}</div>
                      <div>{order.address.city}, {order.address.state}</div>
                      <div>{order.address.postal_code}, {order.address.country}</div>
                      {order.address.phone && <div>Tel: {order.address.phone}</div>}
                    </div>
                  </div>
                )}

                {/* Items de la orden */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 p-4 border-b border-gray-200">
                    Productos ({order.items.length} items)
                  </h4>
                  <div className="divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <div key={item.id} className="p-4 flex justify-between items-center">
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-900">{item.product_name}</h5>
                          {item.variant_name && (
                            <p className="text-sm text-gray-500">{item.variant_name}</p>
                          )}
                          {(item.color || item.size) && (
                            <p className="text-xs text-gray-400">
                              {item.color && `Color: ${item.color}`}
                              {item.color && item.size && ' • '}
                              {item.size && `Talla: ${item.size}`}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900">
                            {item.quantity} × {formatCurrency(item.price)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen de costos */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Resumen de Costos</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal:</span>
                      <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Descuento:</span>
                        <span className="text-red-600">-{formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    {order.shipping > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Envío:</span>
                        <span className="text-gray-900">{formatCurrency(order.shipping)}</span>
                      </div>
                    )}
                    {order.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Impuestos:</span>
                        <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Información de pago */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Información de Pago</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Método:</span>
                      <span className="ml-2 text-gray-900 capitalize">{order.payment_method}</span>
                    </div>
                    {order.payment_intent_id && (
                      <div>
                        <span className="text-gray-500">Payment Intent:</span>
                        <span className="ml-2 text-gray-900 font-mono text-xs">{order.payment_intent_id}</span>
                      </div>
                    )}
                    {order.tracking_number && (
                      <div>
                        <span className="text-gray-500">Tracking:</span>
                        <span className="ml-2 text-gray-900">{order.tracking_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas */}
                {order.notes && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Notas</h4>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
