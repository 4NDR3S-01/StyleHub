import supabase from '@/lib/supabaseClient';

/**
 * Utilidad para obtener la URL del avatar de forma consistente
 * Maneja tanto URLs completas como rutas relativas
 */
export const getAvatarUrl = (avatarData: string | null | undefined): string => {
  if (!avatarData) return '';
  
  // Si ya es una URL completa, devolverla tal como está
  if (avatarData.startsWith('http://') || avatarData.startsWith('https://')) {
    return avatarData;
  }
  
  // Si es una ruta relativa, obtener la URL pública
  const { data } = supabase.storage.from('avatar').getPublicUrl(avatarData);
  return data.publicUrl;
};

/**
 * Utilidad para generar un avatar con iniciales cuando no hay imagen
 */
export const getInitialsFromName = (name: string): string => {
  if (!name || name.trim() === '') return 'U';
  
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Generar color de fondo consistente basado en el nombre
 */
export const getAvatarBackgroundColor = (name: string): string => {
  const colors = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-yellow-500 to-yellow-600',
    'bg-gradient-to-br from-red-500 to-red-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-orange-500 to-orange-600'
  ];
  
  if (!name || name.trim() === '') return colors[0];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};
