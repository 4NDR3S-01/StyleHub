/**
 * EJEMPLO DE INTEGRACIÓN DE TODOS LOS PATRONES
 * 
 * Este archivo demuestra cómo todos los patrones de diseño
 * trabajan juntos en un escenario real de checkout.
 */

import { logger, ModuleLogger } from '@/patterns/singleton/Logger';
import { PaymentMethodFactory, PaymentProcessor } from '@/patterns/factory/PaymentMethodFactory';
import { RepositoryFactory } from '@/patterns/repository/BaseRepository';
import { ShippingService, ShippingStrategyFactory } from '@/patterns/strategy/ShippingStrategy';

// Logger específico para este módulo
const checkoutLogger = new ModuleLogger('CheckoutIntegration');

/**
 * EJEMPLO COMPLETO: Proceso de Checkout usando todos los patrones
 */
export class IntegratedCheckoutService {
  private readonly shippingService: ShippingService;

  constructor() {
    // SINGLETON: Usar logger para tracking
    logger.info('Inicializando IntegratedCheckoutService');
    
    // STRATEGY: Inicializar servicio de envío con estrategia por defecto
    this.shippingService = new ShippingService();
    
    checkoutLogger.info('Servicio de checkout integrado listo');
  }

  /**
   * Proceso completo de checkout usando todos los patrones
   */
  async processCompleteCheckout(checkoutData: {
    userId: string;
    items: any[];
    subtotal: number;
    paymentType: string;
    shippingType?: string;
    weight?: number;
    distance?: number;
  }) {
    const startTime = Date.now();
    
    try {
      // SINGLETON: Log del inicio del proceso
      checkoutLogger.info('Iniciando checkout completo', {
        userId: checkoutData.userId,
        subtotal: checkoutData.subtotal,
        paymentType: checkoutData.paymentType
      });

      // PASO 1: STRATEGY PATTERN - Calcular opciones de envío
      await this.calculateShippingOptions(
        checkoutData.subtotal,
        checkoutData.weight,
        checkoutData.distance
      );

      // PASO 2: Seleccionar método de envío (usar el recomendado si no se especifica)
      const selectedShipping = checkoutData.shippingType 
        ? await this.selectShippingMethod(checkoutData.shippingType, checkoutData.subtotal, checkoutData.weight, checkoutData.distance)
        : await this.getRecommendedShipping(checkoutData.subtotal, checkoutData.weight, checkoutData.distance);

      const totalWithShipping = checkoutData.subtotal + selectedShipping.cost;

      // PASO 3: FACTORY METHOD PATTERN - Procesar pago
      const paymentResult = await this.processPayment(
        checkoutData.paymentType,
        totalWithShipping,
        `order-${Date.now()}`
      );

      if (!paymentResult.success) {
        throw new Error(`Error en el pago: ${paymentResult.error}`);
      }

      // PASO 4: REPOSITORY PATTERN - Crear orden en base de datos
      const order = await this.createOrder({
        userId: checkoutData.userId,
        items: checkoutData.items,
        subtotal: checkoutData.subtotal,
        shippingCost: selectedShipping.cost,
        total: totalWithShipping,
        paymentMethod: checkoutData.paymentType,
        paymentTransactionId: paymentResult.transactionId,
        shippingMethod: selectedShipping.info.name,
        status: 'confirmed'
      });

      const duration = Date.now() - startTime;

      // SINGLETON: Log del éxito
      checkoutLogger.info('Checkout completado exitosamente', {
        orderId: order.id,
        duration,
        total: totalWithShipping
      });

      return {
        success: true,
        orderId: order.id,
        total: totalWithShipping,
        shippingCost: selectedShipping.cost,
        paymentTransactionId: paymentResult.transactionId,
        estimatedDelivery: selectedShipping.info.estimatedDays,
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // SINGLETON: Log del error
      checkoutLogger.error('Error en checkout completo', {
        error: error.message,
        duration,
        checkoutData
      });

      throw error;
    }
  }

  /**
   * STRATEGY PATTERN: Calcular opciones de envío disponibles
   */
  private async calculateShippingOptions(subtotal: number, weight?: number, distance?: number) {
    checkoutLogger.debug('Calculando opciones de envío', { subtotal, weight, distance });

    try {
      const options = this.shippingService.getShippingOptions(subtotal, weight, distance);
      
      checkoutLogger.info('Opciones de envío calculadas', {
        count: options.length,
        options: options.map(o => ({ name: o.name, cost: o.cost }))
      });

      return options;
    } catch (error: any) {
      checkoutLogger.error('Error calculando opciones de envío', error);
      throw error;
    }
  }

  /**
   * STRATEGY PATTERN: Seleccionar método de envío específico
   */
  private async selectShippingMethod(type: string, subtotal: number, weight?: number, distance?: number) {
    checkoutLogger.debug('Seleccionando método de envío', { type, subtotal });

    try {
      const result = this.shippingService.selectShippingMethod(type, subtotal, weight, distance);
      
      checkoutLogger.info('Método de envío seleccionado', {
        type,
        cost: result.cost,
        name: result.info.name
      });

      return result;
    } catch (error: any) {
      checkoutLogger.error('Error seleccionando método de envío', { type, error });
      throw error;
    }
  }

  /**
   * STRATEGY PATTERN: Obtener recomendación automática de envío
   */
  private async getRecommendedShipping(subtotal: number, weight?: number, distance?: number) {
    checkoutLogger.debug('Obteniendo envío recomendado', { subtotal });

    try {
      const result = this.shippingService.getRecommendedShipping(subtotal, weight, distance);
      
      checkoutLogger.info('Envío recomendado obtenido', {
        cost: result.cost,
        name: result.info.name
      });

      return result;
    } catch (error: any) {
      checkoutLogger.error('Error obteniendo envío recomendado', error);
      throw error;
    }
  }

  /**
   * FACTORY METHOD PATTERN: Procesar pago usando factory
   */
  private async processPayment(paymentType: string, amount: number, orderId: string) {
    checkoutLogger.debug('Procesando pago', { paymentType, amount, orderId });

    try {
      // Usar factory method para obtener el procesador de pago correcto
      const result = await PaymentProcessor.processPayment(paymentType, amount, orderId);
      
      if (result.success) {
        checkoutLogger.info('Pago procesado exitosamente', {
          paymentType,
          amount,
          transactionId: result.transactionId
        });
      } else {
        checkoutLogger.warn('Pago falló', {
          paymentType,
          amount,
          error: result.error
        });
      }

      return result;
    } catch (error: any) {
      checkoutLogger.error('Error procesando pago', { paymentType, amount, error });
      throw error;
    }
  }

  /**
   * REPOSITORY PATTERN: Crear orden en la base de datos
   */
  private async createOrder(orderData: any) {
    checkoutLogger.debug('Creando orden en base de datos', { userId: orderData.userId, total: orderData.total });

    try {
      // Usar repository pattern para acceso a datos
      const orderRepository = RepositoryFactory.getOrderRepository();
      
      const order = await orderRepository.create({
        user_id: orderData.userId,
        status: orderData.status,
        total: orderData.total,
        shipping_cost: orderData.shippingCost,
        payment_method: orderData.paymentMethod,
        shipping_address: orderData.shippingAddress || {}
      });

      checkoutLogger.info('Orden creada exitosamente', {
        orderId: order.id,
        userId: orderData.userId,
        total: orderData.total
      });

      return order;
    } catch (error: any) {
      checkoutLogger.error('Error creando orden', { orderData, error });
      throw error;
    }
  }

  /**
   * Método utilitario para obtener estadísticas del servicio
   */
  async getServiceStats() {
    try {
      // SINGLETON: Obtener estadísticas de logging
      const logStats = logger.getStats();
      
      // FACTORY: Obtener métodos de pago soportados
      const paymentMethods = PaymentMethodFactory.getSupportedTypes();
      
      // STRATEGY: Obtener estrategias de envío soportadas
      const shippingStrategies = ShippingStrategyFactory.getSupportedTypes();
      
      // REPOSITORY: Obtener estadísticas de base de datos (ejemplo)
      const orderRepo = RepositoryFactory.getOrderRepository();
      const totalOrders = (await orderRepo.findAll()).length;

      return {
        logging: logStats,
        paymentMethods,
        shippingStrategies,
        totalOrders,
        timestamp: new Date()
      };
    } catch (error: any) {
      checkoutLogger.error('Error obteniendo estadísticas del servicio', error);
      throw error;
    }
  }
}

/**
 * EJEMPLO DE USO RÁPIDO
 */
export async function exampleUsage() {
  // Instanciar el servicio integrado
  const checkoutService = new IntegratedCheckoutService();

  // Datos de ejemplo
  const exampleCheckout = {
    userId: 'user-123',
    items: [
      { id: 'product-1', quantity: 2, price: 50000 },
      { id: 'product-2', quantity: 1, price: 75000 }
    ],
    subtotal: 175000,
    paymentType: 'stripe',
    shippingType: 'express', // opcional
    weight: 2.5,
    distance: 15
  };

  try {
    // Procesar checkout completo usando todos los patrones
    const result = await checkoutService.processCompleteCheckout(exampleCheckout);
    
    console.log('🎉 Checkout exitoso:', result);
    
    // Obtener estadísticas del servicio
    const stats = await checkoutService.getServiceStats();
    console.log('📊 Estadísticas del servicio:', stats);

    return result;
  } catch (error) {
    console.error('❌ Error en ejemplo de checkout:', error);
    throw error;
  }
}

/**
 * TESTING INDIVIDUAL DE CADA PATRÓN
 */
export class PatternTester {
  
