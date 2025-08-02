import supabase from '@/lib/supabaseClient'

/**
 * Obtiene las reseñas aprobadas de un producto.  Las reseñas aprobadas tienen
 * el campo `approved` en true.  Devuelve un array con las reseñas más
 * recientes primero, incluyendo la información básica del usuario que la
 * escribió (nombre y avatar).
 *
 * @param productId ID del producto
 */
export async function getApprovedReviews(productId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id,rating,comment,created_at,user_id,users(name,avatar_url)')
    .eq('product_id', productId)
    .eq('approved', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Envía una reseña para un producto.  Inserta una nueva fila en la tabla
 * `reviews` con `approved` en false para que los administradores la aprueben.
 * Si ya existe una reseña del mismo usuario para el producto, la reemplaza.
 *
 * @param productId ID del producto
 * @param userId ID del usuario
 * @param rating Puntuación de 1 a 5
 * @param comment Comentario del usuario
 */
export async function submitReview(
  productId: string,
  userId: string,
  rating: number,
  comment: string
) {
  const { data, error } = await supabase
    .from('reviews')
    .upsert({ product_id: productId, user_id: userId, rating, comment, approved: false }, { onConflict: 'product_id,user_id' })
  if (error) throw error
  return data
}