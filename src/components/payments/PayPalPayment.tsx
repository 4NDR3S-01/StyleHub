'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface PayPalPaymentProps {
  amount: number;
  currency?: string;
  orderId: string;
  checkoutData: any;
  onSuccess: (result: { orderId: string; transactionId: string }) => void;
  onError: (error: string) => void;
  savePaymentMethod?: boolean;
}

export default function PayPalPayment({
  amount,
  currency = 'USD',
  orderId,
  checkoutData,
  onSuccess,
  onError,
  savePaymentMethod = false
}: Readonly<PayPalPaymentProps>) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

  const savePayPalPaymentMethod = async (paymentData: any) => {
    if (!user || !savePaymentMethod) return;

    try {
      const response = await fetch('/api/payments/methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          type: 'paypal',
          provider: 'paypal',
          external_id: paymentData.id,
          paypal_email: paymentData.payer?.email_address || user.email,
          nickname: 'PayPal',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving payment method');
      }
    } catch (error: any) {
      console.error('Error saving PayPal payment method:', error);
      // No fallar el pago por esto, solo mostrar advertencia
      toast({
        title: 'Advertencia',
        description: 'El pago fue exitoso pero no se pudo guardar el método de pago',
        variant: 'default',
      });
    }
  };

  return (
    <div className="space-y-4">
      <PayPalScriptProvider options={{ 
        clientId, 
        currency,
        intent: 'capture'
      }}>
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <img
              src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
              alt="PayPal"
              className="w-8 h-8"
            />
            <span className="font-medium">PayPal</span>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Serás redirigido a PayPal para completar tu pago de forma segura.
            </p>
          </div>

          <PayPalButtons
            style={{ 
              layout: 'vertical', 
              color: 'blue',
              shape: 'rect',
              label: 'paypal',
              height: 40
            }}
            disabled={isProcessing}
            createOrder={(data, actions) => {
              return actions.order.create({
                intent: 'CAPTURE',
                purchase_units: [
                  {
                    description: `Pedido #${orderId}`,
                    amount: {
                      value: amount.toFixed(2),
                      currency_code: currency,
                    },
                  },
                ],
              });
            }}
            onApprove={async (data, actions) => {
              if (isProcessing) return;
              setIsProcessing(true);

              try {
                if (!actions.order) return;
                
                const details = await actions.order.capture();
                console.log('PayPal payment captured:', details);

                // Guardar método de pago si es necesario
                await savePayPalPaymentMethod(details);

                // Confirmar el pago en nuestro backend (igual que Stripe)
                const response = await fetch('/api/checkout/confirm-paypal-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    paymentData: {
                      transaction_id: details.id,
                      status: details.status,
                      amount: amount,
                      currency: currency,
                      payment_source: details.payment_source,
                    },
                    checkoutData,
                  }),
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                  throw new Error(result.error || 'Error al procesar el checkout');
                }

                toast({
                  title: 'Pago exitoso',
                  description: 'Tu pago con PayPal ha sido procesado correctamente',
                });

                // Llamar callback de éxito con la misma estructura que Stripe
                onSuccess({
                  orderId: result.orderId,
                  transactionId: result.transactionId
                });

              } catch (error: any) {
                console.error('Error capturing PayPal payment:', error);
                onError(error.message || 'Error al procesar el pago con PayPal');
                toast({
                  title: 'Error en el pago',
                  description: error.message || 'Error al procesar el pago con PayPal',
                  variant: 'destructive',
                });
              } finally {
                setIsProcessing(false);
              }
            }}
            onCancel={() => {
              toast({
                title: 'Pago cancelado',
                description: 'Has cancelado el pago con PayPal',
                variant: 'destructive',
              });
            }}
            onError={(err) => {
              console.error('PayPal error:', err);
              onError('Error en el procesamiento del pago con PayPal');
            }}
          />
        </div>
      </PayPalScriptProvider>

      <div className="text-xs text-gray-500 text-center">
        <p>Tu información financiera está protegida con la tecnología de PayPal</p>
      </div>
    </div>
  );
}