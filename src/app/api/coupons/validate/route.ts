import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente administrativo solo disponible en el servidor
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { code, cartTotal } = await request.json()
    
    if (!code || !cartTotal) {
      return NextResponse.json(
        { error: 'Código de cupón y total del carrito son requeridos' },
        { status: 400 }
      )
    }

    // Buscar el cupón y verificar su validez
    const { data: coupon, error: fetchError } = await adminSupabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .single()

    if (fetchError || !coupon) {
      return NextResponse.json(
        { error: 'Cupón no válido o expirado' },
        { status: 404 }
      )
    }

    // Verificar si el carrito cumple con el monto mínimo
    if (coupon.minimum_amount && cartTotal < coupon.minimum_amount) {
      return NextResponse.json(
        { error: `El monto mínimo para este cupón es $${coupon.minimum_amount}` },
        { status: 400 }
      )
    }

    // Verificar límite de uso
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        { error: 'Este cupón ha alcanzado su límite de uso' },
        { status: 400 }
      )
    }

    // Calcular descuento
    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = (cartTotal * coupon.discount_value) / 100
      // Aplicar descuento máximo si existe
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount
      }
    } else {
      discountAmount = coupon.discount_value
    }

    // Actualizar contador de uso
    const { error: updateError } = await adminSupabase
      .from('coupons')
      .update({ used_count: coupon.used_count + 1 })
      .eq('id', coupon.id)

    if (updateError) {
      console.error('Error actualizando contador de cupón:', updateError)
      // No fallar la validación por este error
    }

    return NextResponse.json({
      isValid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount: coupon.max_discount
      },
      discountAmount
    })

  } catch (error) {
    console.error('Error validando cupón:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
