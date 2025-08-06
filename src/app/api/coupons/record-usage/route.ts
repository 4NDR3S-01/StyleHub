import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { couponId, orderId, userId, discountAmount } = await request.json();

    if (!couponId || !orderId || !userId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Registrar el uso del cupón
    const { error } = await supabase
      .from('coupon_usage')
      .insert({
        coupon_id: couponId,
        order_id: orderId,
        user_id: userId,
        discount_amount: discountAmount,
        used_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error recording coupon usage:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
