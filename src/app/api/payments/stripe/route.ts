import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'usd', payment_method_id, customer_id, save_payment_method } = body;

    // Crear el PaymentIntent
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convertir a centavos
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Si hay un método de pago específico
    if (payment_method_id) {
      paymentIntentData.payment_method = payment_method_id;
      paymentIntentData.confirmation_method = 'manual';
      paymentIntentData.confirm = true;
    }

    // Si hay un customer_id, asociarlo
    if (customer_id) {
      paymentIntentData.customer = customer_id;
    }

    // Si queremos guardar el método de pago
    if (save_payment_method) {
      paymentIntentData.setup_future_usage = 'off_session';
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });

  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const payment_intent_id = searchParams.get('payment_intent_id');

  if (!payment_intent_id) {
    return NextResponse.json(
      { error: 'payment_intent_id is required' },
      { status: 400 }
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    return NextResponse.json({
      status: paymentIntent.status,
      payment_method: paymentIntent.payment_method,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });

  } catch (error: any) {
    console.error('Error retrieving payment intent:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
