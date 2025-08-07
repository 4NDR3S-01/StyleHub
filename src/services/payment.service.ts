import { loadStripe, Stripe } from '@stripe/stripe-js';
import type { CartItem } from '@/context/CartContext';

// ============================================================================
// FACTORY METHOD PATTERN - PAYMENT PROCESSORS
// ============================================================================

/**
 * Interfaz común para todos los procesadores de pago
 */
interface PaymentProcessor {
  processCheckout(data: CheckoutSessionData): Promise<PaymentResult>;
  validatePaymentData(data: any): boolean;
  getPaymentMethods(): PaymentMethodInfo[];
}

/**
 * Resultado estándar de procesamiento de pago
 */
interface PaymentResult {
  success: boolean;
  sessionId?: string;
  sessionUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Información de métodos de pago disponibles
 */
interface PaymentMethodInfo {
  id: string;
  name: string;
  description: string;
  fees: number;
  supportedCurrencies: string[];
}

/**
 * Procesador de pagos con Stripe
 */
const stripePromiseInstance: Promise<Stripe | null> = (() => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Stripe publishable key is not configured');
  }
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
})();

class StripePaymentProcessor implements PaymentProcessor {
  private readonly stripePromise: Promise<Stripe | null>;

  constructor() {
    this.stripePromise = stripePromiseInstance;
  }

  async processCheckout(data: CheckoutSessionData): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: data.cartItems,
          email: data.email,
          customerData: data.customerData,
          userId: data.userId,
          metadata: data.metadata
        }),
      });

      const session = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: session.error || 'Error creating Stripe session'
        };
      }

      return {
        success: true,
        sessionId: session.id,
        sessionUrl: session.url,
        metadata: { processor: 'stripe' }
      };
    } catch (error) {
      return {
        success: false,
        error: `Stripe payment failed: ${error}`
      };
    }
  }

  validatePaymentData(data: CheckoutSessionData): boolean {
    return !!(data.cartItems?.length && data.email);
  }

  getPaymentMethods(): PaymentMethodInfo[] {
    return [
      {
        id: 'stripe_card',
        name: 'Tarjeta de Crédito/Débito',
        description: 'Visa, Mastercard, American Express',
        fees: 2.9,
        supportedCurrencies: ['USD', 'EUR', 'COP']
      }
    ];
  }
}

/**
 * Procesador de pagos con PayPal
 */
class PayPalPaymentProcessor implements PaymentProcessor {
  async processCheckout(data: CheckoutSessionData): Promise<PaymentResult> {
    try {
      // Llamar a la API de PayPal para crear orden
      const response = await fetch('/api/payments/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: data.cartItems.reduce((sum, item) => sum + (item.producto.price * item.quantity), 0),
          currency: 'USD',
          order_id: `order_${Date.now()}`,
          email: data.email,
          customer_data: data.customerData
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Error creating PayPal order'
        };
      }

      return {
        success: true,
        sessionId: result.order_id,
        sessionUrl: result.approval_url,
        metadata: { processor: 'paypal' }
      };
    } catch (error) {
      return {
        success: false,
        error: `PayPal payment failed: ${error}`
      };
    }
  }

  validatePaymentData(data: CheckoutSessionData): boolean {
    return !!(data.cartItems?.length && data.email);
  }

  getPaymentMethods(): PaymentMethodInfo[] {
    return [
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Paga con tu cuenta de PayPal',
        fees: 3.4,
        supportedCurrencies: ['USD', 'EUR', 'COP']
      }
    ];
  }
}

/**
 * Factory para crear procesadores de pago
 */
class PaymentProcessorFactory {
  static createProcessor(type: 'stripe' | 'paypal'): PaymentProcessor {
    switch (type) {
      case 'stripe':
        return new StripePaymentProcessor();
      case 'paypal':
        return new PayPalPaymentProcessor();
      default:
        throw new Error(`Unsupported payment processor type: ${type}`);
    }
  }

  static getAvailableProcessors(): ('stripe' | 'paypal')[] {
    return ['stripe', 'paypal'];
  }
}

