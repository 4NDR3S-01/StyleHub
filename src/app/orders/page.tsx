'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserOrders } from '@/services/order.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  Eye,
  Calendar,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { Order } from '@/types';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const userOrders = await getUserOrders();
      setOrders(userOrders);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', variant: 'secondary', icon: Clock },
      confirmed: { label: 'Confirmado', variant: 'default', icon: CheckCircle },
      processing: { label: 'Procesando', variant: 'default', icon: Package },
      shipped: { label: 'Enviado', variant: 'default', icon: Truck },
      delivered: { label: 'Entregado', variant: 'default', icon: CheckCircle },
      cancelled: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <IconComponent size={12} />
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tus órdenes</p>
              <Link href="/">
                <Button>Ir al inicio</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadOrders} variant="outline">
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mis Órdenes</h1>
        <p className="text-gray-600 mt-2">Historial completo de tus compras</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tienes órdenes aún
              </h3>
              <p className="text-gray-600 mb-6">
                Cuando realices tu primera compra, aparecerá aquí
              </p>
              <Link href="/category/all">
                <Button>Explorar productos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Orden #{order.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>{formatDate(order.created_at || order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <p className="text-lg font-semibold mt-2">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Package size={16} />
                      Productos
                    </h4>
                    <div className="space-y-2">
                      {order.order_items?.map((item, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <span className="font-medium">{item.product?.name || 'Producto'}</span>
                          {item.color && item.size && (
                            <span className="ml-2">({item.color}, {item.size})</span>
                          )}
                          <span className="ml-2">x{item.quantity}</span>
                        </div>
                      )) || (
                        <div className="text-sm text-gray-600">
                          {order.items?.map((item, index) => (
                            <div key={index}>
                              <span className="font-medium">{item.producto.name}</span>
                              <span className="ml-2">{item.variant ? `(${item.variant.color}, ${item.variant.size})` : ''}</span>
                              <span className="ml-2">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CreditCard size={16} />
                      Información de pago
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Método: {order.payment_method || order.paymentMethod}</p>
                      {order.tracking_number || order.trackingNumber ? (
                        <p>Tracking: {order.tracking_number || order.trackingNumber}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <p>Total: <span className="font-semibold">{formatPrice(order.total)}</span></p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/orders/${order.id}`}>
                      <Eye size={16} className="mr-2" />
                      Ver detalles
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
