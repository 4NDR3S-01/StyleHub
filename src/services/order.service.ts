import supabase from '@/lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'
import type { CartItem } from '@/context/CartContext'

// Cliente administrativo para operaciones que requieren bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Debug: verificar si tenemos service role key
console.log('Service role key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

/**
 * Obtener orden por ID
 */
export async function getOrderById(orderId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*),
          variant:product_variants (*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Error al obtener orden');
  }
}

/**
 * Función de prueba para verificar la conexión con Supabase
 */
export async function testSupabaseConnection() {
  try {
    console.log('Probando conexión con Supabase...');
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Test auth:', user ? 'Usuario autenticado' : 'No autenticado', authError);
    
    // Verificar acceso a tabla orders
    const { data: ordersTest, error: ordersError } = await supabase
      .from('orders')
      .select('count')
      .limit(1);
    console.log('Test orders table:', ordersTest, ordersError);
    
    // Verificar acceso a tabla order_items
    const { data: itemsTest, error: itemsError } = await supabase
      .from('order_items')
      .select('count')
      .limit(1);
    console.log('Test order_items table:', itemsTest, itemsError);
    
    // Verificar acceso a tabla products
    const { data: productsTest, error: productsError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    console.log('Test products table:', productsTest, productsError);
    
    return {
      auth: !authError,
      orders: !ordersError,
      orderItems: !itemsError,
      products: !productsError
    };
  } catch (error) {
    console.error('Error en test de conexión:', error);
    return null;
  }
}

/**
 * Obtener todas las órdenes del usuario autenticado
 */
export async function getUserOrders() {
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error de autenticación:', authError);
      throw new Error('Error de autenticación: ' + authError.message);
    }
    
    if (!user) {
      console.error('Usuario no autenticado');
      throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
    }

    console.log('Usuario autenticado:', user.id);

    // Primero verificar si la tabla orders existe
    const { error: tableError } = await supabase
      .from('orders')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('Error verificando tabla orders:', tableError);
      if (tableError.code === '42P01') {
        throw new Error('La tabla de pedidos no existe. Contacta al administrador.');
      }
      throw new Error('Error de base de datos: ' + tableError.message);
    }

    console.log('Tabla orders verificada correctamente');

    // Primero intentar una consulta simple
    const { data: simpleData, error: simpleError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (simpleError) {
      console.error('Error en consulta simple de órdenes:', simpleError);
      throw new Error('Error al acceder a las órdenes: ' + simpleError.message);
    }

    console.log('Órdenes encontradas (consulta simple):', simpleData?.length || 0);

    // Si la consulta simple funciona, intentar la consulta completa
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (*),
          variant:product_variants (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error en consulta completa de órdenes:', error);
      // Si falla la consulta completa, devolver la simple
      return simpleData || [];
    }

    console.log('Órdenes encontradas (consulta completa):', data?.length || 0);
    return data || [];
  } catch (error: any) {
    console.error('Error al obtener órdenes del usuario:', error);
    throw new Error(error.message || 'Error al obtener órdenes');
  }
}

/**
 * Actualizar estado de una orden
 */
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Error al actualizar orden');
  }
}

/**
 * Crea una nueva orden y sus items en la base de datos.  Calcula el total
 * automáticamente a partir de los elementos del carrito y establece el
 * estado inicial como `pending`.  Recibe además la dirección de envío
 * serializada y el método de pago seleccionado.
 *
 * @param userId ID del usuario que realiza la compra
 * @param items Array de elementos del carrito
 * @param address Objeto con los datos de dirección (street, city, state, zip, country)
 * @param paymentMethod Método de pago ('card' o 'paypal')
 */
export async function createOrder(
  userId: string,
  items: CartItem[],
  address: { street: string; city: string; state: string; zip: string; country: string },
  paymentMethod: 'stripe' | 'paypal',
  shippingCost?: number,
  taxRate?: number
) {
  try {
    console.log('createOrder called with:', { userId, itemsCount: items.length, address, paymentMethod, shippingCost, taxRate });
    
    // Calcular el subtotal (solo productos)
    const subtotal = items.reduce(
      (sum, item) => sum + item.producto.price * item.quantity,
      0,
    )
    
    // Calcular impuestos y envío
    const tax = subtotal * (taxRate || 0.19); // 19% IVA por defecto
    const shipping = shippingCost || (subtotal >= 200000 ? 0 : 15000); // Envío gratis si > $200k, sino $15k
    const total = subtotal + tax + shipping;
    
    console.log('Order calculations:', { subtotal, tax, shipping, total });
    
    // Insertar la orden principal
    const { data: order, error: errOrder } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total,
        subtotal,
        tax,
        shipping,
        status: 'pending',
        address: JSON.stringify(address),
        payment_method: paymentMethod,
      })
      .select()
      .single()
      
    console.log('Order insert result:', { order, error: errOrder });
    
    if (errOrder) {
      console.error('Order creation error:', errOrder);
      throw errOrder;
    }
    if (!order) throw new Error('No se pudo crear la orden')
  // Preparar items de la orden para insertar
  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.producto.id,
    quantity: item.quantity,
    size: item.variant?.size || null,
    color: item.variant?.color || null,
    variant_id: item.variant?.id || null,
    price: item.producto.price,
  }))
  
  // Usar cliente administrativo para insertar order_items (bypass RLS)
  console.log('Attempting to insert order items with admin client...', orderItems);
  const { error: errItems } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems)
  
  console.log('Order items insert result:', { error: errItems });
  
  if (errItems) {
    console.error('Order items insert error:', errItems);
    throw errItems;
  }
  
  console.log('Order created successfully:', order);
  return order;
  
  } catch (error) {
    console.error('createOrder function error:', error);
    throw error;
  }
}
