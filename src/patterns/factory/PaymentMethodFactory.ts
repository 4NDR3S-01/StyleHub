/**
 * FACTORY METHOD PATTERN
 * 
 * Patrón Factory Method para crear diferentes tipos de métodos de pago
 * sin exponer la lógica de instanciación al cliente.
 */

// Interfaz común para todos los métodos de pago
export interface PaymentMethod {
  type: string;
  processPayment(amount: number, orderId: string): Promise<PaymentResult>;
  validatePaymentData(data: any): boolean;
  getProviderInfo(): PaymentProviderInfo;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  data?: any;
}

export interface PaymentProviderInfo {
  name: string;
  icon: string;
  supportedCurrencies: string[];
  processingFee: number;
}

// Implementación concreta para Stripe
export class StripePaymentMethod implements PaymentMethod {
  type = 'stripe';

  async processPayment(amount: number, orderId: string): Promise<PaymentResult> {
    try {
      console.log(`🔵 Procesando pago Stripe: $${amount} para orden ${orderId}`);
      
      // Simulación de procesamiento con Stripe
      const { PaymentService } = await import('@/services/payment.service');
      const paymentIntent = await PaymentService.createPaymentIntent(amount * 100); // Stripe usa centavos
      
      return {
        success: true,
        transactionId: paymentIntent.id,
        data: paymentIntent
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error procesando pago con Stripe'
      };
    }
  }

  validatePaymentData(data: any): boolean {
    return !!(data.cardNumber && data.expiryDate && data.cvv);
  }

  getProviderInfo(): PaymentProviderInfo {
    return {
      name: 'Stripe',
      icon: '💳',
      supportedCurrencies: ['USD', 'EUR', 'COP'],
      processingFee: 2.9
    };
  }
}

// Implementación concreta para PayPal
export class PayPalPaymentMethod implements PaymentMethod {
  type = 'paypal';

  async processPayment(amount: number, orderId: string): Promise<PaymentResult> {
    try {
      console.log(`🔵 Procesando pago PayPal: $${amount} para orden ${orderId}`);
      
      // Simulación de procesamiento con PayPal
      const transactionId = `PAYPAL_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      return {
        success: true,
        transactionId,
        data: { orderId, amount, provider: 'paypal' }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error procesando pago con PayPal'
      };
    }
  }

  validatePaymentData(data: any): boolean {
    return !!(data.email && data.paypalToken);
  }

  getProviderInfo(): PaymentProviderInfo {
    return {
      name: 'PayPal',
      icon: '🏛️',
      supportedCurrencies: ['USD', 'EUR', 'COP'],
      processingFee: 3.4
    };
  }
}

// Implementación concreta para tarjetas de débito
export class DebitCardPaymentMethod implements PaymentMethod {
  type = 'debit';

  async processPayment(amount: number, orderId: string): Promise<PaymentResult> {
    try {
      console.log(`🔵 Procesando pago con tarjeta débito: $${amount} para orden ${orderId}`);
      
      // Usar Stripe pero con configuración específica para débito
      const stripeMethod = new StripePaymentMethod();
      const result = await stripeMethod.processPayment(amount, orderId);
      
      return {
        ...result,
        data: { ...result.data, paymentType: 'debit' }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error procesando pago con tarjeta débito'
      };
    }
  }

  validatePaymentData(data: any): boolean {
    return !!(data.cardNumber && data.expiryDate && data.cvv && data.cardType === 'debit');
  }

  getProviderInfo(): PaymentProviderInfo {
    return {
      name: 'Tarjeta Débito',
      icon: '💳',
      supportedCurrencies: ['COP', 'USD'],
      processingFee: 2.5
    };
  }
}

// Enum para tipos de pago soportados
export enum PaymentType {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  DEBIT_CARD = 'debit'
}

/**
 * FACTORY METHOD PATTERN - Clase Factory
 * 
 * Esta clase implementa el patrón Factory Method para crear
 * instancias de diferentes métodos de pago sin exponer
 * la lógica de instanciación al cliente.
 */
export class PaymentMethodFactory {
  private static readonly supportedMethods = new Map<string, () => PaymentMethod>([
    [PaymentType.STRIPE, () => new StripePaymentMethod()],
    [PaymentType.PAYPAL, () => new PayPalPaymentMethod()],
    [PaymentType.DEBIT_CARD, () => new DebitCardPaymentMethod()]
  ]);

  /**
   * Método factory principal - crea instancias de métodos de pago
   * 
   * @param type - Tipo de método de pago a crear
   * @returns Instancia del método de pago solicitado
   * @throws Error si el tipo no es soportado
   */
  static createPaymentMethod(type: string): PaymentMethod {
    const creator = this.supportedMethods.get(type.toLowerCase());
    
    if (!creator) {
      throw new Error(`Método de pago no soportado: ${type}. Métodos disponibles: ${this.getSupportedTypes().join(', ')}`);
    }

    console.log(`🏭 Factory: Creando método de pago ${type}`);
    return creator();
  }

  /**
   * Obtener todos los tipos de pago soportados
   */
  static getSupportedTypes(): string[] {
    return Array.from(this.supportedMethods.keys());
  }

  /**
   * Verificar si un tipo de pago es soportado
   */
  static isSupported(type: string): boolean {
    return this.supportedMethods.has(type.toLowerCase());
  }

  /**
   * Obtener información de todos los proveedores disponibles
   */
  static getAllProviderInfo(): PaymentProviderInfo[] {
    return this.getSupportedTypes().map(type => {
      const method = this.createPaymentMethod(type);
      return method.getProviderInfo();
    });
  }

  /**
   * Registrar un nuevo método de pago dinámicamente
   * (Permite extender la factory en runtime)
   */
  static registerPaymentMethod(type: string, creator: () => PaymentMethod): void {
    if (this.supportedMethods.has(type)) {
      console.warn(`⚠️ Sobrescribiendo método de pago existente: ${type}`);
    }
    
    this.supportedMethods.set(type, creator);
    console.log(`✅ Método de pago registrado: ${type}`);
  }
}

// Clase utilitaria para usar el Factory
export class PaymentProcessor {
  /**
   * Procesa un pago usando el factory method pattern
   */
  static async processPayment(
    type: string, 
    amount: number, 
    orderId: string, 
    paymentData?: any
  ): Promise<PaymentResult> {
    try {
      // Usar factory para crear el método de pago
      const paymentMethod = PaymentMethodFactory.createPaymentMethod(type);
      
      // Validar datos si se proporcionan
      if (paymentData && !paymentMethod.validatePaymentData(paymentData)) {
        return {
          success: false,
          error: 'Datos de pago inválidos'
        };
      }

      // Procesar el pago
      const result = await paymentMethod.processPayment(amount, orderId);
      
      console.log(`💰 Resultado del pago ${type}:`, result.success ? '✅ Exitoso' : '❌ Fallido');
      
      return result;
    } catch (error: any) {
      console.error(`❌ Error en PaymentProcessor:`, error);
      return {
        success: false,
        error: error.message || 'Error interno del procesador de pagos'
      };
    }
  }
}

export default PaymentMethodFactory;
