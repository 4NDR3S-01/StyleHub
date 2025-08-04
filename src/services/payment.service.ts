import { loadStripe, Stripe } from '@stripe/stripe-js';
import type { CartItem } from '@/types';

// Inicializar Stripe en el cliente
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Stripe publishable key is not configured');
  }
  stripePromise ??= loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
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
   * Validar datos de entrada para checkout
   */
  static validateCheckoutData(data: CheckoutSessionData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.cartItems || data.cartItems.length === 0) {
      errors.push('El carrito está vacío');
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email inválido');
    }

    if (data.customerData?.name && data.customerData.name.trim().length < 2) {
      errors.push('Nombre del cliente inválido');
    }

    // Validar que todos los items tengan precio válido
    data.cartItems?.forEach((item, index) => {
      if (!item.product?.price || item.product.price <= 0) {
        errors.push(`Producto ${index + 1} tiene precio inválido`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Producto ${index + 1} tiene cantidad inválida`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Crear sesión de checkout de Stripe
   */
  static async createCheckoutSession(data: CheckoutSessionData) {
    try {
      // Validar datos de entrada
      const validation = this.validateCheckoutData(data);
      if (!validation.isValid) {
        throw new Error(`Datos de checkout inválidos: ${validation.errors.join(', ')}`);
      }

      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear sesión de checkout');
      }

      const session = await response.json();
      
      if (!session.id) {
        throw new Error('Respuesta inválida del servidor de pagos');
      }

      return session;
    } catch (error: any) {
      console.error('Payment service error:', error);
      throw new Error(error.message || 'Error al procesar pago');
    }
  }

  /**
   * Redirigir a Stripe Checkout
   */
  static async redirectToCheckout(sessionId: string) {
    try {
      if (!sessionId) {
        throw new Error('ID de sesión requerido');
      }

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
      console.error('Stripe redirect error:', error);
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
      console.error('Payment processing error:', error);
      throw new Error(error.message || 'Error al procesar pago');
    }
  }

  /**
   * Verificar estado de la sesión de checkout
   */
  static async verifyCheckoutSession(sessionId: string) {
    try {
      if (!sessionId) {
        throw new Error('ID de sesión requerido');
      }

      const response = await fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al verificar sesión');
      }

      const sessionData = await response.json();
      
      if (!sessionData.status) {
        throw new Error('Respuesta inválida del servidor de verificación');
      }

      return sessionData;
    } catch (error: any) {
      console.error('Session verification error:', error);
      throw new Error(error.message || 'Error al verificar pago');
    }
  }

  /**
   * Crear Payment Intent para pagos personalizados
   */
  static async createPaymentIntent(amount: number, currency: string = 'cop'): Promise<PaymentIntent> {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Monto inválido');
      }

      if (!currency || currency.length !== 3) {
        throw new Error('Moneda inválida');
      }

      const response = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Stripe usa centavos
          currency: currency.toLowerCase(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al crear payment intent');
      }

      const paymentIntent = await response.json();
      
      if (!paymentIntent.id || !paymentIntent.client_secret) {
        throw new Error('Respuesta inválida del servidor de payment intent');
      }

      return paymentIntent;
    } catch (error: any) {
      console.error('Payment intent error:', error);
      throw new Error(error.message || 'Error al crear intención de pago');
    }
  }

  /**
   * Confirmar Payment Intent
   */
  static async confirmPayment(clientSecret: string, paymentMethod: any) {
    try {
      if (!clientSecret) {
        throw new Error('Client secret requerido');
      }

      if (!paymentMethod) {
        throw new Error('Método de pago requerido');
      }

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
      console.error('Payment confirmation error:', error);
      throw new Error(error.message || 'Error al confirmar pago');
    }
  }

  /**
   * Calcular total del carrito con impuestos y envío
   */
  static calculateTotal(cartItems: CartItem[], taxRate: number = 0.16, shippingCost: number = 0) {
    if (!cartItems || cartItems.length === 0) {
      return {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
      };
    }

    const subtotal = cartItems.reduce(
      (sum, item) => {
        const itemPrice = item.product?.price || 0;
        const itemQuantity = item.quantity || 0;
        return sum + (itemPrice * itemQuantity);
      },
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
    if (!amount || isNaN(amount)) {
      return '0';
    }

    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
      }).format(amount);
    } catch (error) {
      console.error('Price formatting error:', error);
      return `$${amount.toFixed(0)}`;
    }
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

    // Validar número de tarjeta (Luhn algorithm)
    const cardNumber = cardData.number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardNumber)) {
      errors.push('Número de tarjeta inválido');
    } else {
      // Luhn algorithm validation
      let sum = 0;
      let shouldDouble = false;
      
      for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);
        
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
        
        sum += digit;
        shouldDouble = !shouldDouble;
      }
      
      if (sum % 10 !== 0) {
        errors.push('Número de tarjeta inválido');
      }
    }

    // Validar fecha de expiración
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(cardData.expiry)) {
      errors.push('Fecha de expiración inválida (MM/YY)');
    } else {
      const [month, year] = cardData.expiry.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      const now = new Date();
      if (expiry < now) {
        errors.push('La tarjeta ha expirado');
      }
    }

    // Validar CVC
    if (!/^\d{3,4}$/.test(cardData.cvc)) {
      errors.push('CVC inválido');
    }

    // Validar nombre
    if (!cardData.name || cardData.name.trim().length < 2) {
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

  /**
   * Sanitizar datos de pago
   */
  static sanitizePaymentData(data: any): any {
    const sanitized = { ...data };
    
    // Remover datos sensibles de logs
    if (sanitized.cardNumber) {
      sanitized.cardNumber = sanitized.cardNumber.replace(/\d(?=\d{4})/g, '*');
    }
    
    if (sanitized.cvc) {
      sanitized.cvc = '***';
    }
    
    return sanitized;
  }
}

export { getStripe };
export default PaymentService;
