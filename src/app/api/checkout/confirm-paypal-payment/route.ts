import { NextRequest, NextResponse } from 'next/server';
import { checkoutService } from '@/services/checkout.service';

export async function POST(request: NextRequest) {
  try {
    const { paymentData, checkoutData } = await request.json();
    
    console.log('💳 Confirmando pago de PayPal:', { paymentData });
    console.log('📦 Datos de checkout recibidos:', JSON.stringify(checkoutData, null, 2));

    if (!paymentData || !checkoutData) {
      return NextResponse.json(
        { error: 'Payment data y datos de checkout requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el pago fue exitoso en PayPal
    if (paymentData.status !== 'COMPLETED') {
      return NextResponse.json(
        { 
          success: false,
          error: `Pago no completado. Estado: ${paymentData.status}` 
        },
        { status: 400 }
      );
    }

    console.log('✅ Pago confirmado en PayPal:', paymentData.status);

    // Crear la orden con el transaction_id de PayPal
    const orderId = await checkoutService.createOrder(checkoutData, paymentData.transaction_id);
    
    console.log('✅ Orden creada exitosamente:', orderId);

    return NextResponse.json({
      success: true,
      orderId,
      transactionId: paymentData.transaction_id
    });

  } catch (error) {
    console.error('❌ Error confirmando pago de PayPal:', error);
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
