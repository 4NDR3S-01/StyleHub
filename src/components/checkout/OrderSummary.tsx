'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Truck, ShieldCheck } from 'lucide-react';
import { CartItem } from '@/types';
import Image from 'next/image';

interface OrderSummaryProps {
  items: CartItem[];
  isProcessing?: boolean;
}

export function OrderSummary({ items, isProcessing = false }: OrderSummaryProps) {
  // Cálculos
  const subtotal = items.reduce((sum, item) => sum + (item.producto.price * item.quantity), 0);
  const shipping = subtotal > 200000 ? 0 : 15000; // Envío gratis por compras mayores a $200,000
  const tax = subtotal * 0.19; // IVA del 19%
  const total = subtotal + shipping + tax;

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle>Resumen del Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de productos */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {items.map((item, index) => (
            <div key={`${item.producto.id}-${item.size}-${item.color}-${index}`} className="flex gap-3">
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                <Image
                  src={item.producto.images[0]}
                  alt={item.producto.name}
                  fill
                  className="object-cover"
                />
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs flex items-center justify-center"
                >
                  {item.quantity}
                </Badge>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">
                  {item.producto.name}
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Talla: {item.size}</p>
                  <p>Color: {item.color}</p>
                </div>
                <p className="font-semibold text-sm mt-1">
                  ${(item.producto.price * item.quantity).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Cálculos del pedido */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal ({items.length} producto{items.length !== 1 ? 's' : ''})</span>
            <span>${subtotal.toLocaleString('es-CO')}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Truck className="h-4 w-4" />
              Envío
              {shipping === 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  Gratis
                </Badge>
              )}
            </span>
            <span>
              {shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-CO')}`}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>IVA (19%)</span>
            <span>${tax.toLocaleString('es-CO')}</span>
          </div>
          
          {subtotal < 200000 && shipping > 0 && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              💡 Agrega ${(200000 - subtotal).toLocaleString('es-CO')} más para envío gratis
            </div>
          )}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>${total.toLocaleString('es-CO')}</span>
        </div>

        {/* Información de seguridad */}
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Pago Seguro</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Tu información está protegida con encriptación SSL
          </p>
        </div>

        {/* Información de envío */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <Truck className="h-4 w-4" />
            <span className="font-medium">Información de Envío</span>
          </div>
          <ul className="text-xs text-blue-600 mt-1 space-y-1">
            <li>• Entrega en 2-5 días hábiles</li>
            <li>• Envío gratis por compras superiores a $200,000</li>
            <li>• Seguimiento incluido</li>
          </ul>
        </div>

        {/* Políticas */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>Al continuar, aceptas nuestros <a href="/terminos" className="text-blue-600 hover:underline">Términos de Servicio</a> y <a href="/privacidad" className="text-blue-600 hover:underline">Política de Privacidad</a>.</p>
          <p>Política de devoluciones de 30 días.</p>
        </div>

        {isProcessing && (
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-700 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
              <span>Procesando tu pago...</span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              No cierres esta ventana
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
