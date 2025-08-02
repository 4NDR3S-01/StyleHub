import supabase from '@/lib/supabaseClient'

/**
 * Devuelve un producto por su ID incluyendo sus variantes.
 * Utiliza las relaciones definidas en la tabla `product_variants` para
 * recuperar colores, tallas y stock disponibles.
 *
 * @param id Identificador del producto
 */
export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(id,color,size,stock,image)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Obtiene una categoría a partir de su `slug`.  El slug se utiliza en las URLs
 * legibles (por ejemplo `/category/women`).  Devuelve la fila completa con
 * `id`, `name`, `slug` y `description`.  Si no se encuentra la categoría
 * devuelve `null`.
 *
 * @param slug Slug de la categoría
 */
export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('id,name,slug,description')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

/**
 * Devuelve todos los productos pertenecientes a una categoría cuyo slug se
 * proporciona.  Internamente obtiene primero la categoría por slug y luego
 * busca los productos cuyo `category_id` coincide con el ID de esa categoría.
 * También incluye las variantes de cada producto.
 *
 * @param slug Slug de la categoría
 */
export async function getProductsByCategorySlug(slug: string) {
  const category = await getCategoryBySlug(slug)
  if (!category) return []
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(id,color,size,stock,image)')
    .eq('category_id', category.id)
  if (error) throw error
  return data || []
}

/**
 * Busca productos por nombre, descripción o tags
 * @param query Término de búsqueda
 */
export async function searchProducts(query: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(id,color,size,stock,image)')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * Obtiene todas las categorías principales
 */
export async function getAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('name')
  
  if (error) throw error
  return data || []
}

/**
 * Obtiene productos destacados
 */
export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(id,color,size,stock,image)')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(8)
  
  if (error) throw error
  return data || []
}