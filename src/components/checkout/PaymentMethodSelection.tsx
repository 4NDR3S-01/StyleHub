'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone } from 'lucide-react';

interface PaymentMethodSelectionProps {
  readonly onPaymentMethodSelect: (method: 'stripe' | 'paypal') => void;
  readonly selectedMethod?: 'stripe' | 'paypal';
  readonly isProcessing?: boolean;
}


export default function PaymentMethodSelection({ 
  onPaymentMethodSelect, 
  selectedMethod,
  isProcessing = false 
}: Readonly<PaymentMethodSelectionProps>) {
  const [activeMethod, setActiveMethod] = useState<'stripe' | 'paypal' | null>(selectedMethod || null);

  const handleMethodSelect = (method: 'stripe' | 'paypal') => {
    setActiveMethod(method);
    onPaymentMethodSelect(method);
  };

  const renderPaymentOption = (
    method: 'stripe' | 'paypal',
    icon: React.ReactNode,
    title: string,
    description: string,
    badge: string,
    info: string,
    bgColor: string
  ) => (
    <button
      type="button"
      className={`border rounded-lg p-4 w-full text-left transition-all ${
        activeMethod === method
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => !isProcessing && handleMethodSelect(method)}
      aria-label={`Seleccionar método de pago ${title}`}
      disabled={isProcessing}
      onKeyDown={e => {
        if (!isProcessing && (e.key === 'Enter' || e.key === ' ')) handleMethodSelect(method);
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
          {activeMethod === method && (
            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </div>
      </div>
      {activeMethod === method && (
        <div className="mt-3 p-3 bg-white rounded border border-blue-200">
          <p className="text-sm text-blue-700">
            {info}
          </p>
        </div>
      )}
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" aria-label="Tarjeta de crédito o débito" />
          Método de Pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderPaymentOption(
          'stripe',
          <CreditCard className="h-5 w-5 text-white" aria-label="Tarjeta de crédito o débito" />, 
          'Tarjeta de Crédito/Débito',
          'Visa, Mastercard, American Express',
          'Seguro SSL',
          '🔒 Serás redirigido a Stripe para completar tu pago de forma segura. Tus datos de tarjeta no se almacenan en este sitio.',
          'bg-blue-600'
        )}
        {renderPaymentOption(
          'paypal',
          <Smartphone className="h-5 w-5 text-white" aria-label="PayPal" />, 
          'PayPal',
          'Paga con tu cuenta de PayPal',
          'Protección del Comprador',
          '🔒 Serás redirigido a PayPal para completar tu pago de forma segura. Utiliza tu cuenta de PayPal o paga como invitado.',
          'bg-blue-500'
        )}
        {/* Información de seguridad */}
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <span className="font-medium">🛡️ Todos los pagos son seguros</span>
          </div>
          <ul className="text-xs text-green-600 mt-1 space-y-1">
            <li>• Encriptación SSL de 256 bits</li>
            <li>• Tus datos de pago nunca se almacenan en nuestros servidores</li>
            <li>• Certificación PCI DSS Nivel 1</li>
          </ul>
        </div>
        {/* Botón de confirmación si hay método seleccionado */}
        {activeMethod && (
          <div className="pt-4">
            <Button 
              className="w-full" 
              size="lg"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Procesando...
                </div>
              ) : (
                (() => {
                  const label = activeMethod === 'stripe' ? 'Tarjeta' : 'PayPal';
                  return `Continuar con ${label}`;
                })()
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
