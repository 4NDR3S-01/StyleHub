import { createClient } from '@supabase/supabase-js';

/**
 * CLIENTE DE SUPABASE PARA STYLEHUB
 * 
 * Cliente configurado para conexión con la base de datos y servicios de Supabase
 * Incluye autenticación, storage y real-time subscriptions
 * 
 * Variables de entorno requeridas:
 * - NEXT_PUBLIC_SUPABASE_URL: URL del proyecto Supabase
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Clave pública (anon) de Supabase
 */

// Verificación de variables de entorno en tiempo de construcción
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL no está definida en las variables de entorno');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida en las variables de entorno');
}

/**
 * Cliente principal de Supabase
 * Configurado con las credenciales del proyecto de producción
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Configuración de autenticación
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

export default supabase;