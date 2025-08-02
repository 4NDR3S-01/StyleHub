import supabase from '@/lib/supabaseClient';

// Types para personalización
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  background: string;
  text: string;
}

export interface ThemeSettings {
  id?: string;
  name: string;
  colors: ThemeColors;
  is_active?: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BrandingSettings {
  id?: string;
  main_logo?: string;
  favicon?: string;
  footer_logo?: string;
  email_logo?: string;
  brand_name: string;
  tagline: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface Banner {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  button_text?: string;
  position: 'hero' | 'top' | 'middle' | 'bottom';
  active: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FooterSettings {
  id?: string;
  company_name: string;
  description: string;
  address?: string;
  phone?: string;
  email?: string;
  copyright: string;
  show_newsletter: boolean;
  newsletter_title: string;
  newsletter_description: string;
  created_at?: string;
  updated_at?: string;
}

export interface FooterLink {
  id?: string;
  title: string;
  url: string;
  category: string;
  external: boolean;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface SocialMedia {
  id?: string;
  platform: string;
  url: string;
  active: boolean;
  created_at?: string;
}

// Type aliases para eliminar duplicación
export type CreateThemeData = Omit<ThemeSettings, 'id' | 'created_at' | 'updated_at'>;
export type CreateBrandingData = Omit<BrandingSettings, 'id' | 'created_at' | 'updated_at'>;
export type CreateBannerData = Omit<Banner, 'id' | 'created_at' | 'updated_at'>;
export type CreateFooterData = Omit<FooterSettings, 'id' | 'created_at' | 'updated_at'>;
export type CreateFooterLinkData = Omit<FooterLink, 'id' | 'created_at'>;
export type CreateSocialMediaData = Omit<SocialMedia, 'id' | 'created_at'>;

// Theme Services
export async function getThemes(): Promise<ThemeSettings[]> {
  const { data, error } = await supabase
    .from('theme_settings')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

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
    const fileName = `${folder}-${Date.now()}-${Math.random()}.${fileExt}`;
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
