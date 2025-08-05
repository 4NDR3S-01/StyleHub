import supabase from '@/lib/supabaseClient';

export interface StockCheck {
  productId: string;
  variantId?: string;
  requestedQuantity: number;
  availableStock: number;
  isAvailable: boolean;
}

export interface StockReservation {
  id: string;
  user_id: string;
  product_id: string;
  color: string;
  size: string;
  quantity: number;
  expires_at: string;
  created_at: string;
}

/**
 * Verifica la disponibilidad de stock para items del carrito
 */
export async function checkCartStock(cartItems: any[]): Promise<StockCheck[]> {
  const stockChecks: StockCheck[] = [];
  
  for (const item of cartItems) {
    try {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('id, stock')
        .eq('product_id', item.producto.id)
        .eq('color', item.color)
        .eq('size', item.size)
        .single();

      const availableStock = variant?.stock || 0;
      
      stockChecks.push({
        productId: item.producto.id,
        variantId: variant?.id,
        requestedQuantity: item.quantity,
        availableStock,
        isAvailable: availableStock >= item.quantity
      });
    } catch (error) {
      console.error(`Error checking stock for product ${item.producto.id}:`, error);
      stockChecks.push({
        productId: item.producto.id,
        requestedQuantity: item.quantity,
        availableStock: 0,
        isAvailable: false
      });
    }
  }
  
  return stockChecks;
}

/**
 * Reserva stock temporalmente durante el checkout
 */
export async function reserveStock(cartItems: any[], userId: string): Promise<boolean> {
  try {
    // Limpiar reservas expiradas primero
    await cleanExpiredReservations();
    
    // Verificar stock disponible
    const stockChecks = await checkCartStock(cartItems);
    const unavailableItems = stockChecks.filter(check => !check.isAvailable);
    
    if (unavailableItems.length > 0) {
      console.error('Items sin stock suficiente:', unavailableItems);
      return false;
    }

    // Crear reservas temporales (expiran en 30 minutos)
    const reservations = cartItems.map(item => ({
      user_id: userId,
      product_id: item.producto.id,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }));
    
    const { error } = await supabase
      .from('stock_reservations')
      .insert(reservations);
    
    if (error) {
      console.error('Error creating reservations:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error reserving stock:', error);
    return false;
  }
}

/**
 * Libera las reservas de stock de un usuario
 */
export async function releaseReservations(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('stock_reservations')
      .delete()
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error releasing reservations:', error);
    }
  } catch (error) {
    console.error('Error releasing reservations:', error);
  }
}

/**
 * Limpia reservas expiradas
 */
export async function cleanExpiredReservations(): Promise<void> {
  try {
    const { error } = await supabase
      .from('stock_reservations')
      .delete()
      .lt('expires_at', new Date().toISOString());
      
    if (error) {
      console.error('Error cleaning expired reservations:', error);
    }
  } catch (error) {
    console.error('Error cleaning expired reservations:', error);
  }
}

/**
 * Actualiza el stock después de una compra exitosa
 */
export async function updateStockAfterPurchase(orderItems: any[]): Promise<boolean> {
  try {
    for (const item of orderItems) {
      const { error } = await supabase.rpc('update_product_stock', {
        p_product_id: item.product_id,
        p_color: item.color,
        p_size: item.size,
        p_quantity: -item.quantity // Resta del stock
      });
      
      if (error) {
        console.error(`Error updating stock for product ${item.product_id}:`, error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating stock after purchase:', error);
    return false;
  }
}

/**
 * Verifica si un producto específico tiene stock
 */
export async function checkProductStock(productId: string, color: string, size: string, quantity: number = 1): Promise<boolean> {
  try {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('product_id', productId)
      .eq('color', color)
      .eq('size', size)
      .single();

    return (variant?.stock || 0) >= quantity;
  } catch (error) {
    console.error('Error checking product stock:', error);
    return false;
  }
}
