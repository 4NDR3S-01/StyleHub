import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    
    console.log('📝 Creando orden pendiente:', JSON.stringify(orderData, null, 2));

    // Validar que el usuario esté autenticado
    if (!orderData.userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Validar items
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'No hay productos en el carrito' },
        { status: 400 }
      );
    }

    // Validar stock antes de crear la orden
    for (const item of orderData.items) {
      if (!item.variant_id) {
        return NextResponse.json(
          { error: `Variante no especificada para el producto ${item.id}` },
          { status: 400 }
        );
      }

      const { data: variant, error: variantError } = await supabaseAdmin
        .from('product_variants')
        .select('stock, color, size')
        .eq('id', item.variant_id)
        .single();

      if (variantError || !variant) {
        return NextResponse.json(
          { error: `Error al consultar variante ${item.variant_id}` },
          { status: 400 }
        );
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json(
          { 
            error: `Stock insuficiente para la variante ${variant.color} ${variant.size}. Stock disponible: ${variant.stock}, solicitado: ${item.quantity}` 
          },
          { status: 400 }
        );
      }
    }

    // Crear la orden pendiente
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: orderData.userId,
        order_number: orderNumber,
        status: 'pending', // Estado pendiente hasta que se complete el pago
        total: orderData.total, // Campo correcto según esquema
        subtotal: orderData.subtotal,
        shipping: orderData.shipping, // Campo correcto según esquema  
        tax: orderData.tax, // Campo correcto según esquema
        discount: orderData.couponDiscount, // Campo correcto según esquema
        payment_status: 'pending',
        payment_method: 'stripe', // Por defecto stripe para nuevas tarjetas
        // Usar address como JSONB según el esquema
        address: {
          name: orderData.shippingAddress.name,
          phone: orderData.shippingAddress.phone,
          street: orderData.shippingAddress.street,
          city: orderData.shippingAddress.city,
          state: orderData.shippingAddress.state,
          postal_code: orderData.shippingAddress.postal_code,
          country: orderData.shippingAddress.country
        },
        // También guardar en shipping_address para compatibilidad
        shipping_address: {
          name: orderData.shippingAddress.name,
          phone: orderData.shippingAddress.phone,
          street: orderData.shippingAddress.street,
          city: orderData.shippingAddress.city,
          state: orderData.shippingAddress.state,
          postal_code: orderData.shippingAddress.postal_code,
          country: orderData.shippingAddress.country
        },
        created_at: new Date().toISOString()
        // Nota: expires_at no está en el esquema actual, se maneja por aplicación
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Error creando orden:', orderError);
      return NextResponse.json(
        { error: `Error al crear la orden: ${orderError.message}` },
        { status: 500 }
      );
    }

    // Crear los items de la orden
    const orderItems = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: item.price,
      product_name: '', // Se completará por trigger en la BD
      variant_name: item.size && item.color ? `${item.size} ${item.color}`.trim() : '',
      total: item.price * item.quantity
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creando items de orden:', itemsError);
      // Eliminar la orden si falló la creación de items
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      
      return NextResponse.json(
        { error: `Error al crear los items de la orden: ${itemsError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Orden pendiente creada exitosamente:', order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Orden pendiente creada exitosamente'
    });

  } catch (error) {
    console.error('Error in create-pending API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
