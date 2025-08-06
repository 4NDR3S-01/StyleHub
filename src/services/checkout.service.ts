import { CartItem } from '@/context/CartContext';
import { createOrder } from './order.service';
import { recordCouponUsage } from './coupon.service';

export interface CheckoutData {
  userId: string;
  userEmail: string;
  items: CartItem[];
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  shippingCost: number;
  coupon?: any;
  couponDiscount?: number;
  total: number;
}

export interface PaymentResult {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  error?: string;
}

/**
 * Servicio para manejar el flujo de checkout correcto:
 * 1. Validar datos
 * 2. Procesar pago
 * 3. Crear orden solo si el pago es exitoso
 */
export class CheckoutService {
  
  /**
   * Procesar checkout completo con Stripe
   */
  static async processStripeCheckout(
    checkoutData: CheckoutData,
    paymentIntent: any
  ): Promise<PaymentResult> {
    try {
      console.log('🚀 Procesando checkout con Stripe...');
      
      // Validar que el pago fue exitoso
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error('El pago no se completó correctamente');
      }

      // Crear la orden después del pago exitoso
      const order = await createOrder(
        checkoutData.userId,
        checkoutData.items,
        checkoutData.address,
        'stripe',
        checkoutData.shippingCost,
        0.19 // 19% IVA
      );

      console.log('✅ Orden creada exitosamente:', order.id);

      // Registrar uso del cupón si se aplicó
      if (checkoutData.coupon && checkoutData.couponDiscount) {
        try {
          await recordCouponUsage(
            checkoutData.coupon.id,
            checkoutData.userId,
            order.id,
            checkoutData.couponDiscount
          );
          console.log('✅ Cupón aplicado exitosamente');
        } catch (couponError) {
          console.error('⚠️ Error registrando uso del cupón:', couponError);
          // No fallar por esto, la orden ya fue creada
        }
      }

      return {
        success: true,
        orderId: order.id,
        paymentId: paymentIntent.id
      };

    } catch (error) {
      console.error('❌ Error en checkout con Stripe:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Procesar checkout completo con PayPal
   */
  static async processPayPalCheckout(
    checkoutData: CheckoutData,
    paypalData: any
  ): Promise<PaymentResult> {
    try {
      console.log('🚀 Procesando checkout con PayPal...');
      
      // Validar que el pago fue exitoso
      if (!paypalData?.transaction_id) {
        throw new Error('El pago de PayPal no se completó correctamente');
      }

      // Crear la orden después del pago exitoso
      const order = await createOrder(
        checkoutData.userId,
        checkoutData.items,
        checkoutData.address,
        'paypal',
        checkoutData.shippingCost,
        0.19 // 19% IVA
      );

      console.log('✅ Orden creada exitosamente:', order.id);

      // Registrar uso del cupón si se aplicó
      if (checkoutData.coupon && checkoutData.couponDiscount) {
        try {
          await recordCouponUsage(
            checkoutData.coupon.id,
            checkoutData.userId,
            order.id,
            checkoutData.couponDiscount
          );
          console.log('✅ Cupón aplicado exitosamente');
        } catch (couponError) {
          console.error('⚠️ Error registrando uso del cupón:', couponError);
          // No fallar por esto, la orden ya fue creada
        }
      }

      return {
        success: true,
        orderId: order.id,
        paymentId: paypalData.transaction_id
      };

    } catch (error) {
      console.error('❌ Error en checkout con PayPal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Validar datos del checkout antes del pago
   */
  static validateCheckoutData(checkoutData: CheckoutData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!checkoutData.userId) {
      errors.push('Usuario no autenticado');
    }

    if (!checkoutData.items || checkoutData.items.length === 0) {
      errors.push('El carrito está vacío');
    }

    if (!checkoutData.address?.street) {
      errors.push('Dirección de envío incompleta');
    }

    if (!checkoutData.userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutData.userEmail)) {
      errors.push('Email inválido');
    }

    if (checkoutData.total <= 0) {
      errors.push('Total inválido');
    }

    // Validar items del carrito
    checkoutData.items.forEach((item, index) => {
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
}
