import { loadStripe, Stripe } from '@stripe/stripe-js';
import type { CartItem } from '@/types';

// Inicializar Stripe en el cliente
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
  stripePromise ??= loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  return stripePromise;
};

export interface CheckoutSessionData {
  cartItems: CartItem[];
  email: string;
  userId?: string;
  customerData?: {
    name: string;
    phone?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  metadata?: Record<string, string>;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export class PaymentService {
  /**
   * Crear sesión de checkout de Stripe
   */
  static async createCheckoutSession(data: CheckoutSessionData) {
    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al crear sesión de checkout');
      }

      const session = await response.json();
      return session;
    } catch (error: any) {
      throw new Error(error.message || 'Error al procesar pago');
    }
  }

  /**
   * Redirigir a Stripe Checkout
   */
  static async redirectToCheckout(sessionId: string) {
    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Error al cargar Stripe');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al redirigir a checkout');
    }
  }

  /**
   * Procesar pago completo (crear sesión y redirigir)
   */
  static async processPayment(data: CheckoutSessionData) {
    try {
      // Crear sesión de checkout
      const session = await this.createCheckoutSession(data);
      
      // Redirigir a Stripe Checkout
      await this.redirectToCheckout(session.id);
      
      return session;
    } catch (error: any) {
      throw new Error(error.message || 'Error al procesar pago');
    }
  }

  /**
   * Verificar estado de la sesión de checkout
   */
  static async verifyCheckoutSession(sessionId: string) {
    try {
      const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Error al verificar sesión');
      }

      const sessionData = await response.json();
      return sessionData;
    } catch (error: any) {
      throw new Error(error.message || 'Error al verificar pago');
    }
  }

  /**
   * Crear Payment Intent para pagos personalizados
   */
  static async createPaymentIntent(amount: number, currency: string = 'cop'): Promise<PaymentIntent> {
    try {
      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Stripe usa centavos
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear payment intent');
      }

      const paymentIntent = await response.json();
      return paymentIntent;
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear intención de pago');
    }
  }

  /**
   * Confirmar Payment Intent
   */
  static async confirmPayment(clientSecret: string, paymentMethod: any) {
    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Error al cargar Stripe');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod,
      });

      if (error) {
        throw error;
      }

      return paymentIntent;
    } catch (error: any) {
      throw new Error(error.message || 'Error al confirmar pago');
    }
  }

  /**
   * Calcular total del carrito con impuestos y envío
   */
  static calculateTotal(cartItems: CartItem[], taxRate: number = 0.16, shippingCost: number = 0) {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.producto.price * item.quantity),
      0
    );
    
    const tax = subtotal * taxRate;
    const total = subtotal + tax + shippingCost;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      shipping: shippingCost,
      total: Number(total.toFixed(2)),
    };
  }

  /**
   * Formatear precio para mostrar
   */
  static formatPrice(amount: number, currency: string = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Validar datos de tarjeta
   */
  static validateCardData(cardData: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar número de tarjeta (simplified)
    const cardNumber = cardData.number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardNumber)) {
      errors.push('Número de tarjeta inválido');
    }

    // Validar fecha de expiración
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(cardData.expiry)) {
      errors.push('Fecha de expiración inválida (MM/YY)');
    } else {
      const [month, year] = cardData.expiry.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expiry < new Date()) {
        errors.push('La tarjeta ha expirado');
      }
    }

    // Validar CVC
    if (!/^\d{3,4}$/.test(cardData.cvc)) {
      errors.push('CVC inválido');
    }

    // Validar nombre
    if (cardData.name.trim().length < 2) {
      errors.push('Nombre del titular requerido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Obtener métodos de pago disponibles
   */
  static getAvailablePaymentMethods() {
    return [
      {
        id: 'card',
        name: 'Tarjeta de Crédito/Débito',
        description: 'Visa, Mastercard, American Express',
        icon: '💳',
        enabled: true,
      },
      {
        id: 'pse',
        name: 'PSE',
        description: 'Débito a cuentas de ahorros y corriente',
        icon: '🏦',
        enabled: false, // Habilitado en versiones futuras
      },
      {
        id: 'nequi',
        name: 'Nequi',
        description: 'Pago con billetera digital Nequi',
        icon: '📱',
        enabled: false, // Habilitado en versiones futuras
      },
    ];
  }

  /**
   * Obtener información de la moneda
   */
  static getCurrencyInfo(currency: string = 'COP') {
    const currencies = {
      COP: { symbol: '$', name: 'Peso Colombiano', decimals: 0 },
      USD: { symbol: '$', name: 'Dólar Americano', decimals: 2 },
      EUR: { symbol: '€', name: 'Euro', decimals: 2 },
    };

    return currencies[currency as keyof typeof currencies] || currencies.COP;
  }
}

export { getStripe };
export default PaymentService;
