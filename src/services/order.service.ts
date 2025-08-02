import supabase from '@/lib/supabaseClient'
import type { CartItem } from '@/types'

export class OrderService {
  /**
   * Obtener orden por ID
   */
  static async getOrderById(orderId: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (*)
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
  static async createOrder(
    userId: string,
    items: CartItem[],
    address: { street: string; city: string; state: string; zip: string; country: string },
    paymentMethod: 'card' | 'paypal',
  ) {
    // Calcular el total de la orden
    const total = items.reduce(
      (sum, item) => sum + item.producto.price * item.quantity,
      0,
    )
    // Insertar la orden principal
    const { data: order, error: errOrder } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total,
        status: 'pending',
        address: JSON.stringify(address),
        payment_method: paymentMethod,
      })
      .select()
      .single()
    if (errOrder) throw errOrder
    if (!order) throw new Error('No se pudo crear la orden')
    // Preparar items de la orden para insertar
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.producto.id,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      variant_id: item.variantId ?? null,
      price: item.producto.price,
    }))
    const { error: errItems } = await supabase
      .from('order_items')
      .insert(orderItems)
    if (errItems) throw errItems
    return order
  }
}

export default OrderService;