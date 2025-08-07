import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil'
});

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentIntentId } = await request.json();
    
    console.log('🔄 Confirmando pago para orden:', orderId, 'PaymentIntent:', paymentIntentId);

    // Validar parámetros
    const validationError = validateParams(orderId, paymentIntentId);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Verificar orden
    const order = await verifyOrder(orderId);
    if (!order.success) {
      return NextResponse.json({ error: order.error }, { status: order.status });
    }

    // Verificar pago
    const payment = await verifyPayment(paymentIntentId);
    if (!payment.success) {
      return NextResponse.json({ error: payment.error }, { status: payment.status });
    }

    // Actualizar orden
    const updateResult = await updateOrderStatus(orderId, paymentIntentId);
    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 500 });
    }

    // Actualizar inventario
    await updateInventory(orderId);

    console.log('✅ Pago confirmado exitosamente para orden:', orderId);

    return NextResponse.json({
      success: true,
      orderId,
      paymentIntentId,
      message: 'Pago confirmado exitosamente'
    });

  } catch (error) {
    console.error('Error in confirm-payment API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

function validateParams(orderId: string, paymentIntentId: string) {
  if (!orderId || !paymentIntentId) {
    return 'Orden ID y Payment Intent ID son requeridos';
  }
  return null;
}

async function verifyOrder(orderId: string) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status, total') // Usar nombre correcto del campo
    .eq('id', orderId)
    .eq('status', 'pending')
    .single();

  if (orderError || !order) {
    return { 
      success: false, 
      error: 'Orden no encontrada o ya procesada', 
      status: 404 
    };
  }

  return { success: true, data: order };
}

async function verifyPayment(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status !== 'succeeded') {
    return { 
      success: false, 
      error: 'El pago no ha sido completado exitosamente', 
      status: 400 
    };
  }

  return { success: true, data: paymentIntent };
}

async function updateOrderStatus(orderId: string, paymentIntentId: string) {
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'completed',
      payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('Error actualizando orden:', updateError);
    return { success: false, error: 'Error al actualizar la orden' };
  }

  return { success: true };
}

async function updateInventory(orderId: string) {
  const { data: orderItems, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('variant_id, quantity')
    .eq('order_id', orderId);

  if (itemsError || !orderItems) return;

  for (const item of orderItems) {
    await updateVariantStock(item.variant_id, item.quantity);
  }
}

async function updateVariantStock(variantId: string, quantity: number) {
  if (!variantId) return;

  const { data: currentVariant, error: fetchError } = await supabaseAdmin
    .from('product_variants')
    .select('stock')
    .eq('id', variantId)
    .single();
  
  if (fetchError) {
    console.error('Error obteniendo stock actual:', fetchError);
    return;
  }
  
  const newStock = Math.max(0, currentVariant.stock - quantity);
  
  const { error: stockError } = await supabaseAdmin
    .from('product_variants')
    .update({ 
      stock: newStock,
      updated_at: new Date().toISOString()
    })
    .eq('id', variantId);
  
  if (stockError) {
    console.error('Error actualizando stock:', stockError);
  }
}
