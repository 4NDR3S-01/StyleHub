"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, Package, Truck, CheckCircle, Clock, Eye, Star, AlertCircle } from "lucide-react";
import { OrderService } from "@/services/order.service";
import { Order, OrderItem } from "@/types";

interface ExtendedOrder extends Omit<Order, 'address' | 'items'> {
  order_items: OrderItem[];
  address: string | { street: string; city: string; state: string; zip: string; country: string };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Cargar órdenes del usuario
  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);
        const ordersData = await OrderService.getUserOrders();
        setOrders(ordersData || []);
      } catch (error: any) {
        console.error('Error loading orders:', error);
        setError(error.message || 'Error al cargar los pedidos');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          label: 'Pendiente', 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock
        };
      case 'confirmed':
        return { 
          label: 'Confirmado', 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: CheckCircle
        };
      case 'processing':
        return { 
          label: 'Procesando', 
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: Package
        };
      case 'shipped':
        return { 
          label: 'Enviado', 
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Truck
        };
      case 'delivered':
        return { 
          label: 'Entregado', 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: Package
        };
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle
        };
      default:
        return { 
          label: 'Desconocido', 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock
        };
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 text-lg">Cargando tus pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar pedidos</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <ShoppingBag className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Mis Pedidos</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Revisa el estado de tus compras y el historial de pedidos
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
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

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Entregados</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.delivered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
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

        {/* Lista de Pedidos */}
        <div className="space-y-6">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              const orderNumber = generateOrderNumber(order.id, order.created_at || order.createdAt || '');
              const parsedAddress = parseAddress(order.address);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
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
                          <p className="text-gray-600">
                            Realizado el {formatDate(order.created_at || order.createdAt || '')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                          <StatusIcon className="h-4 w-4 mr-2" />
                          {statusInfo.label}
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          ${Number(order.total).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Productos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Productos ({order.order_items?.length || 0})</h4>
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
                                  Cantidad: {item.quantity} • ${Number(item.price).toFixed(2)}
                                  {item.variant && (
                                    <span className="block">
                                      Talla: {item.variant.size} • Color: {item.variant.color}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(order.order_items?.length || 0) > 3 && (
                            <p className="text-sm text-gray-500 text-center py-2">
                              +{(order.order_items?.length || 0) - 3} productos más
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Detalles de envío</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <Truck className="h-5 w-5 text-gray-600 mt-1" />
                            <div>
                              <p className="font-medium text-gray-900">Dirección</p>
                              <p className="text-gray-600 text-sm">
                                {parsedAddress.street && `${parsedAddress.street}, `}
                                {parsedAddress.city && `${parsedAddress.city}, `}
                                {parsedAddress.state && `${parsedAddress.state} `}
                                {parsedAddress.zip}
                                {parsedAddress.country && `, ${parsedAddress.country}`}
                              </p>
                              <p className="text-blue-600 text-sm mt-2">
                                Método de pago: {order.payment_method || order.paymentMethod || 'No especificado'}
                              </p>
                              {order.tracking_number && (
                                <p className="text-green-600 text-sm mt-1">
                                  Número de seguimiento: {order.tracking_number}
                                </p>
                              )}
                            </div>
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
            })
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {selectedFilter === "all" ? "No tienes pedidos" : `No tienes pedidos ${selectedFilter}`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedFilter === "all" 
                    ? "Cuando realices tu primera compra, aparecerá aquí."
                    : "Prueba cambiando los filtros o realizando una nueva compra."
                  }
                </p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Explorar productos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
