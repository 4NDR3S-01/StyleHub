import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(req: Request) {
  try {
    const { 
      cartItems,
      email,
      customerData,
      userId,
      metadata,
      orderId, 
      total, 
      amount, 
      currency = 'usd', 
      customerEmail, 
      savePaymentMethod = false,
      mode = 'checkout' // 'checkout' para Checkout Sessions, 'payment_intent' para PaymentIntents
    } = await req.json()

    // Validar datos requeridos
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (mode === 'payment_intent') {
      // Crear PaymentIntent para pagos directos con Elements
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amount || Math.round(total * 100),
        currency,
        metadata: { 
          orderId: orderId || '',
          userId: userId || '',
          ...(metadata || {})
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // Si se va a guardar el método de pago, configurar para uso futuro
      if (savePaymentMethod && userId) {
        paymentIntentData.setup_future_usage = 'off_session';
        if (customerEmail || email) {
          // Buscar o crear customer en Stripe
          const customers = await stripe.customers.list({
            email: customerEmail || email,
            limit: 1,
          });
          
          let customerId;
          if (customers.data.length > 0) {
            customerId = customers.data[0].id;
          } else {
            const customer = await stripe.customers.create({
              email: customerEmail,
              metadata: { userId },
            });
            customerId = customer.id;
          }
          
          paymentIntentData.customer = customerId;
        }
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
      
      return NextResponse.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } else {
      // Crear Checkout Session usando cartItems
      const line_items = cartItems.map((item: any) => {
        if (!item.producto || !item.producto.name || !item.producto.price) {
          throw new Error('Invalid product data in cart item');
        }

        return {
          price_data: {
            currency: 'cop', // Usar COP para Colombia
            product_data: {
              name: item.producto.name,
              description: item.producto.description || '',
              images: item.producto.images ? [item.producto.images[0]] : [],
            },
            unit_amount: Math.round(item.producto.price * 100), // Convertir a centavos
          },
          quantity: item.quantity,
        };
      });

      const sessionData: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        customer_email: email,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orden-confirmada?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?cancelled=true`,
        metadata: {
          userId: userId || '',
          ...(metadata || {})
        },
      };

      // Agregar información del cliente si está disponible
      if (customerData) {
        sessionData.shipping_address_collection = {
          allowed_countries: ['CO', 'US', 'MX', 'PE', 'CL', 'AR'],
        };
        
        if (customerData.name) {
          // Note: customer_details is not available in sessions, use customer_email instead
          // We'll handle customer details in the success callback
        }
      }

      const session = await stripe.checkout.sessions.create(sessionData);
      
      return NextResponse.json({ 
        id: session.id,
        url: session.url 
      });
    }
  } catch (error: any) {
    console.error('Error in Stripe API:', error);
    return NextResponse.json({ 
      error: error.message || 'Error creando sesión de Stripe' 
    }, { status: 500 });
  }
}