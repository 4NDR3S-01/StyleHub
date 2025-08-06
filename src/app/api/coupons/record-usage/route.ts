import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente administrativo con service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { couponId, userId, orderId, discountAmount } = await request.json();

    // Validar parámetros requeridos
    if (!couponId || !userId || !orderId || discountAmount === undefined) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Registrar uso del cupón
    const { error: usageError } = await supabaseAdmin
      .from('coupon_usage')
      .insert([{
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount
      }]);

    if (usageError) {
      console.error('Error inserting coupon usage:', usageError);
      throw usageError;
    }

    // Incrementar contador de usos
    const { data: coupon, error: fetchError } = await supabaseAdmin
      .from('coupons')
      .select('used_count')
      .eq('id', couponId)
      .single();

    if (fetchError) {
      console.error('Error fetching coupon:', fetchError);
      throw fetchError;
    }

    if (coupon) {
      const { error: updateError } = await supabaseAdmin
        .from('coupons')
        .update({ used_count: coupon.used_count + 1 })
        .eq('id', couponId);

      if (updateError) {
        console.error('Error updating coupon count:', updateError);
        throw updateError;
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error recording coupon usage:', error);
    return NextResponse.json(
      { error: 'Error al registrar uso del cupón', details: error.message },
      { status: 500 }
    );
  }
}
