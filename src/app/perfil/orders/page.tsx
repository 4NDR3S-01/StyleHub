'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserOrders } from '@/services/order.service';
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  Eye, 
  Star, 
  XCircle, 
  Calendar, 
  CreditCard,
  Search,
  RefreshCw,
  MapPin,
  Filter,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';

// Tipos basados en tu esquema de base de datos
interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

interface Address {
  name: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  country: string;
}

interface Order {
  id: string;
  user_id: string;
  order_number: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  payment_method: 'stripe' | 'paypal';
  address: Address;
  shipping_address?: Address;
  billing_address?: Address;
  tracking_number?: string;
  tracking_url?: string;
  payment_intent_id?: string;
  stripe_session_id?: string;
  paypal_order_id?: string;
  notes?: string;
  estimated_delivery_date?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "total" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Cargar órdenes del usuario
  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Cargando órdenes del usuario...');
      const ordersData = await getUserOrders();
      
      // Transformar los datos para que coincidan con el esquema esperado
      const transformedOrders: Order[] = ordersData.map((order: any) => {
        // Parsear direcciones JSONB
        const parseAddress = (addr: any) => {
          if (!addr) return undefined;
          return typeof addr === 'string' ? JSON.parse(addr) : addr;
        };

        return {
          id: order.id,
          user_id: order.user_id,
          order_number: order.order_number,
          total: parseFloat(order.total) || 0,
          subtotal: parseFloat(order.subtotal) || 0,
          tax: parseFloat(order.tax) || 0,
          shipping: parseFloat(order.shipping) || 0,
          discount: parseFloat(order.discount) || 0,
          status: order.status,
          payment_status: order.payment_status,
          payment_method: order.payment_method,
          address: parseAddress(order.address),
          shipping_address: parseAddress(order.shipping_address),
          billing_address: parseAddress(order.billing_address),
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
          payment_intent_id: order.payment_intent_id,
          stripe_session_id: order.stripe_session_id,
          paypal_order_id: order.paypal_order_id,
          notes: order.notes,
          estimated_delivery_date: order.estimated_delivery_date,
          delivered_at: order.delivered_at,
          cancelled_at: order.cancelled_at,
          cancellation_reason: order.cancellation_reason,
          created_at: order.created_at,
          updated_at: order.updated_at,
          order_items: order.order_items?.map((item: any) => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name || item.product?.name || 'Producto sin nombre',
            variant_name: item.variant_name || item.variant?.name,
            color: item.color || item.variant?.color,
            size: item.size || item.variant?.size,
            quantity: parseInt(item.quantity) || 1,
            price: parseFloat(item.price) || 0,
            total: parseFloat(item.total) || parseFloat(item.price) * parseInt(item.quantity) || 0,
            created_at: item.created_at
          })) || []
        };
      });

      console.log(`Se cargaron ${transformedOrders.length} órdenes`);
      setOrders(transformedOrders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      
      // Manejo específico de errores
      if (error.message?.includes('Usuario no autenticado')) {
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (error.message?.includes('conexión') || error.message?.includes('network')) {
        toast.error('Problema de conexión. Verifica tu internet e intenta nuevamente.');
      } else {
        toast.error(error.message || 'Error al cargar las órdenes. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Funciones de utilidad
  const getStatusInfo = (status: Order['status']) => {
    const statusMap = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      processing: { label: 'Procesando', color: 'bg-purple-100 text-purple-800', icon: Package },
      shipped: { label: 'Enviado', color: 'bg-blue-100 text-blue-800', icon: Truck },
      delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
      refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800', icon: RotateCcw }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getPaymentStatusInfo = (status: Order['payment_status']) => {
    const statusMap = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
      failed: { label: 'Fallido', color: 'bg-red-100 text-red-800' },
      refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800' },
      partially_refunded: { label: 'Parcialmente Reembolsado', color: 'bg-orange-100 text-orange-800' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getPaymentMethodInfo = (method: Order['payment_method']) => {
    const methodMap = {
      stripe: { label: 'Tarjeta de Crédito/Débito', icon: '💳', color: 'text-blue-600' },
      paypal: { label: 'PayPal', icon: '💙', color: 'text-blue-600' }
    };
    return methodMap[method] || methodMap.stripe;
  };

  // Filtrado y ordenamiento
  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_items.some(item => 
          item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesFilter = selectedFilter === 'all' || order.status === selectedFilter;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'date':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Estadísticas
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    refunded: orders.filter(o => o.status === 'refunded').length
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="bg-white rounded-full p-6 mx-auto mb-6 w-24 h-24 shadow-lg">
              <ShoppingBag className="h-12 w-12 text-blue-600 mx-auto" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Mis Órdenes</h2>
            <p className="text-gray-600 mb-8 text-lg">Inicia sesión para ver el historial de tus compras</p>
            <Button
            onClick={() => {
              // Disparar evento para abrir el modal de login
              window.dispatchEvent(new CustomEvent('openAuthModal'))
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="relative">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <ShoppingBag className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Cargando tus órdenes...</p>
            <p className="mt-2 text-gray-500">Obteniendo el historial de compras</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Órdenes</h1>
              <p className="text-gray-600">
                {orderStats.total === 0 
                  ? 'No tienes órdenes aún' 
                  : (() => {
                      const orderText = orderStats.total === 1 ? 'orden' : 'órdenes';
                      return `Tienes ${orderStats.total} ${orderText} en total`;
                    })()
                }
              </p>
            </div>
            <Button 
              onClick={loadOrders} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>

          {/* Estadísticas */}
          {orderStats.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
                  <div className="text-sm text-gray-500">Pendientes</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">{orderStats.processing}</div>
                  <div className="text-sm text-gray-500">Procesando</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{orderStats.shipped}</div>
                  <div className="text-sm text-gray-500">Enviados</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
                  <div className="text-sm text-gray-500">Entregados</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{orderStats.confirmed}</div>
                  <div className="text-sm text-gray-500">Confirmados</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
                  <div className="text-sm text-gray-500">Cancelados</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-600">{orderStats.refunded}</div>
                  <div className="text-sm text-gray-500">Reembolsados</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros y búsqueda */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por número de orden o producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmados</option>
                <option value="processing">Procesando</option>
                <option value="shipped">Enviados</option>
                <option value="delivered">Entregados</option>
                <option value="cancelled">Cancelados</option>
                <option value="refunded">Reembolsados</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as "date" | "total" | "status");
                  setSortOrder(order as "asc" | "desc");
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date-desc">Más recientes</option>
                <option value="date-asc">Más antiguos</option>
                <option value="total-desc">Mayor monto</option>
                <option value="total-asc">Menor monto</option>
                <option value="status-asc">Estado A-Z</option>
                <option value="status-desc">Estado Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de órdenes */}
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm || selectedFilter !== 'all' 
                ? 'No se encontraron órdenes' 
                : 'No tienes órdenes aún'
              }
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedFilter !== 'all'
                ? 'Prueba cambiar los filtros de búsqueda'
                : 'Cuando realices tu primera compra, aparecerá aquí'
              }
            </p>
            {(!searchTerm && selectedFilter === 'all') && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Link href="/">Explorar productos</Link>
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const paymentStatusInfo = getPaymentStatusInfo(order.payment_status);
              const paymentMethodInfo = getPaymentMethodInfo(order.payment_method);
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg">
                          <StatusIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            Orden {order.order_number}
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('es-EC', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            ${order.total.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.order_items.reduce((sum, item) => sum + item.quantity, 0)} artículos
                          </div>
                        </div>
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {/* Información de productos */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-3">Productos</h4>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.product_name}</div>
                              {item.variant_name && (
                                <div className="text-sm text-gray-500">{item.variant_name}</div>
                              )}
                              {(item.color || item.size) && (
                                <div className="text-sm text-gray-500">
                                  {item.color && `Color: ${item.color}`}
                                  {item.color && item.size && ' • '}
                                  {item.size && `Talla: ${item.size}`}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${item.total.toFixed(2)}</div>
                              <div className="text-sm text-gray-500">
                                {item.quantity} × ${item.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Información de envío y pago */}
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* Dirección de envío */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Envío
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{order.address.name}</div>
                          <div>{order.address.address}</div>
                          <div>{order.address.city}, {order.address.state}</div>
                          <div>{order.address.zip_code}, {order.address.country}</div>
                          {order.address.phone && <div>{order.address.phone}</div>}
                        </div>
                      </div>

                      {/* Información de pago */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Pago
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span>{paymentMethodInfo.icon}</span>
                            <span className="text-gray-600">{paymentMethodInfo.label}</span>
                          </div>
                          <Badge className={paymentStatusInfo.color} variant="secondary">
                            {paymentStatusInfo.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Tracking */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Seguimiento
                        </h4>
                        {order.tracking_number ? (
                          <div className="space-y-2">
                            <div className="text-sm">
                              <div className="text-gray-500">Número de tracking:</div>
                              <div className="font-mono text-blue-600">{order.tracking_number}</div>
                            </div>
                            {order.tracking_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Rastrear
                                </a>
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing'
                              ? 'Se asignará cuando se envíe'
                              : 'No disponible'
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Resumen de costos */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subtotal:</span>
                          <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Envío:</span>
                          <span>${order.shipping.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Impuestos:</span>
                          <span>${order.tax.toFixed(2)}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Descuento:</span>
                            <span>-${order.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </Button>
                        {order.status === 'delivered' && (
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            Calificar
                          </Button>
                        )}
                        {(order.status === 'pending' || order.status === 'confirmed') && (
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Fechas importantes */}
                    {(order.estimated_delivery_date || order.delivered_at || order.cancelled_at) && (
                      <>
                        <Separator className="my-4" />
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          {order.estimated_delivery_date && !order.delivered_at && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Entrega estimada: {new Date(order.estimated_delivery_date).toLocaleDateString('es-EC')}
                              </span>
                            </div>
                          )}
                          {order.delivered_at && (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>
                                Entregado: {new Date(order.delivered_at).toLocaleDateString('es-EC')}
                              </span>
                            </div>
                          )}
                          {order.cancelled_at && (
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span>
                                Cancelado: {new Date(order.cancelled_at).toLocaleDateString('es-EC')}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
