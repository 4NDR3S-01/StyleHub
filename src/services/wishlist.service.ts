import supabase from '@/lib/supabaseClient'

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  products?: any
}

/**
 * Obtiene la lista de productos favoritos de un usuario.  Devuelve un array
 * con las relaciones `wishlists` incluyendo los datos del producto.
 *
 * @param userId ID del usuario actual
 */
export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      id, 
      user_id, 
      product_id, 
      products:products(*, category:categories(id, name, slug))
    `)
    .eq('user_id', userId)
  if (error) throw error
  return data || []
}

/**
 * Añade un producto a la lista de favoritos.  Si ya existe, no hace nada.
 *
 * @param userId ID del usuario
 * @param productId ID del producto a añadir
 */
export async function addToWishlist(userId: string, productId: string) {
  const { error } = await supabase
    .from('wishlist')
    .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' })
  if (error) throw error
}

/**
 * Elimina un producto de la lista de favoritos del usuario.
 *
 * @param userId ID del usuario
 * @param productId ID del producto a eliminar
 */
export async function removeFromWishlist(userId: string, productId: string) {
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  if (error) throw error
}