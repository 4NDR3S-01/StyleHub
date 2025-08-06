import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(req: Request) {
  try {
    const { 
      orderId, 
      total, 
      amount, 
      currency = 'usd', 
      customerEmail, 
      savePaymentMethod = false,
      userId,
      mode = 'checkout' // 'checkout' para Checkout Sessions, 'payment_intent' para PaymentIntents
    } = await req.json()

    if (mode === 'payment_intent') {
      // Crear PaymentIntent para pagos directos con Elements
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amount || Math.round(total * 100),
        currency,
        metadata: { 
          orderId,
          userId: userId || '',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // Si se va a guardar el método de pago, configurar para uso futuro
      if (savePaymentMethod && userId) {
        paymentIntentData.setup_future_usage = 'off_session';
        if (customerEmail) {
          // Buscar o crear customer en Stripe
          const customers = await stripe.customers.list({
            email: customerEmail,
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
      // Crear Checkout Session (comportamiento original)
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Pedido #${orderId}`,
              },
              unit_amount: Math.round(total * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout/cancel`,
        metadata: { orderId },
      });
      
      return NextResponse.json({ sessionId: session.id });
    }
  } catch (error: any) {
    console.error('Error in Stripe API:', error);
    return NextResponse.json({ 
      error: error.message || 'Error creando sesión de Stripe' 
    }, { status: 500 });
  }
}