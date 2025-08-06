'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Home } from 'lucide-react';

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            ¡Orden Confirmada!
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Gracias por tu compra. Hemos recibido tu orden exitosamente.
          </p>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Detalles de la Orden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessionId && (
                <div>
                  <p className="text-sm text-gray-600">ID de Sesión de Pago:</p>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {sessionId}
                  </p>
                </div>
              )}
              {orderId && (
                <div>
                  <p className="text-sm text-gray-600">Número de Orden:</p>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {orderId}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Estado:</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Confirmada
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>¿Qué sigue?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                    <span className="text-sm font-medium text-blue-600">1</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Procesamiento
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Estamos preparando tu orden para el envío.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100">
                    <span className="text-sm font-medium text-gray-600">2</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Envío
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Te notificaremos cuando tu orden sea enviada con información de seguimiento.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100">
                    <span className="text-sm font-medium text-gray-600">3</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Entrega
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Tu orden llegará en 3-7 días hábiles.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => router.push('/perfil')}
            variant="outline"
          >
            Ver Mis Órdenes
          </Button>
          <Button 
            onClick={() => router.push('/')}
            className="flex items-center"
          >
            <Home className="mr-2 h-4 w-4" />
            Volver a la Tienda
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Si tienes alguna pregunta sobre tu orden, contáctanos en{' '}
            <a href="mailto:soporte@stylehub.com" className="text-blue-600 hover:underline">
              soporte@stylehub.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
