import supabase from '@/lib/supabaseClient';

/**
 * Obtiene las variantes de un producto con stock disponible
 */
export async function getProductVariants(productId: string) {
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, color, size, stock, image, sku, price_adjustment')
    .eq('product_id', productId)
    .gt('stock', 0) // Solo variantes con stock
    .order('color', { ascending: true })
    .order('size', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

/**
 * Obtiene todas las variantes de un producto (incluso sin stock) para admin
 */
export async function getAllProductVariants(productId: string) {
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, color, size, stock, image, sku, price_adjustment')
    .eq('product_id', productId)
    .order('color', { ascending: true })
    .order('size', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

/**
 * Obtiene colores únicos disponibles para un producto
 */
export async function getProductColors(productId: string) {
  const { data, error } = await supabase
    .from('product_variants')
    .select('color, image')
    .eq('product_id', productId)
    .gt('stock', 0);
  
  if (error) throw error;
  
  // Agrupa por color y toma la primera imagen
  const colorsMap = new Map();
  data?.forEach(variant => {
    if (!colorsMap.has(variant.color)) {
      colorsMap.set(variant.color, variant.image);
    }
  });
  
  return Array.from(colorsMap.entries()).map(([color, image]) => ({
    color,
    image
  }));
}

/**
 * Obtiene tallas disponibles para un producto y color específico
 */
export async function getProductSizes(productId: string, color?: string) {
  let query = supabase
    .from('product_variants')
    .select('size, stock')
    .eq('product_id', productId)
    .gt('stock', 0);
  
  if (color) {
    query = query.eq('color', color);
  }
  
  const { data, error } = await query.order('size', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

/**
 * Obtiene una variante específica por color y talla
 */
export async function getProductVariant(productId: string, color: string, size: string) {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('color', color)
    .eq('size', size)
    .single();
  
  if (error) throw error;
  
  // Asegurar que price_adjustment sea número
  if (data) {
    data.price_adjustment = Number(data.price_adjustment) || 0;
  }
  
  return data;
}

/**
 * Actualiza el stock de una variante
 */
export async function updateVariantStock(variantId: string, newStock: number) {
  const { error } = await supabase
    .from('product_variants')
    .update({ stock: newStock })
    .eq('id', variantId);
  
  if (error) throw error;
}

/**
 * Reserva stock temporalmente para una variante
 */
export async function reserveStock(userId: string, productId: string, variantId: string, color: string, size: string, quantity: number) {
  // Primero verificar stock disponible
  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .select('stock')
    .eq('id', variantId)
    .single();
  
  if (variantError) throw variantError;
  
  if (variant.stock < quantity) {
    throw new Error('Stock insuficiente');
  }
  
  // Crear reserva (expira en 15 minutos)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);
  
  const { error } = await supabase
    .from('stock_reservations')
    .insert({
      user_id: userId,
      product_id: productId,
      variant_id: variantId,
      color,
      size,
      quantity,
      expires_at: expiresAt.toISOString()
    });
  
  if (error) throw error;
}
