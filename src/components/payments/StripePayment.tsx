"use client"

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PaymentService } from '@/services/payment.service';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripePaymentFormProps {
  readonly orderId?: string; // Opcional para compatibilidad
  readonly clientSecret?: string; // Nuevo: para flujo ético
  readonly total: number;
  readonly customerEmail: string;
  readonly onSuccess: (paymentIntent: any) => void;
  readonly onError: (error: string) => void;
  readonly savePaymentMethod?: boolean;
  readonly userId?: string;
}

function StripePaymentForm({ 
  orderId,
  clientSecret: providedClientSecret,
  total, 
  customerEmail,
  onSuccess, 
  onError,
  savePaymentMethod = false,
  userId
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const createPaymentIntent = async () => {
    // Solo crear Payment Intent si no se proporcionó clientSecret (compatibilidad con flujo antiguo)
    if (!orderId) {
      throw new Error('orderId requerido para crear Payment Intent');
    }
    
    const response = await fetch('/api/create-stripe-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(total * 100), // Convertir a centavos
        currency: 'usd',
        orderId,
        customerEmail,
        savePaymentMethod,
        userId
      }),
    });

    const { clientSecret, error: backendError } = await response.json();

    if (backendError) {
      throw new Error(backendError);
    }

    return clientSecret;
  };

  const confirmStripePayment = async (clientSecret: string, cardElement: any) => {
    const { error: confirmError, paymentIntent } = await stripe!.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: customerEmail,
          },
        },
      }
    );

    if (confirmError) {
      throw new Error(confirmError.message);
    }

    return paymentIntent;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setPaymentError('Stripe no está disponible');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError('Elemento de tarjeta no encontrado');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      // Usar clientSecret proporcionado (flujo ético) o crear uno nuevo (compatibilidad)
      const clientSecret = providedClientSecret || await createPaymentIntent();
      const paymentIntent = await confirmStripePayment(clientSecret, cardElement);

      if (paymentIntent.status === 'succeeded') {
        if (savePaymentMethod && userId && paymentIntent.payment_method) {
          try {
            const paymentMethodId =
              typeof paymentIntent.payment_method === 'string'
                ? paymentIntent.payment_method
                : paymentIntent.payment_method.id;
            await saveStripePaymentMethod(paymentMethodId, userId);
          } catch (saveError) {
            console.warn('Error al guardar método de pago:', saveError);
          }
        }
        onSuccess(paymentIntent);
      } else {
        throw new Error('El pago no se completó correctamente');
      }
    } catch (error: any) {
      console.error('Error en el pago:', error);
      const errorMessage = error.message || 'Error al procesar el pago';
      setPaymentError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveStripePaymentMethod = async (paymentMethodId: string, userId: string) => {
    // Obtener detalles del método de pago desde Stripe
    const response = await fetch('/api/stripe/payment-method', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentMethodId }),
    });

    const paymentMethodData = await response.json();

    if (paymentMethodData.error) {
      throw new Error(paymentMethodData.error);
    }

    // Guardar en la base de datos
    await PaymentService.createUserPaymentMethod({
      user_id: userId,
      type: 'card',
      provider: 'stripe',
      external_id: paymentMethodId,
      card_last_four: paymentMethodData.card?.last4,
      card_brand: paymentMethodData.card?.brand,
      card_exp_month: paymentMethodData.card?.exp_month,
      card_exp_year: paymentMethodData.card?.exp_year,
      is_default: false,
      active: true,
    });
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-gray-50">
        <label htmlFor="card-element" className="block text-sm font-medium text-gray-700 mb-2">
          Información de la tarjeta
        </label>
        <div id="card-element" className="p-3 bg-white border rounded-md">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {savePaymentMethod && userId && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="save-payment-method"
            defaultChecked={false}
            className="text-blue-600"
          />
          <label htmlFor="save-payment-method" className="text-sm text-gray-700">
            Guardar este método de pago para futuras compras
          </label>
        </div>
      )}

      {paymentError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{paymentError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Procesando pago...
          </div>
        ) : (
          `Pagar ${total.toFixed(2)} USD`
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        🔒 Tu información está protegida con encriptación SSL
      </div>
    </form>
  );
}

interface StripePaymentProps {
  readonly orderId?: string; // Opcional para compatibilidad
  readonly clientSecret?: string; // Nuevo: para flujo ético
  readonly total: number;
  readonly customerEmail: string;
  readonly onSuccess: (paymentIntent: any) => void;
  readonly onError: (error: string) => void;
  readonly savePaymentMethod?: boolean;
  readonly userId?: string;
}

export default function StripePayment(props: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
}
