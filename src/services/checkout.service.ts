import supabase from '@/lib/supabaseClient';
import supabaseAdmin from '@/lib/supabaseAdmin';
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
    name: string;
    phone?: string;
  };
  paymentMethod: {
    type: 'card' | 'paypal' | 'stripe';
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
  clientSecret?: string; // Para Stripe nuevos métodos
}

class CheckoutService {
  /**
   * Procesa el checkout completo siguiendo el flujo ético:
   * 1. Valida datos
   * 2. Procesa el pago
   * 3. Solo si el pago es exitoso O requiere confirmación, procede
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

      // 3a. Si el pago requiere confirmación (nueva tarjeta), devolver clientSecret
      if (paymentResult.clientSecret) {
        return {
          success: true,
          paymentIntentId: paymentResult.paymentIntentId,
          clientSecret: paymentResult.clientSecret
        };
      }

      // 3b. Si el pago fue exitoso inmediatamente (método guardado), crear la orden
      if (paymentResult.paymentIntentId) {
        const orderId = await this.createOrder(checkoutData, paymentResult.paymentIntentId);
        return {
          success: true,
          orderId,
          paymentIntentId: paymentResult.paymentIntentId
        };
      }

      // 3c. Si es PayPal, devolver success - el frontend manejará la orden
      if (checkoutData.paymentMethod.type === 'paypal') {
        return {
          success: true,
          paymentIntentId: 'paypal-pending' // Placeholder
        };
      }

      return {
        success: false,
        error: 'Resultado de pago inesperado'
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

      // Si es un método guardado de Stripe
      if (checkoutData.paymentMethod.savedMethodId && 
          checkoutData.paymentMethod.savedMethodId !== 'new-card' &&
          checkoutData.paymentMethod.savedMethodId !== 'new-paypal') {
        
        // Obtener el external_id del método guardado
        const { data: savedMethod, error: methodError } = await supabase
          .from('user_payment_methods')
          .select('external_id, type')
          .eq('id', checkoutData.paymentMethod.savedMethodId)
          .eq('user_id', checkoutData.userId)
          .single();

        if (methodError || !savedMethod) {
          throw new Error('Método de pago guardado no encontrado');
        }

        // Para métodos de Stripe (tarjetas), usar el external_id como payment_method
        if (savedMethod.type === 'stripe') {
          paymentIntentData.payment_method = savedMethod.external_id;
          paymentIntentData.confirm = true;
          paymentIntentData.return_url = `${process.env.NEXT_PUBLIC_APP_URL}/orden-confirmada`;
        }
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      // Si es método guardado y se confirma automáticamente
      if (checkoutData.paymentMethod.savedMethodId && 
          paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntentId: paymentIntent.id
        };
      }

      // Para nuevos métodos, devolver client_secret para confirmar en frontend
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined
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
      console.log('Validando stock para item:', { 
        product_id: item.id, 
        variant_id: item.variant_id, 
        quantity: item.quantity,
        color: item.color,
        size: item.size 
      });

      // Usar variant_id para validar stock específico de la variante
      if (!item.variant_id) {
        return { isValid: false, error: `Variante no especificada para el producto ${item.id}` };
      }

      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('stock, color, size')
        .eq('id', item.variant_id)
        .single();

      console.log('Resultado de consulta variant:', { variant, variantError });

      if (variantError) {
        console.error('Error al consultar variante:', variantError);
        return { isValid: false, error: `Error al consultar variante ${item.variant_id}: ${variantError.message}` };
      }

      if (!variant || variant.stock < item.quantity) {
        return { isValid: false, error: `Stock insuficiente para la variante ${item.variant_id} (${variant?.color} ${variant?.size}). Stock disponible: ${variant?.stock || 0}, solicitado: ${item.quantity}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Procesa el pago según el método seleccionado
   */
  private async processPayment(data: CheckoutData): Promise<PaymentResult> {
    console.log('Procesando pago con método:', data.paymentMethod);
    
    switch (data.paymentMethod.type) {
      case 'card':
      case 'stripe':
        return this.processStripeCheckout(data);
      case 'paypal':
        // PayPal es manejado completamente por el frontend usando @paypal/react-paypal-js
        // El backend solo necesita crear la orden después de la confirmación
        return {
          success: true,
          paymentIntentId: 'paypal-frontend-handled'
        };
      default:
        return {
          success: false,
          error: `Método de pago no soportado: ${data.paymentMethod.type}`
        };
    }
  }