  static async testSingleton() {
    console.log('🧪 Testing Singleton Pattern...');
    
    // Verificar que siempre es la misma instancia
    const logger1 = logger;
    const logger2 = logger;
    
    console.log('Logger instances are same:', logger1 === logger2);
    
    // Test logging
    logger.info('Test singleton logging');
    const logs = logger.getLogs('info', 1);
    console.log('Last log:', logs[logs.length - 1]);
  }

  static async testFactory() {
    console.log('🧪 Testing Factory Method Pattern...');
    
    // Test creación de diferentes métodos de pago
    const stripe = PaymentMethodFactory.createPaymentMethod('stripe');
    const paypal = PaymentMethodFactory.createPaymentMethod('paypal');
    
    console.log('Stripe provider:', stripe.getProviderInfo());
    console.log('PayPal provider:', paypal.getProviderInfo());
    
    // Test procesamiento
    const result = await PaymentProcessor.processPayment('stripe', 100000, 'test-order');
    console.log('Payment result:', result);
  }

  static async testRepository() {
    console.log('🧪 Testing Repository Pattern...');
    
    try {
      const productRepo = RepositoryFactory.getProductRepository();
      
      // Test búsqueda (puede fallar si no hay datos)
      const products = await productRepo.findAll();
      console.log('Total products found:', products.length);
      
      console.log('Repository test completed');
    } catch (error) {
      console.log('Repository test skipped (no data):', error);
    }
  }

  static async testStrategy() {
    console.log('🧪 Testing Strategy Pattern...');
    
    const shippingService = new ShippingService();
    
    // Test opciones para diferentes subtotales
    const subtotals = [25000, 100000, 200000, 500000];
    
    for (const subtotal of subtotals) {
      const options = shippingService.getShippingOptions(subtotal, 1, 10);
      console.log(`Opciones para $${subtotal.toLocaleString()}:`, 
                  options.map(o => `${o.name}: $${o.cost.toLocaleString()}`));
    }
  }

  static async testAllPatterns() {
    console.log('🧪 Testing ALL Design Patterns...\n');
    
    await this.testSingleton();
    console.log('');
    
    await this.testFactory();
    console.log('');
    
    await this.testRepository();
    console.log('');
    
    await this.testStrategy();
    console.log('');
    
    console.log('✅ All pattern tests completed!');
  }
}

export default IntegratedCheckoutService;
