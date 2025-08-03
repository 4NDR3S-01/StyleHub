'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserOrders, testSupabaseConnection } from '@/services/order.service';
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  Eye, 
  Star, 
  AlertCircle, 
  XCircle, 
  Calendar, 
  CreditCard 
} from 'lucide-react';
import { Order, OrderItem } from '@/types';
import Link from 'next/link';

interface ExtendedOrder extends Omit<Order, 'address' | 'items'> {
  order_items: OrderItem[];
  address: string | { street: string; city: string; state: string; zip: string; country: string };
}

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [debugMode, setDebugMode] = useState(false);

  // Función para ejecutar diagnóstico
  const runDiagnostic = async () => {
    console.log('Ejecutando diagnóstico...');
    setDebugMode(true);
    
    try {
      const testResult = await testSupabaseConnection();
      console.log('Resultado del diagnóstico:', testResult);
      
      if (testResult) {
        const issues = [];
        if (!testResult.auth) issues.push('Autenticación');
        if (!testResult.orders) issues.push('Tabla de órdenes');
        if (!testResult.orderItems) issues.push('Tabla de items de órdenes');
        if (!testResult.products) issues.push('Tabla de productos');
        
        if (issues.length > 0) {
          setError(`Problemas detectados en: ${issues.join(', ')}. Revisa la consola para más detalles.`);
        } else {
          setError('Todas las conexiones están funcionando. El error puede ser temporal.');
        }
      }
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      setError('Error al ejecutar diagnóstico: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    async function loadOrders() {
      // Si aún está cargando la autenticación, esperar
      if (authLoading) return;
      
      // Si no hay usuario, no hacer nada (se maneja en el render)
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Usuario autenticado:', user.id);
        console.log('Iniciando carga de órdenes...');
        
        const ordersData = await getUserOrders();
        console.log('Órdenes recibidas:', ordersData);
        
        // Verificar si ordersData es un array
        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
        } else {
          console.warn('Los datos de órdenes no son un array:', ordersData);
          setOrders([]);
        }
      } catch (error: any) {
        console.error('Error loading orders:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          code: error.code
        });
        
        // Manejo de errores más específico
        if (error.message?.includes('Usuario no autenticado')) {
          setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        } else if (error.message?.includes('connection')) {
          setError('Problema de conexión. Verifica tu internet e intenta nuevamente.');
        } else {
          setError(error.message || 'Error al cargar los pedidos. Intenta nuevamente.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user, authLoading]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      processing: { label: 'Procesando', color: 'bg-orange-100 text-orange-800', icon: Package },
      shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { label: 'Entregado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <IconComponent className="h-4 w-4 mr-2" />
        {config.label}
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredOrders = orders.filter(order => {
    if (selectedFilter === "all") return true;
    return order.status === selectedFilter;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  const parseAddress = (address: string | object) => {
    if (typeof address === 'string') {
      try {
        return JSON.parse(address);
      } catch {
        return { street: address, city: '', state: '', zip: '', country: '' };
      }
    }
    return address;
  };

  const generateOrderNumber = (orderId: string, createdAt: string) => {
    const date = new Date(createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const shortId = orderId.slice(-6).toUpperCase();
    return `STH-${year}${month}-${shortId}`;
  };

  // Si aún está cargando la autenticación, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 text-lg">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar mensaje de login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Inicia sesión para ver tus pedidos</h2>
            <p className="text-gray-600 mb-6">
              Necesitas estar autenticado para acceder a tu historial de pedidos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir al inicio
              </button>
              <button 
                onClick={() => {
                  console.log('Abrir modal de login');
                }}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar pedidos</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Intentar de nuevo
              </button>
              <button 
                onClick={runDiagnostic}
                disabled={debugMode}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {debugMode ? 'Ejecutando diagnóstico...' : 'Ejecutar diagnóstico'}
              </button>
            </div>
            {debugMode && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Modo diagnóstico activado.</strong> Revisa la consola del navegador (F12 → Console) para ver información detallada.
                </p>
                <button 
                  onClick={() => setDebugMode(false)}
                  className="text-sm text-yellow-700 underline"
                >
                  Ocultar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-blue-600" />
          Mis Pedidos
        </h1>
        <p className="text-gray-600 mt-2">Historial completo de tus compras</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enviados</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.shipped}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entregados</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Filtrar por estado</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { value: "all", label: "Todos" },
            { value: "pending", label: "Pendientes" },
            { value: "confirmed", label: "Confirmados" },
            { value: "processing", label: "Procesando" },
            { value: "shipped", label: "Enviados" },
            { value: "delivered", label: "Entregados" },
            { value: "cancelled", label: "Cancelados" }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedFilter === filter.value
                  ? "bg-blue-600 text-white shadow-lg transform scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedFilter === "all" ? "No tienes pedidos aún" : `No tienes pedidos ${selectedFilter}`}
          </h3>
          <p className="text-gray-600 mb-6">
            {selectedFilter === "all" 
              ? "Cuando realices tu primera compra, aparecerá aquí."
              : "Prueba cambiando los filtros o realizando una nueva compra."
            }
          </p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const orderNumber = generateOrderNumber(order.id, order.created_at || order.createdAt || '');
            const parsedAddress = parseAddress(order.address);

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  {/* Header del pedido */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                      <div className="p-3 rounded-full bg-blue-100">
                        <ShoppingBag className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Pedido #{orderNumber}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(order.created_at || order.createdAt || '')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {getStatusBadge(order.status)}
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(Number(order.total))}
                      </span>
                    </div>
                  </div>

                  {/* Contenido del pedido */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Productos ({order.order_items?.length || 0})
                      </h4>
                      <div className="space-y-3">
                        {order.order_items?.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <img
                              src={item.product?.images?.[0] || '/placeholder-image.jpg'}
                              alt={item.product?.name || 'Producto'}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                              }}
                            />
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{item.product?.name || 'Producto'}</h5>
                              <p className="text-gray-600 text-sm">
                                Cantidad: {item.quantity} • {formatPrice(Number(item.price))}
                                {item.variant && (
                                  <span className="block">
                                    Talla: {item.variant.size} • Color: {item.variant.color}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )) || (
                          <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                            No hay información detallada de productos disponible
                          </div>
                        )}
                        {(order.order_items?.length || 0) > 3 && (
                          <p className="text-sm text-gray-500 text-center py-2">
                            +{(order.order_items?.length || 0) - 3} productos más
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Información de envío y pago
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start space-x-3">
                            <Truck className="h-4 w-4 text-gray-600 mt-1" />
                            <div>
                              <p className="font-medium text-gray-900">Dirección</p>
                              <p className="text-gray-600">
                                {parsedAddress.street && `${parsedAddress.street}, `}
                                {parsedAddress.city && `${parsedAddress.city}, `}
                                {parsedAddress.state && `${parsedAddress.state} `}
                                {parsedAddress.zip}
                                {parsedAddress.country && `, ${parsedAddress.country}`}
                              </p>
                            </div>
                          </div>
                          <p className="text-blue-600">
                            Método de pago: {order.payment_method || order.paymentMethod || 'No especificado'}
                          </p>
                          {order.tracking_number && (
                            <p className="text-green-600">
                              Número de seguimiento: {order.tracking_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalles
                    </button>
                    {order.status === 'delivered' && (
                      <button className="flex items-center justify-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                        <Star className="h-4 w-4 mr-2" />
                        Calificar productos
                      </button>
                    )}
                    <button className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      Volver a comprar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
