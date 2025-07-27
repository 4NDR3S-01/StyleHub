'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Truck, Home, AlertCircle } from 'lucide-react';
import { OrderService, Order } from '@/services/order.service';

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('ID de orden no encontrado');
        setLoading(false);
        return;
      }

      try {
        const orderData = await OrderService.getOrderById(orderId);
        if (!orderData) {
          setError('Orden no encontrada');
        } else {
          setOrder(orderData);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Error al cargar la información de la orden');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de la orden...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Error
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              {error || 'No se pudo cargar la información de la orden'}
            </p>

            <Button onClick={() => router.push('/')}>
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pedido Confirmado!
          </h1>
          
          <p className="text-lg text-gray-600">
            Gracias por tu compra. Tu pedido ha sido procesado exitosamente.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Detalles del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Número de Pedido</p>
                  <p className="font-semibold">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-gray-600">Fecha</p>
                  <p className="font-semibold">{new Date(order.created_at).toLocaleDateString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Estado</p>
                  <p className="font-semibold text-green-600 capitalize">{order.status}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="font-semibold">${order.total.toLocaleString('es-CO')}</p>
                </div>
              </div>
            </div>

            {/* Información de envío */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Información de Envío</h3>
              <div className="text-sm text-gray-600">
                <p>{order.shipping_info.firstName} {order.shipping_info.lastName}</p>
                <p>{order.shipping_info.address}</p>
                <p>{order.shipping_info.city}, {order.shipping_info.state} {order.shipping_info.zipCode}</p>
                <p>{order.shipping_info.country}</p>
                <p>Tel: {order.shipping_info.phone}</p>
              </div>
            </div>

            {/* Resumen de productos */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Productos ({order.items.length})</h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.producto.name} - {item.size} / {item.color} x{item.quantity}
                    </span>
                    <span>${(item.producto.price * item.quantity).toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t mt-2 pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span>{order.shipping_cost === 0 ? 'Gratis' : `$${order.shipping_cost.toLocaleString('es-CO')}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA:</span>
                  <span>${order.tax.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${order.total.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">¿Qué sigue?</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Preparación del Pedido</h4>
                    <p className="text-sm text-gray-600">
                      Estamos preparando tu pedido en nuestro almacén. 
                      Recibirás una notificación cuando esté listo para envío.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Envío</h4>
                    <p className="text-sm text-gray-600">
                      Tu pedido será enviado en 1-2 días hábiles. 
                      Te enviaremos el número de seguimiento por email.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Home className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Entrega</h4>
                    <p className="text-sm text-gray-600">
                      Recibirás tu pedido en 2-5 días hábiles en la dirección proporcionada.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Se ha enviado un email de confirmación a {order.shipping_info.email}.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push('/')} variant="outline">
              Continuar Comprando
            </Button>
            <Button onClick={() => router.push('/perfil')}>
              Ver Mi Perfil
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            ¿Necesitas ayuda? <a href="/contacto" className="text-blue-600 hover:underline">Contacta nuestro soporte</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
