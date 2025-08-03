'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';

export function PaymentMethods() {
  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Tarjeta de Crédito/Débito',
      description: 'Visa, Mastercard, American Express - Procesado por Stripe',
      icon: CreditCard,
      available: true,
      recommended: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pago rápido y seguro con PayPal',
      icon: CreditCard,
      available: true,
      recommended: false
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métodos de Pago Disponibles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <div
                key={method.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  method.available
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    method.available ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`h-4 w-4 ${
                      method.available ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className={`font-medium ${
                      method.available ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {method.name}
                    </h4>
                    <p className={`text-sm ${
                      method.available ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {method.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {method.recommended && (
                    <Badge variant="secondary" className="text-xs">
                      Recomendado
                    </Badge>
                  )}
                  <Badge 
                    variant={method.available ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {method.available ? 'Disponible' : 'Próximamente'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> Aceptamos pagos con tarjetas de crédito/débito a través de Stripe y PayPal. 
            Ambos métodos garantizan transacciones seguras y rápidas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
