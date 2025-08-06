'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';

interface CheckoutStatusProps {
  readonly orderId: string | null;
  readonly pendingPayment: boolean;
  readonly error: string | null;
  readonly paymentType?: 'stripe' | 'paypal';
}

export default function CheckoutStatus({ orderId, pendingPayment, error, paymentType }: Readonly<CheckoutStatusProps>) {
  if (error) {
    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-red-800 font-medium">Error en el proceso</p>
        </div>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (orderId && !pendingPayment) {
    return (
      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-800 font-medium">
            Orden #{orderId} creada exitosamente
          </p>
        </div>
        <p className="text-green-700 text-sm mt-1">
          Procesando pago... Serás redirigido automáticamente.
        </p>
      </div>
    );
  }

  if (orderId && pendingPayment) {
    const paymentTypeDisplay = paymentType === 'paypal' ? 'PayPal' : 'tarjeta de crédito';
    const icon = paymentType === 'paypal' ? '💙' : '💳';
    
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <p className="text-blue-800 font-medium">
            {icon} Completar pago con {paymentTypeDisplay}
          </p>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          Tu orden #{orderId} ha sido creada. Completa el pago para confirmar tu pedido.
        </p>
      </div>
    );
  }

  return null;
}

export function CheckoutProgress({ currentStep }: Readonly<{ currentStep: 'address' | 'shipping' | 'payment' | 'confirmation' }>) {
  const steps = [
    { id: 'address', label: 'Dirección', icon: '📍' },
    { id: 'shipping', label: 'Envío', icon: '🚚' },
    { id: 'payment', label: 'Pago', icon: '💳' },
    { id: 'confirmation', label: 'Confirmación', icon: '✅' }
  ];

  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              index <= currentIndex 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              <span>{step.icon}</span>
              <span>{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-2 h-1 w-8 rounded ${
                index < currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
