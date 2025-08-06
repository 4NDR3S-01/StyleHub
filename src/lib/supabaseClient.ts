import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * SINGLETON PATTERN - SUPABASE CLIENT MANAGER
 * 
 * Este patrón asegura que solo exista una instancia del cliente Supabase
 * en toda la aplicación, optimizando recursos y manteniendo consistencia
 * en las conexiones a la base de datos.
 */

// ============================================================================
// SINGLETON CONFIGURATION MANAGER
// ============================================================================

/**
 * Gestor de configuración Singleton para variables de entorno
 */
class ConfigManager {
  private static instance: ConfigManager;
  private readonly config: {
    supabase: {
      url: string;
      anonKey: string;
    };
  };

  private constructor() {
    // Verificación de variables de entorno en tiempo de construcción
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL no está definida en las variables de entorno');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida en las variables de entorno');
    }

    this.config = {
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    };
  }

  /**
   * Obtiene la instancia única del ConfigManager
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Obtiene configuración de Supabase
   */
  public getSupabaseConfig() {
    return this.config.supabase;
  }
}

// ============================================================================
// SINGLETON SUPABASE CLIENT
// ============================================================================

/**
 * Cliente Supabase Singleton
 * Garantiza una única conexión reutilizable en toda la aplicación
 */
class SupabaseClientManager {
  private static instance: SupabaseClientManager;
  private client: SupabaseClient;

  private constructor() {
    const config = ConfigManager.getInstance().getSupabaseConfig();
    
    /**
     * Cliente principal de Supabase
     * Configurado con las credenciales del proyecto y optimizaciones
     */
    this.client = createClient(
      config.url,
      config.anonKey,
      {
        auth: {
          // Configuración de autenticación optimizada
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        // Configuraciones de rendimiento
        db: {
          schema: 'public',
        },
        global: {
          headers: { 'x-my-custom-header': 'StyleHub' },
        },
      }
    );
  }

  /**
   * Obtiene la instancia única del cliente Supabase
   */
  public static getInstance(): SupabaseClientManager {
    if (!SupabaseClientManager.instance) {
      SupabaseClientManager.instance = new SupabaseClientManager();
    }
    return SupabaseClientManager.instance;
  }

  /**
   * Obtiene el cliente Supabase
   */
  public getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Método para verificar la conexión
   */
  public async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('_health_check')
        .select('*')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Método para reinicializar la conexión si es necesario
   */
  public async reinitialize(): Promise<void> {
    const config = ConfigManager.getInstance().getSupabaseConfig();
    
    this.client = createClient(
      config.url,
      config.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Instancia única del cliente Supabase
 * Usar esta exportación en lugar de crear múltiples clientes
 */
const supabase = SupabaseClientManager.getInstance().getClient();

/**
 * Helper para obtener el manager completo si se necesita
 */
export const getSupabaseManager = () => SupabaseClientManager.getInstance();

/**
 * Helper para obtener el config manager
 */
export const getConfigManager = () => ConfigManager.getInstance();

export default supabase;