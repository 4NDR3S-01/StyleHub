import supabase from '@/lib/supabaseClient';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  active: boolean;
  subscribed_at: string;
  unsubscribed_at?: string;
}

export interface NewsletterStats {
  total: number;
  active: number;
  inactive: number;
}

/**
 * Suscribe un email al newsletter
 */
export async function subscribeToNewsletter(email: string): Promise<NewsletterSubscriber> {
  // Verificar si ya existe
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) {
    if (existing.active) {
      throw new Error('Este email ya está suscrito al newsletter');
    } else {
      // Reactivar suscripción
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          active: true, 
          unsubscribed_at: null 
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error reactivating newsletter subscription:', error);
        throw new Error('Error al reactivar suscripción');
      }

      return data;
    }
  }

  // Crear nueva suscripción
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ email }])
    .select()
    .single();

  if (error) {
    console.error('Error subscribing to newsletter:', error);
    throw new Error('Error al suscribirse al newsletter');
  }

  return data;
}

/**
 * Desuscribe un email del newsletter
 */
export async function unsubscribeFromNewsletter(email: string): Promise<void> {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ 
      active: false, 
      unsubscribed_at: new Date().toISOString() 
    })
    .eq('email', email);

  if (error) {
    console.error('Error unsubscribing from newsletter:', error);
    throw new Error('Error al desuscribirse del newsletter');
  }
}

/**
 * Obtiene todos los suscriptores (solo para admin)
 */
export async function getAllSubscribers(): Promise<NewsletterSubscriber[]> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false });

  if (error) {
    console.error('Error fetching newsletter subscribers:', error);
    throw new Error('Error al cargar suscriptores');
  }

  return data || [];
}

/**
 * Obtiene suscriptores activos (solo para admin)
 */
export async function getActiveSubscribers(): Promise<NewsletterSubscriber[]> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('active', true)
    .order('subscribed_at', { ascending: false });

  if (error) {
    console.error('Error fetching active subscribers:', error);
    throw new Error('Error al cargar suscriptores activos');
  }

  return data || [];
}

/**
 * Elimina un suscriptor (solo para admin)
 */
export async function deleteSubscriber(id: string): Promise<void> {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting subscriber:', error);
    throw new Error('Error al eliminar suscriptor');
  }
}

/**
 * Obtiene estadísticas del newsletter (solo para admin)
 */
export async function getNewsletterStats(): Promise<NewsletterStats> {
  const { data: total, error: totalError } = await supabase
    .from('newsletter_subscribers')
    .select('id', { count: 'exact' });

  const { data: active, error: activeError } = await supabase
    .from('newsletter_subscribers')
    .select('id', { count: 'exact' })
    .eq('active', true);

  const { data: inactive, error: inactiveError } = await supabase
    .from('newsletter_subscribers')
    .select('id', { count: 'exact' })
    .eq('active', false);

  if (totalError || activeError || inactiveError) {
    console.error('Error fetching newsletter stats:', { totalError, activeError, inactiveError });
    throw new Error('Error al cargar estadísticas del newsletter');
  }

  return {
    total: total?.length || 0,
    active: active?.length || 0,
    inactive: inactive?.length || 0,
  };
}

/**
 * Verifica si un email está suscrito
 */
export async function isSubscribed(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('active')
    .eq('email', email)
    .eq('active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking subscription status:', error);
    throw new Error('Error al verificar estado de suscripción');
  }

  return !!data;
}

/**
 * Exporta suscriptores activos para envío de newsletter
 */
export async function exportActiveSubscribers(): Promise<string[]> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .eq('active', true);

  if (error) {
    console.error('Error exporting active subscribers:', error);
    throw new Error('Error al exportar suscriptores');
  }

  return data?.map(subscriber => subscriber.email) || [];
} 