// Mantener compatibilidad con código existente
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
   * FACTORY METHOD PATTERN: Crear sesión de checkout usando el procesador especificado
   */
  static async createCheckoutSession(
    data: CheckoutSessionData, 
    processorType: 'stripe' | 'paypal' = 'stripe'
  ): Promise<PaymentResult> {
    try {
      // Validar datos primero
      const validation = PaymentService.validateCheckoutData(data);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Usar Factory Method para crear el procesador apropiado
      const processor = PaymentProcessorFactory.createProcessor(processorType);
      
      // Validar datos específicos del procesador
      if (!processor.validatePaymentData(data)) {
        return {
          success: false,
          error: 'Invalid payment data for selected processor'
        };
      }

      // Procesar el checkout
      return await processor.processCheckout(data);
    } catch (error) {
      return {
        success: false,
        error: `Payment processing failed: ${error}`
      };
    }
  }

  /**
   * Obtener métodos de pago disponibles de todos los procesadores
   */
  static getAllPaymentMethods(): PaymentMethodInfo[] {
    const allMethods: PaymentMethodInfo[] = [];
    
    PaymentProcessorFactory.getAvailableProcessors().forEach(type => {
      try {
        const processor = PaymentProcessorFactory.createProcessor(type);
        allMethods.push(...processor.getPaymentMethods());
      } catch (error) {
        console.warn(`Failed to get payment methods for ${type}:`, error);
      }
    });

    return allMethods;
  }

  /**
   * Validar datos de entrada para checkout
   */
  static validateCheckoutData(data: CheckoutSessionData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.cartItems || data.cartItems.length === 0) {
      errors.push('El carrito está vacío');
    }

    // Usar 'validator' para validar email de forma segura
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const isEmail = require('validator/lib/isEmail');
    if (!data.email || !isEmail(data.email)) {
      errors.push('Email inválido');
    }

    if (data.customerData?.name && data.customerData.name.trim().length < 2) {
      errors.push('Nombre del cliente inválido');
    }

    // Validar que todos los items tengan precio válido
    data.cartItems?.forEach((item, index) => {
      if (!item.producto?.price || item.producto.price <= 0) {
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
   * MÉTODO LEGACY: Redirigir a Stripe Checkout (mantener compatibilidad)
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
   * Procesar pago completo usando Factory Method Pattern
   */
  static async processPayment(data: CheckoutSessionData, processorType: 'stripe' | 'paypal' = 'stripe') {
    try {
      // Usar el nuevo método que implementa Factory Pattern
      const result = await PaymentService.createCheckoutSession(data, processorType);
      
      if (!result.success) {
        throw new Error(result.error || 'Error al crear sesión de checkout');
      }
      
      // Para Stripe, redirigir a Checkout
      if (processorType === 'stripe' && result.sessionId) {
        await PaymentService.redirectToCheckout(result.sessionId);
      }
      
      // Para PayPal, redirigir a la URL de aprobación
      if (processorType === 'paypal' && result.sessionUrl) {
        window.location.href = result.sessionUrl;
      }
      
      return result;
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
        const itemPrice = item.producto?.price || 0;
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
  static formatPrice(amount: number, currency: string = 'USD'): string {
    if (!amount || isNaN(amount)) {
      return '$0.00';
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.error('Price formatting error:', error);
      return `$${amount.toFixed(2)}`;
    }
  }

  /**
   * Validar datos de tarjeta
   */
  private static isValidLuhn(cardNumber: string): boolean {
    let sum = 0;
    let shouldDouble = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  private static isValidExpiry(expiry: string): string | null {
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiry)) {
      return 'Fecha de expiración inválida (MM/YY)';
    }
    const [month, year] = expiry.split('/');
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);
    const now = new Date();
    // Set to last day of expiry month
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    expiryDate.setDate(0);
    if (expiryDate < now) {
      return 'La tarjeta ha expirado';
    }
    return null;
  }

  static validateCardData(cardData: {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar número de tarjeta
    const cardNumber = cardData.number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardNumber)) {
      errors.push('Número de tarjeta inválido');
    } else if (!this.isValidLuhn(cardNumber)) {
      errors.push('Número de tarjeta no pasó la validación de Luhn');
    }

    // Validar fecha de expiración
    const expiryError = this.isValidExpiry(cardData.expiry);
    if (expiryError) {
      errors.push(expiryError);
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

  /**
   * Obtener métodos de pago del usuario desde Supabase
   */
  static async getUserPaymentMethods(userId: string) {
    try {
      const supabase = (await import('@/lib/supabaseClient')).default;
      
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error: any) {
      console.error('Error fetching user payment methods:', error);
      throw new Error(error.message || 'Error al obtener métodos de pago');
    }
  }

  /**
   * Crear método de pago del usuario
   */
  static async createUserPaymentMethod(paymentMethodData: any) {
    try {
      const supabase = (await import('@/lib/supabaseClient')).default;
      
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([paymentMethodData])
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Error creating payment method:', error);
      throw new Error(error.message || 'Error al crear método de pago');
    }
  }

  /**
   * Actualizar método de pago del usuario
   */
  static async updateUserPaymentMethod(id: string, updateData: any) {
    try {
      const supabase = (await import('@/lib/supabaseClient')).default;
      
      const { data, error } = await supabase
        .from('payment_methods')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      throw new Error(error.message || 'Error al actualizar método de pago');
    }
  }

  /**
   * Eliminar método de pago del usuario
   */
  static async deleteUserPaymentMethod(id: string) {
    try {
      const supabase = (await import('@/lib/supabaseClient')).default;
      
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return true;
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      throw new Error(error.message || 'Error al eliminar método de pago');
    }
  }
}

export { getStripe };
export default PaymentService;
