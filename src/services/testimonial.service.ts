import supabase from '@/lib/supabaseClient';

export interface Testimonial {
  id: string;
  name: string;
  email: string;
  rating: number;
  text: string;
  avatar?: string;
  approved: boolean;
  created_at: string;
}

export interface CreateTestimonialData {
  name: string;
  email: string;
  rating: number;
  text: string;
  avatar?: string;
}

/**
 * Obtiene testimonios aprobados para mostrar en el sitio
 */
export async function getApprovedTestimonials(limit: number = 6): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching approved testimonials:', error);
    throw new Error('Error al cargar testimonios');
  }

  return data || [];
}

/**
 * Crea un nuevo testimonio (requiere aprobación)
 */
export async function createTestimonial(testimonialData: CreateTestimonialData): Promise<Testimonial> {
  const { data, error } = await supabase
    .from('testimonials')
    .insert([testimonialData])
    .select()
    .single();

  if (error) {
    console.error('Error creating testimonial:', error);
    throw new Error('Error al crear testimonio');
  }

  return data;
}

/**
 * Obtiene todos los testimonios (solo para admin)
 */
export async function getAllTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all testimonials:', error);
    throw new Error('Error al cargar testimonios');
  }

  return data || [];
}

/**
 * Aprueba un testimonio (solo para admin)
 */
export async function approveTestimonial(id: string): Promise<void> {
  const { error } = await supabase
    .from('testimonials')
    .update({ approved: true })
    .eq('id', id);

  if (error) {
    console.error('Error approving testimonial:', error);
    throw new Error('Error al aprobar testimonio');
  }
}

/**
 * Rechaza un testimonio (solo para admin)
 */
export async function rejectTestimonial(id: string): Promise<void> {
  const { error } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error rejecting testimonial:', error);
    throw new Error('Error al rechazar testimonio');
  }
}

/**
 * Actualiza un testimonio (solo para admin)
 */
export async function updateTestimonial(id: string, updates: Partial<CreateTestimonialData>): Promise<Testimonial> {
  const { data, error } = await supabase
    .from('testimonials')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating testimonial:', error);
    throw new Error('Error al actualizar testimonio');
  }

  return data;
}

/**
 * Obtiene estadísticas de testimonios (solo para admin)
 */
export async function getTestimonialStats() {
  const { data: total, error: totalError } = await supabase
    .from('testimonials')
    .select('id', { count: 'exact' });

  const { data: approved, error: approvedError } = await supabase
    .from('testimonials')
    .select('id', { count: 'exact' })
    .eq('approved', true);

  const { data: pending, error: pendingError } = await supabase
    .from('testimonials')
    .select('id', { count: 'exact' })
    .eq('approved', false);

  if (totalError || approvedError || pendingError) {
    console.error('Error fetching testimonial stats:', { totalError, approvedError, pendingError });
    throw new Error('Error al cargar estadísticas de testimonios');
  }

  return {
    total: total?.length || 0,
    approved: approved?.length || 0,
    pending: pending?.length || 0,
  };
} 