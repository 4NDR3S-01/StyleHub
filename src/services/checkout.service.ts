import supabase from '@/lib/supabaseClient';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil'
});

export interface CheckoutData {
  userId: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    variant_id?: string;
    color?: string;
    size?: string;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  paymentMethod: {
    type: 'card' | 'paypal';
    token?: string;
    savedMethodId?: string;
  };
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  couponCode?: string;
  couponDiscount?: number;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  orderId?: string;
  error?: string;
  approvalUrl?: string; // Para PayPal
}

class CheckoutService {
  /**
   * Procesa el checkout completo siguiendo el flujo ético:
   * 1. Valida datos
   * 2. Procesa el pago
   * 3. Solo si el pago es exitoso, crea la orden
   */
  async processCheckout(checkoutData: CheckoutData): Promise<PaymentResult> {
    try {
      // 1. Validar datos del checkout
      const validationResult = await this.validateCheckoutData(checkoutData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error
        };
      }

      // 2. Procesar el pago ANTES de crear la orden
      const paymentResult = await this.processPayment(checkoutData);
      if (!paymentResult.success) {
        return paymentResult;
      }

      // 3. Solo si el pago es exitoso, crear la orden
      const orderId = await this.createOrder(checkoutData, paymentResult.paymentIntentId!);

      return {
        success: true,
        orderId,
        paymentIntentId: paymentResult.paymentIntentId
      };

    } catch (error) {
      console.error('Error in checkout process:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en el checkout'
      };
    }
  }

  /**
   * Procesa el pago usando Stripe
   */
  async processStripeCheckout(checkoutData: CheckoutData): Promise<PaymentResult> {
    try {
      const paymentIntentData: any = {
        amount: Math.round(checkoutData.total * 100), // Stripe usa centavos
        currency: 'usd',
        metadata: {
          userId: checkoutData.userId,
          itemCount: checkoutData.items.length.toString()
        }
      };

      // Si es un método guardado
      if (checkoutData.paymentMethod.savedMethodId) {
        paymentIntentData.payment_method = checkoutData.paymentMethod.savedMethodId;
        paymentIntentData.confirm = true;
        paymentIntentData.return_url = `${process.env.NEXT_PUBLIC_APP_URL}/orden-confirmada`;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      // Si es método guardado y se confirma automáticamente
      if (checkoutData.paymentMethod.savedMethodId && paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntentId: paymentIntent.id
        };
      }

      // Para nuevos métodos, devolver client_secret para confirmar en frontend
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        // Nota: client_secret se manejará en el frontend
      };

    } catch (error) {
      console.error('Error processing Stripe payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar el pago con Stripe'
      };
    }
  }

  /**
   * Procesa el pago usando PayPal
   */
  async processPayPalCheckout(checkoutData: CheckoutData): Promise<PaymentResult> {
    try {
      // Crear orden en PayPal
      const response = await fetch('https://api.paypal.com/v2/checkout/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getPayPalAccessToken()}`
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: checkoutData.total.toFixed(2)
            }
          }],
          application_context: {
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/orden-confirmada`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`
          }
        })
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error?.message || 'Error al crear orden de PayPal');
      }

      // Encontrar la URL de aprobación
      const approvalUrl = orderData.links?.find((link: any) => link.rel === 'approve')?.href;

      return {
        success: true,
        paymentIntentId: orderData.id,
        approvalUrl
      };

    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al procesar el pago con PayPal'
      };
    }
  }

  /**
   * Valida los datos del checkout antes de procesar
   */
  private async validateCheckoutData(data: CheckoutData): Promise<{ isValid: boolean; error?: string }> {
    // Validar usuario
    if (!data.userId) {
      return { isValid: false, error: 'Usuario no válido' };
    }

    // Validar items
    if (!data.items || data.items.length === 0) {
      return { isValid: false, error: 'No hay productos en el carrito' };
    }

    // Validar precios
    if (data.total <= 0) {
      return { isValid: false, error: 'Total inválido' };
    }

    // Validar dirección de envío
    const { shippingAddress } = data;
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.postal_code) {
      return { isValid: false, error: 'Dirección de envío incompleta' };
    }

    // Validar disponibilidad de inventario
    for (const item of data.items) {
      // Usar variant_id para validar stock específico de la variante
      if (!item.variant_id) {
        return { isValid: false, error: `Variante no especificada para el producto ${item.id}` };
      }

      const { data: variant } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', item.variant_id)
        .single();

      if (!variant || variant.stock < item.quantity) {
        return { isValid: false, error: `Stock insuficiente para el producto ${item.id}. Stock disponible: ${variant?.stock || 0}, solicitado: ${item.quantity}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Procesa el pago según el método seleccionado
   */
  private async processPayment(data: CheckoutData): Promise<PaymentResult> {
    switch (data.paymentMethod.type) {
      case 'card':
        return this.processStripeCheckout(data);
      case 'paypal':
        return this.processPayPalCheckout(data);
      default:
        return {
          success: false,
          error: 'Método de pago no soportado'
        };
    }
  }

  /**
   * Crea la orden en la base de datos SOLO después de que el pago sea exitoso
   */
  private async createOrder(data: CheckoutData, paymentIntentId: string): Promise<string> {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: data.userId,
        status: 'paid', // Importante: solo creamos órdenes pagadas
        total_amount: data.total,
        subtotal: data.subtotal,
        shipping_cost: data.shipping,
        tax_amount: data.tax,
        coupon_code: data.couponCode,
        coupon_discount: data.couponDiscount,
        payment_intent_id: paymentIntentId,
        payment_status: 'completed',
        shipping_address: data.shippingAddress,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Error al crear la orden: ${error.message}`);
    }

    // Crear los items de la orden
    const orderItems = data.items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: item.price,
      product_name: '', // Se completará por trigger en la BD
      variant_name: item.size && item.color ? `${item.size} ${item.color}`.trim() : '',
      total: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Error al crear los items de la orden: ${itemsError.message}`);
    }

    // Actualizar inventario de variantes
    for (const item of data.items) {
      if (item.variant_id) {
        // Decrementar stock de forma atómica
        const { data: currentVariant, error: fetchError } = await supabase
          .from('product_variants')
          .select('stock')
          .eq('id', item.variant_id)
          .single();
        
        if (fetchError) {
          console.error('Error obteniendo stock actual:', fetchError);
          continue;
        }
        
        const newStock = Math.max(0, currentVariant.stock - item.quantity);
        
        const { error: stockError } = await supabase
          .from('product_variants')
          .update({ 
            stock: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.variant_id);
        
        if (stockError) {
          console.error('Error actualizando stock:', stockError);
        }
      }
    }

    return order.id;
  }

  /**
   * Obtiene un token de acceso de PayPal
   */
  private async getPayPalAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch('https://api.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Confirma un pago de PayPal después de la aprobación del usuario
   */
  async confirmPayPalPayment(orderId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`https://api.paypal.com/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getPayPalAccessToken()}`
        }
      });

      const captureData = await response.json();

      if (!response.ok || captureData.status !== 'COMPLETED') {
        throw new Error('Error al confirmar el pago de PayPal');
      }

      return {
        success: true,
        paymentIntentId: orderId
      };

    } catch (error) {
      console.error('Error confirming PayPal payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al confirmar el pago de PayPal'
      };
    }
  }
}

export const checkoutService = new CheckoutService();
