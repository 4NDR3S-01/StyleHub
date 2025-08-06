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
    .select('id,rating,comment,created_at,user_id,users(name,avatar)')
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
  // Validaciones básicas
  if (!productId || !userId) {
    throw new Error('ID del producto y del usuario son requeridos')
  }
  
  if (rating < 1 || rating > 5) {
    throw new Error('La calificación debe estar entre 1 y 5')
  }
  
  if (!comment.trim()) {
    throw new Error('El comentario es requerido')
  }

  console.log('Enviando reseña a Supabase:', { productId, userId, rating, comment })

  try {
    // Primero verificar si ya existe una reseña del usuario para este producto
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 significa "no rows found", cualquier otro error es problemático
      console.error('Error al verificar reseña existente:', checkError)
      throw new Error(`Error al verificar reseña existente: ${checkError.message}`)
    }

    let data, error

    if (existingReview) {
      // Actualizar reseña existente
      console.log('Actualizando reseña existente con ID:', existingReview.id)
      const result = await supabase
        .from('reviews')
        .update({
          rating,
          comment: comment.trim(),
          approved: false, // Resetear aprobación cuando se actualiza
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
      
      data = result.data
      error = result.error
    } else {
      // Crear nueva reseña
      console.log('Creando nueva reseña')
      const result = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: userId,
          rating,
          comment: comment.trim(),
          approved: false,
          created_at: new Date().toISOString()
        })
        .select()
      
      data = result.data
      error = result.error
    }
    
    if (error) {
      console.error('Error de Supabase:', error)
      throw new Error(`Error de base de datos: ${error.message}`)
    }
    
    console.log('Reseña enviada exitosamente:', data)
    return data
  } catch (error) {
    console.error('Error en submitReview:', error)
    throw error
  }
}

/**
 * Obtiene todas las reseñas aprobadas para mostrar como testimonios en la página principal
 */
export async function getApprovedReviewsForTestimonials(limit: number = 6) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      users(name, email, avatar),
      products(name)
    `)
    .eq('approved', true)
    .not('comment', 'is', null)
    .neq('comment', '')
    .order('created_at', { ascending: false })
    .limit(limit)
    
  if (error) throw error
  
  // Formatear para que coincida con la interfaz de testimonios
  return (data || []).map((review: any) => ({
    id: review.id,
    name: review.users?.name || 'Cliente Anónimo',
    email: review.users?.email || '',
    rating: review.rating,
    text: review.comment,
    avatar: review.users?.avatar || null,
    approved: true,
    created_at: review.created_at,
    product_name: review.products?.name
  }))
}