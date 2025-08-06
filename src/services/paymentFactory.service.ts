/**
 * FACTORY METHOD PATTERN - PAYMENT PROCESSORS
 * 
 * Este patrón permite crear diferentes procesadores de pago sin especificar
 * la clase exacta del objeto que se va a crear. Facilita la extensión
 * del sistema con nuevos métodos de pago sin modificar código existente.
 */

// ============================================================================
// INTERFACES BASE
// ============================================================================

/**
 * Interfaz común para todos los procesadores de pago
 */
export interface PaymentProcessor {
  processPayment(amount: number, paymentData: any): Promise<PaymentResult>;
  validatePaymentData(paymentData: any): boolean;
  refund(transactionId: string, amount?: number): Promise<RefundResult>;
  getPaymentMethods(): PaymentMethodInfo[];
}

/**
 * Resultado estándar de procesamiento de pago
 */
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  paymentUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Resultado de reembolso
 */
export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  error?: string;
}

/**
 * Información de métodos de pago disponibles
 */
export interface PaymentMethodInfo {
  id: string;
  name: string;
  description: string;
  fees: number;
  supportedCurrencies: string[];
}

// ============================================================================
// IMPLEMENTACIONES CONCRETAS
// ============================================================================

/**
 * Procesador de pagos con Stripe
 */
class StripePaymentProcessor implements PaymentProcessor {
  private stripeKey: string;

  constructor(stripeKey: string) {
    this.stripeKey = stripeKey;
  }

  async processPayment(amount: number, paymentData: any): Promise<PaymentResult> {
    try {
      // Integración con Stripe API
      console.log(`Processing Stripe payment for $${amount}`);
      
      // Simulación de llamada a Stripe
      const response = await this.callStripeAPI(amount, paymentData);
      
      return {
        success: true,
        transactionId: response.id,
        paymentUrl: response.url,
        metadata: { processor: 'stripe' }
      };
    } catch (error) {
      return {
        success: false,
        error: `Stripe payment failed: ${error}`
      };
    }
  }

  validatePaymentData(paymentData: any): boolean {
    return !!(paymentData.cardNumber && paymentData.expiryDate && paymentData.cvv);
  }

  async refund(transactionId: string, amount?: number): Promise<RefundResult> {
    try {
      console.log(`Processing Stripe refund for transaction ${transactionId}`);
      return {
        success: true,
        refundId: `ref_${Date.now()}`,
        amount: amount
      };
    } catch (error) {
      return {
        success: false,
        error: `Stripe refund failed: ${error}`
      };
    }
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

  private async callStripeAPI(amount: number, paymentData: any) {
    // Aquí iría la integración real con Stripe
    // Por ahora simulamos la respuesta
    return {
      id: `pi_${Date.now()}`,
      url: 'https://checkout.stripe.com/pay/...'
    };
  }
}

/**
 * Procesador de pagos con PayPal
 */
class PayPalPaymentProcessor implements PaymentProcessor {
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async processPayment(amount: number, paymentData: any): Promise<PaymentResult> {
    try {
      console.log(`Processing PayPal payment for $${amount}`);
      
      // Simulación de llamada a PayPal API
      const response = await this.callPayPalAPI(amount, paymentData);
      
      return {
        success: true,
        transactionId: response.id,
        paymentUrl: response.approvalUrl,
        metadata: { processor: 'paypal' }
      };
    } catch (error) {
      return {
        success: false,
        error: `PayPal payment failed: ${error}`
      };
    }
  }

  validatePaymentData(paymentData: any): boolean {
    return !!(paymentData.email || paymentData.paypalAccount);
  }

  async refund(transactionId: string, amount?: number): Promise<RefundResult> {
    try {
      console.log(`Processing PayPal refund for transaction ${transactionId}`);
      return {
        success: true,
        refundId: `PAYPAL_REF_${Date.now()}`,
        amount: amount
      };
    } catch (error) {
      return {
        success: false,
        error: `PayPal refund failed: ${error}`
      };
    }
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

  private async callPayPalAPI(amount: number, paymentData: any) {
    // Aquí iría la integración real con PayPal
    return {
      id: `PAYPAL_${Date.now()}`,
      approvalUrl: 'https://www.paypal.com/checkoutnow?...'
    };
  }
}

// ============================================================================
// FACTORY METHOD
// ============================================================================

/**
 * Tipos de procesadores de pago soportados
 */
export type PaymentProcessorType = 'stripe' | 'paypal';

/**
 * Factory para crear procesadores de pago
 * 
 * BENEFICIOS:
 * - Centraliza la creación de procesadores de pago
 * - Facilita agregar nuevos métodos de pago
 * - Desacopla el código cliente de las implementaciones específicas
 * - Permite configuración dinámica según el contexto
 */
export class PaymentProcessorFactory {
  /**
   * Crea un procesador de pago basado en el tipo especificado
   */
  static createProcessor(type: PaymentProcessorType): PaymentProcessor {
    switch (type) {
      case 'stripe':
        return new StripePaymentProcessor(
          process.env.STRIPE_SECRET_KEY || 'sk_test_...'
        );
      
      case 'paypal':
        return new PayPalPaymentProcessor(
          process.env.PAYPAL_CLIENT_ID || 'paypal_client_id',
          process.env.PAYPAL_CLIENT_SECRET || 'paypal_client_secret'
        );
      
      default:
        throw new Error(`Unsupported payment processor type: ${type}`);
    }
  }

  /**
   * Obtiene todos los procesadores disponibles
   */
  static getAvailableProcessors(): PaymentProcessorType[] {
    return ['stripe', 'paypal'];
  }

  /**
   * Crea un procesador basado en la preferencia del usuario o configuración
   */
  static createPreferredProcessor(
    userPreference?: PaymentProcessorType,
    fallback: PaymentProcessorType = 'stripe'
  ): PaymentProcessor {
    try {
      const processorType = userPreference || fallback;
      return this.createProcessor(processorType);
    } catch (error) {
      console.warn(`Failed to create preferred processor, using fallback: ${fallback}`);
      return this.createProcessor(fallback);
    }
  }
}

// ============================================================================
// SERVICIO DE ALTO NIVEL
// ============================================================================

/**
 * Servicio que utiliza el Factory Method para manejar pagos
 * Este servicio reemplazaría/complementaría el payment.service.ts existente
 */
export class PaymentService {
  /**
   * Procesa un pago usando el procesador especificado
   */
  static async processPayment(
    processorType: PaymentProcessorType,
    amount: number,
    paymentData: any
  ): Promise<PaymentResult> {
    const processor = PaymentProcessorFactory.createProcessor(processorType);
    
    // Validar datos antes del procesamiento
    if (!processor.validatePaymentData(paymentData)) {
      return {
        success: false,
        error: 'Invalid payment data provided'
      };
    }

    return await processor.processPayment(amount, paymentData);
  }

  /**
   * Obtiene métodos de pago disponibles de todos los procesadores
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
}
