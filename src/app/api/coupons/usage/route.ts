import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente administrativo solo disponible en el servidor
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { couponId, userId, orderId, discountAmount } = await request.json()
    
    if (!couponId || !userId || !orderId || discountAmount === undefined) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // Registrar uso del cupón
    const { error: usageError } = await adminSupabase
      .from('coupon_usage')
      .insert([{
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount
      }])

    if (usageError) {
      console.error('Error registrando uso del cupón:', usageError)
      throw usageError
    }

    // Incrementar contador de usos - obtener el valor actual primero
    const { data: coupon, error: fetchError } = await adminSupabase
      .from('coupons')
      .select('used_count')
      .eq('id', couponId)
      .single()

    if (fetchError) {
      console.error('Error obteniendo datos del cupón:', fetchError)
      throw fetchError
    }

    if (coupon) {
      const { error: updateError } = await adminSupabase
        .from('coupons')
        .update({ used_count: coupon.used_count + 1 })
        .eq('id', couponId)

      if (updateError) {
        console.error('Error actualizando contador del cupón:', updateError)
        throw updateError
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error en registro de uso de cupón:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