  /**
   * Crea la orden en la base de datos SOLO después de que el pago sea exitoso
   * MÉTODO PÚBLICO para uso desde API de confirmación
   */
  async createOrder(data: CheckoutData, paymentIntentId: string): Promise<string> {
    console.log('🏪 Iniciando creación de orden con datos:', JSON.stringify({
      userId: data.userId,
      itemsCount: data.items?.length,
      total: data.total,
      shippingAddress: data.shippingAddress,
      paymentMethod: data.paymentMethod
    }, null, 2));

    // Validar datos requeridos
    if (!data.userId) {
      throw new Error('userId es requerido');
    }
    if (!data.items || data.items.length === 0) {
      throw new Error('items son requeridos');
    }
    if (!data.shippingAddress) {
      throw new Error('shippingAddress es requerida');
    }
    if (!paymentIntentId) {
      throw new Error('paymentIntentId es requerido');
    }

    // Generar número de orden único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    
    const orderData = {
      user_id: data.userId,
      order_number: orderNumber,
      status: 'confirmed', // Estado de orden: confirmada después de pago exitoso
      total: data.total || 0, // Campo correcto según esquema
      subtotal: data.subtotal || 0,
      shipping: data.shipping || 0, // Campo correcto según esquema
      tax: data.tax || 0, // Campo correcto según esquema
      discount: data.couponDiscount || 0, // Campo correcto según esquema
      payment_intent_id: paymentIntentId,
      payment_status: 'paid', // Estado de pago: pagado
      payment_method: data.paymentMethod.type === 'card' ? 'stripe' : data.paymentMethod.type,
      // Usar address como JSONB según el esquema
      address: {
        name: data.shippingAddress.name,
        phone: data.shippingAddress.phone,
        street: data.shippingAddress.street,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        postal_code: data.shippingAddress.postal_code,
        country: data.shippingAddress.country
      },
      // También guardar en shipping_address para compatibilidad
      shipping_address: {
        name: data.shippingAddress.name,
        phone: data.shippingAddress.phone,
        street: data.shippingAddress.street,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        postal_code: data.shippingAddress.postal_code,
        country: data.shippingAddress.country
      },
      created_at: new Date().toISOString()
    };

    console.log('📝 Datos de orden a insertar:', JSON.stringify(orderData, null, 2));
    
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error al insertar orden:', error);
      throw new Error(`Error al crear la orden: ${error.message || 'Error desconocido'}`);
    }

    console.log('✅ Orden creada exitosamente con ID:', order.id);

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

    console.log('📋 Insertando items de orden:', JSON.stringify(orderItems, null, 2));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('❌ Error al insertar items de orden:', itemsError);
      throw new Error(`Error al crear los items de la orden: ${itemsError.message || 'Error desconocido'}`);
    }

    console.log('✅ Items de orden creados exitosamente');

    // Registrar uso de cupón si se aplicó uno
    if (data.couponCode && data.couponDiscount && data.couponDiscount > 0) {
      console.log('🎫 Registrando uso de cupón:', data.couponCode);
      await this.recordCouponUsage(data.couponCode, data.userId, order.id, data.couponDiscount);
    }

    // Actualizar inventario de variantes
    console.log('📦 Actualizando inventario...');
    for (const item of data.items) {
      if (item.variant_id) {
        // Decrementar stock de forma atómica
        const { data: currentVariant, error: fetchError } = await supabaseAdmin
          .from('product_variants')
          .select('stock')
          .eq('id', item.variant_id)
          .single();
        
        if (fetchError) {
          console.error('Error obteniendo stock actual:', fetchError);
          continue;
        }
        
        const newStock = Math.max(0, currentVariant.stock - item.quantity);
        
        const { error: stockError } = await supabaseAdmin
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

    console.log('🎉 Orden completada exitosamente con ID:', order.id);
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
   * Registra el uso de un cupón en la tabla coupon_usage
   */
  private async recordCouponUsage(couponCode: string, userId: string, orderId: string, discountAmount: number): Promise<void> {
    try {
      // Buscar el cupón por código
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('id')
        .eq('code', couponCode)
        .eq('active', true)
        .single();

      if (couponError || !coupon) {
        console.error('Cupón no encontrado:', couponCode);
        return;
      }

      // Registrar el uso del cupón
      const { error: usageError } = await supabaseAdmin
        .from('coupon_usage')
        .insert({
          coupon_id: coupon.id,
          user_id: userId,
          order_id: orderId,
          discount_amount: discountAmount,
          used_at: new Date().toISOString()
        });

      if (usageError) {
        console.error('Error registrando uso de cupón:', usageError);
      }

      // Incrementar contador de uso del cupón
      const { error: updateError } = await supabaseAdmin
        .rpc('increment_coupon_usage', { coupon_id: coupon.id });

      if (updateError) {
        console.error('Error actualizando contador de cupón:', updateError);
        // Fallback: usar una consulta manual para obtener el contador actual
        const { data: currentCoupon } = await supabaseAdmin
          .from('coupons')
          .select('used_count')
          .eq('id', coupon.id)
          .single();
        
        if (currentCoupon) {
          await supabaseAdmin
            .from('coupons')
            .update({ 
              used_count: currentCoupon.used_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', coupon.id);
        }
      }

    } catch (error) {
      console.error('Error en recordCouponUsage:', error);
    }
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
