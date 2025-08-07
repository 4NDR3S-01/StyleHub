import supabase from '@/lib/supabaseClient';

/**
 * SERVICIOS DE PERSONALIZACIÓN
 * Maneja todas las operaciones CRUD para la personalización de la tienda
 * Incluye temas, branding, banners, footer y redes sociales
 */

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

/**
 * Definición de colores del tema
 * Estructura base para todos los temas de la aplicación
 */
export interface ThemeColors {
  primary: string;    // Color principal de la marca
  secondary: string;  // Color secundario
  accent: string;     // Color de acento para elementos destacados
  neutral: string;    // Color neutral para elementos secundarios
  background: string; // Color de fondo principal
  text: string;       // Color de texto principal
}

/**
 * Configuración completa de tema
 * Incluye metadatos y configuración de colores
 */
export interface ThemeSettings {
  id?: string;
  name: string;
  colors: ThemeColors;
  is_active?: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Configuración de branding de la tienda
 * Maneja logos, textos corporativos y elementos de marca
 */
export interface BrandingSettings {
  id?: string;
  main_logo?: string;     // Logo principal del header
  favicon?: string;       // Icono del navegador
  footer_logo?: string;   // Logo del footer
  email_logo?: string;    // Logo para plantillas de email
  brand_name: string;     // Nombre de la marca
  tagline: string;        // Eslogan de la marca
  description: string;    // Descripción corporativa
  created_at?: string;
  updated_at?: string;
}

/**
 * Configuración de banners promocionales
 * Sistema flexible para promociones y anuncios
 */
export interface Banner {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  button_text?: string;
  position: 'hero' | 'top' | 'middle' | 'bottom';  // Posición en la página
  active: boolean;        // Estado activo/inactivo
  start_date?: string;    // Fecha de inicio (opcional)
  end_date?: string;      // Fecha de fin (opcional)
  created_at?: string;
  updated_at?: string;
}

/**
 * Configuración del footer
 * Información corporativa y elementos del pie de página
 */
export interface FooterSettings {
  id?: string;
  company_name: string;           // Nombre de la empresa
  description: string;            // Descripción corporativa
  address?: string;               // Dirección física
  phone?: string;                 // Teléfono de contacto
  email?: string;                 // Email de contacto
  copyright: string;              // Texto de copyright
  show_newsletter: boolean;       // Mostrar sección de newsletter
  newsletter_title: string;       // Título del newsletter
  newsletter_description: string; // Descripción del newsletter
  created_at?: string;
  updated_at?: string;
}

/**
 * Enlaces del footer organizados por categorías
 * Sistema flexible para diferentes secciones de enlaces
 */
export interface FooterLink {
  id?: string;
  title: string;        // Texto del enlace
  url: string;          // URL de destino
  category: string;     // Categoría (ej: "legal", "ayuda", "empresa")
  external: boolean;    // Enlace externo (abre en nueva pestaña)
  active: boolean;      // Estado activo/inactivo
  sort_order: number;   // Orden de visualización
  created_at?: string;
}

/**
 * Configuración de redes sociales
 * Enlaces a perfiles sociales de la empresa
 */
export interface SocialMedia {
  id?: string;
  platform: string;    // Nombre de la plataforma (ej: "facebook", "instagram")
  url: string;          // URL del perfil
  active: boolean;      // Estado activo/inactivo
  created_at?: string;
}

// ============================================================================
// TYPE ALIASES PARA CREACIÓN DE REGISTROS
// ============================================================================

// Type aliases para eliminar campos auto-generados en operaciones de creación
export type CreateThemeData = Omit<ThemeSettings, 'id' | 'created_at' | 'updated_at'>;
export type CreateBrandingData = Omit<BrandingSettings, 'id' | 'created_at' | 'updated_at'>;
export type CreateBannerData = Omit<Banner, 'id' | 'created_at' | 'updated_at'>;
export type CreateFooterData = Omit<FooterSettings, 'id' | 'created_at' | 'updated_at'>;
export type CreateFooterLinkData = Omit<FooterLink, 'id' | 'created_at'>;
export type CreateSocialMediaData = Omit<SocialMedia, 'id' | 'created_at'>;

// ============================================================================
// SERVICIOS DE TEMAS
// ============================================================================

/**
 * Obtiene todos los temas disponibles
 * Ordenados por fecha de creación (más recientes primero)
 */
export async function getThemes(): Promise<ThemeSettings[]> {
  const { data, error } = await supabase
    .from('theme_settings')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

/**
 * Obtiene el tema actualmente activo
 * Solo debe haber un tema activo a la vez
 */
export async function getActiveTheme(): Promise<ThemeSettings | null> {
  const { data, error } = await supabase
    .from('theme_settings')
    .select('*')
    .eq('is_active', true)
    .single();
  
  if (error) return null;
  return data;
}

export async function saveTheme(theme: CreateThemeData): Promise<ThemeSettings> {
  const { data, error } = await supabase
    .from('theme_settings')
    .insert([theme])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateTheme(id: string, theme: Partial<ThemeSettings>): Promise<ThemeSettings> {
  const { data, error } = await supabase
    .from('theme_settings')
    .update(theme)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function activateTheme(id: string): Promise<void> {
  // Desactivar todos los temas
  await supabase
    .from('theme_settings')
    .update({ is_active: false })
    .neq('id', id);
  
  // Activar el tema seleccionado
  const { error } = await supabase
    .from('theme_settings')
    .update({ is_active: true })
    .eq('id', id);
  
  if (error) throw error;
}

export async function deleteTheme(id: string): Promise<void> {
  const { error } = await supabase
    .from('theme_settings')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Branding Services
export async function getBrandingSettings(): Promise<BrandingSettings | null> {
  const { data, error } = await supabase
    .from('branding_settings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) return null;
  return data;
}

export async function saveBrandingSettings(branding: CreateBrandingData): Promise<BrandingSettings> {
  // Verificar si ya existe una configuración
  const existing = await getBrandingSettings();
  
  if (existing) {
    const { data, error } = await supabase
      .from('branding_settings')
      .update(branding)
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('branding_settings')
      .insert([branding])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// Banner Services
export async function getBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getActiveBanners(position?: string): Promise<Banner[]> {
  const now = new Date().toISOString();
  
  let query = supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`);
  
  if (position) {
    query = query.eq('position', position);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function saveBanner(banner: CreateBannerData): Promise<Banner> {
  const { data, error } = await supabase
    .from('banners')
    .insert([banner])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateBanner(id: string, banner: Partial<Banner>): Promise<Banner> {
  const { data, error } = await supabase
    .from('banners')
    .update(banner)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase
    .from('banners')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Footer Services
export async function getFooterSettings(): Promise<FooterSettings | null> {
  const { data, error } = await supabase
    .from('footer_settings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) return null;
  return data;
}

export async function saveFooterSettings(footer: CreateFooterData): Promise<FooterSettings> {
  const existing = await getFooterSettings();
  
  if (existing) {
    const { data, error } = await supabase
      .from('footer_settings')
      .update(footer)
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('footer_settings')
      .insert([footer])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export async function getFooterLinks(): Promise<FooterLink[]> {
  const { data, error } = await supabase
    .from('footer_links')
    .select('*')
    .eq('active', true)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function saveFooterLink(link: CreateFooterLinkData): Promise<FooterLink> {
  const { data, error } = await supabase
    .from('footer_links')
    .insert([link])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateFooterLink(id: string, link: Partial<FooterLink>): Promise<FooterLink> {
  const { data, error } = await supabase
    .from('footer_links')
    .update(link)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteFooterLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('footer_links')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function getSocialMedia(): Promise<SocialMedia[]> {
  const { data, error } = await supabase
    .from('social_media')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function saveSocialMedia(social: CreateSocialMediaData): Promise<SocialMedia> {
  const { data, error } = await supabase
    .from('social_media')
    .insert([social])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateSocialMedia(id: string, social: Partial<SocialMedia>): Promise<SocialMedia> {
  const { data, error } = await supabase
    .from('social_media')
    .update(social)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSocialMedia(id: string): Promise<void> {
  const { error } = await supabase
    .from('social_media')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Utility function para subir imágenes
export async function uploadPersonalizationImage(file: File, folder: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    // Usar un contador simple para evitar Math.random()
    if (typeof window !== 'undefined') {
      if (!window.__uploadCounter) window.__uploadCounter = 0;
      window.__uploadCounter++;
    }
    const counter = typeof window !== 'undefined' ? window.__uploadCounter : Date.now();
    const fileName = `${folder}-${Date.now()}-${counter}.${fileExt}`;
    const filePath = `personalization/${folder}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('productos')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage
      .from('productos')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}
