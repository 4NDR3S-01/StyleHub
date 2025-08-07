import { NextRequest, NextResponse } from 'next/server';
import { checkoutService } from '@/services/checkout.service';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil'
});

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, checkoutData } = await request.json();
    
    console.log('💳 Confirmando pago de Stripe:', { paymentIntentId });
    console.log('📦 Datos de checkout recibidos:', JSON.stringify(checkoutData, null, 2));

    if (!paymentIntentId || !checkoutData) {
      return NextResponse.json(
        { error: 'Payment Intent ID y datos de checkout requeridos' },
        { status: 400 }
      );
    }

    // 1. Verificar que el pago fue exitoso en Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { 
          success: false,
          error: `Pago no completado. Estado: ${paymentIntent.status}` 
        },
        { status: 400 }
      );
    }

    console.log('✅ Pago confirmado en Stripe:', paymentIntent.status);

    // 2. Solo AHORA crear la orden porque el pago fue exitoso
    const orderId = await checkoutService.createOrder(checkoutData, paymentIntentId);
    
    console.log('✅ Orden creada exitosamente:', orderId);

    return NextResponse.json({
      success: true,
      orderId,
      paymentIntentId
    });

  } catch (error) {
    console.error('❌ Error confirmando pago de Stripe:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
