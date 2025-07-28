'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { CheckoutFormSimple } from '@/components/checkout/CheckoutFormSimple';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { ProtectedCheckout } from '@/components/checkout/ProtectedCheckout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutPage() {
  const router = useRouter();
  const { state } = useCart();
  const { user } = useAuth();

  // Redirigir si el carrito está vacío
  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Carrito Vacío</h2>
            <p className="text-gray-600 mb-6">
              No tienes productos en tu carrito para proceder al pago.
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              Continuar Comprando
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProtectedCheckout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-2">
              Completa tu compra de forma segura
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulario de pago */}
            <div className="lg:col-span-7">
              <CheckoutFormSimple
                user={user}
                cartItems={state.items}
              />
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-5">
              <div className="sticky top-8">
                <OrderSummary
                  items={state.items}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedCheckout>
  );
}
