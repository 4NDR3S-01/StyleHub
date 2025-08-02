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
 * Obtiene todos los productos con opción de filtrado
 * @param options Opciones de filtrado
 */
export async function getAllProducts(options: {
  featured?: boolean;
  sale?: boolean;
  category?: string;
  limit?: number;
  gender?: string;
} = {}) {
  let query = supabase
    .from('products')
    .select('*, product_variants(id,color,size,stock,image)')

  if (options.featured !== undefined) {
    query = query.eq('featured', options.featured)
  }
  
  if (options.sale !== undefined) {
    query = query.eq('sale', options.sale)
  }
  
  if (options.category) {
    const category = await getCategoryBySlug(options.category)
    if (category) {
      query = query.eq('category_id', category.id)
    }
  }
  
  if (options.gender) {
    query = query.eq('gender', options.gender)
  }
  
  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Obtiene productos destacados
 */
export async function getFeaturedProducts() {
  return getAllProducts({ featured: true, limit: 6 })
}

/**
 * Obtiene todas las categorías
 */
export async function getAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data || []
}

/**
 * Busca productos por nombre o descripción
 */
export async function searchProducts(query: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_variants(id,color,size,stock,image)')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
  
  if (error) throw error
  return data || []
}