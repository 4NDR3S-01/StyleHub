'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone } from 'lucide-react';

interface PaymentMethodSelectionProps {
  onPaymentMethodSelect: (method: 'stripe' | 'paypal') => void;
  selectedMethod?: 'stripe' | 'paypal';
  isProcessing?: boolean;
}

export default function PaymentMethodSelection({ 
  onPaymentMethodSelect, 
  selectedMethod,
  isProcessing = false 
}: PaymentMethodSelectionProps) {
  const [activeMethod, setActiveMethod] = useState<'stripe' | 'paypal' | null>(selectedMethod || null);

  const handleMethodSelect = (method: 'stripe' | 'paypal') => {
    setActiveMethod(method);
    onPaymentMethodSelect(method);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Método de Pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stripe Payment */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            activeMethod === 'stripe' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => !isProcessing && handleMethodSelect('stripe')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Tarjeta de Crédito/Débito</h3>
                <p className="text-sm text-gray-600">Visa, Mastercard, American Express</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Seguro SSL
              </Badge>
              {activeMethod === 'stripe' && (
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>
          </div>
          
          {activeMethod === 'stripe' && (
            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
              <p className="text-sm text-blue-700">
                🔒 Serás redirigido a Stripe para completar tu pago de forma segura. 
                Tus datos de tarjeta no se almacenan en este sitio.
              </p>
            </div>
          )}
        </div>

        {/* PayPal Payment */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            activeMethod === 'paypal' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => !isProcessing && handleMethodSelect('paypal')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">PayPal</h3>
                <p className="text-sm text-gray-600">Paga con tu cuenta de PayPal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Protección del Comprador
              </Badge>
              {activeMethod === 'paypal' && (
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>
          </div>
          
          {activeMethod === 'paypal' && (
            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
              <p className="text-sm text-blue-700">
                🔒 Serás redirigido a PayPal para completar tu pago de forma segura. 
                Utiliza tu cuenta de PayPal o paga como invitado.
              </p>
            </div>
          )}
        </div>

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
                `Continuar con ${activeMethod === 'stripe' ? 'Tarjeta' : 'PayPal'}`
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
