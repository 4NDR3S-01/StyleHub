'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import StripePayment from '@/components/payments/StripePayment';
import PayPalPayment from '@/components/payments/PayPalPayment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Wallet } from 'lucide-react';

export default function AddPaymentMethodPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const paymentType = searchParams.get('payment_type') || 'card';
  const returnTo = searchParams.get('return_to') || '/perfil/payment-methods';

  // Crear una orden temporal mínima para el proceso de agregar método de pago
  const tempOrderId = `temp_${Date.now()}`;
  const minAmount = 1.00; // Monto mínimo para validar la tarjeta

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // El método de pago ya fue guardado por el componente de pago
      // Solo necesitamos redirigir de vuelta
      router.push(returnTo);
    } catch (error) {
      console.error('Error after payment success:', error);
      // Aún así redirigir, ya que el pago fue exitoso
      router.push(returnTo);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Mostrar error pero mantener al usuario en la página para reintentar
  };

  const handleCancel = () => {
    router.push(returnTo);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso requerido</h1>
          <p className="text-gray-600">Debes iniciar sesión para agregar métodos de pago.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a métodos de pago
        </Button>
        
        <h1 className="text-3xl font-bold">Agregar Método de Pago</h1>
        <p className="text-gray-600 mt-2">
          Agrega un nuevo método de pago de forma segura
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {paymentType === 'card' ? (
              <>
                <CreditCard className="h-5 w-5" />
                Agregar Tarjeta de Crédito/Débito
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5" />
                Agregar PayPal
              </>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {paymentType === 'card' ? (
            <StripePayment
              orderId={tempOrderId}
              total={minAmount}
              customerEmail={user.email || ''}
              userId={user.id}
              savePaymentMethod={true}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          ) : (
            <PayPalPayment
              orderId={tempOrderId}
              amount={minAmount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              savePaymentMethod={true}
            />
          )}
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">🔒 Seguridad garantizada:</span>
              <span>No se realizará ningún cargo. Solo validamos tu método de pago.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
