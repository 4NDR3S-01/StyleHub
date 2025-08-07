/**
 * SINGLETON PATTERN - CONFIGURATION MANAGER
 * 
 * Este patrón garantiza que solo exista una instancia del gestor de configuración
 * en toda la aplicación, proporcionando un punto de acceso global a la configuración
 * del sistema y evitando inconsistencias en la configuración.
 */

// ============================================================================
// INTERFACES DE CONFIGURACIÓN
// ============================================================================

/**
 * Configuración de la aplicación
 */
interface AppConfig {
  // Configuración general
  appName: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  
  // URLs y endpoints
  apiBaseUrl: string;
  frontendUrl: string;
  
  // Configuración de base de datos
  database: {
    url: string;
    anonKey: string;
  };
  
  // Configuración de pagos
  payments: {
    stripe: {
      publishableKey: string;
      secretKey: string;
      webhookSecret: string;
    };
    paypal: {
      clientId: string;
      clientSecret: string;
      environment: 'sandbox' | 'production';
    };
  };
  
  // Configuración de email
  email: {
    from: string;
    replyTo: string;
  };
  
  // Features flags
  features: {
    enablePayPal: boolean;
    enableNewsletter: boolean;
    enableReviews: boolean;
    enableWishlist: boolean;
    enableAnalytics: boolean;
  };
  
  // Configuración de SEO
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    defaultKeywords: string[];
  };
}

/**
 * Configuración de cache
 */
interface CacheConfig {
  products: number;      // TTL en segundos
  categories: number;
  users: number;
  orders: number;
}

// ============================================================================
// SINGLETON CONFIGURATION MANAGER
// ============================================================================

/**
 * Gestor de configuración Singleton
 * 
 * BENEFICIOS:
 * - Una sola fuente de verdad para la configuración
 * - Evita lecturas múltiples de variables de entorno
 * - Centraliza la validación de configuración
 * - Proporciona configuración tipada
 * - Facilita el testing con configuraciones mock
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  private cacheConfig: CacheConfig;
  private readonly isInitialized: boolean = false;

  /**
   * Constructor privado para evitar instanciación directa
   */
  private constructor() {
    this.config = this.loadConfiguration();
    this.cacheConfig = this.loadCacheConfiguration();
    this.validateConfiguration();
    this.isInitialized = true;
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
   * Carga la configuración desde variables de entorno
   */
  private loadConfiguration(): AppConfig {
    return {
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'StyleHub',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: (process.env.NODE_ENV as any) || 'development',
      
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
      frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
      
      database: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      
      payments: {
        stripe: {
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
          secretKey: process.env.STRIPE_SECRET_KEY || '',
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        },
        paypal: {
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
          clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
          environment: (process.env.PAYPAL_ENVIRONMENT as any) || 'sandbox',
        },
      },
      
      email: {
        from: process.env.EMAIL_FROM || 'noreply@stylehub.com',
        replyTo: process.env.EMAIL_REPLY_TO || 'support@stylehub.com',
      },
      
      features: {
        enablePayPal: process.env.ENABLE_PAYPAL === 'true',
        enableNewsletter: process.env.ENABLE_NEWSLETTER !== 'false', // true por defecto
        enableReviews: process.env.ENABLE_REVIEWS !== 'false',
        enableWishlist: process.env.ENABLE_WISHLIST !== 'false',
        enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
      },
      
      seo: {
        defaultTitle: process.env.NEXT_PUBLIC_DEFAULT_TITLE || 'StyleHub - Tu Estilo, Nuestra Pasión',
        defaultDescription: process.env.NEXT_PUBLIC_DEFAULT_DESCRIPTION || 'Descubre las últimas tendencias en moda',
        defaultKeywords: (process.env.NEXT_PUBLIC_DEFAULT_KEYWORDS || 'moda,ropa,estilo,tienda').split(','),
      },
    };
  }

  /**
   * Carga la configuración de cache
   */
  private loadCacheConfiguration(): CacheConfig {
    return {
      products: parseInt(process.env.CACHE_PRODUCTS_TTL || '300'), // 5 minutos
      categories: parseInt(process.env.CACHE_CATEGORIES_TTL || '600'), // 10 minutos
      users: parseInt(process.env.CACHE_USERS_TTL || '180'), // 3 minutos
      orders: parseInt(process.env.CACHE_ORDERS_TTL || '60'), // 1 minuto
    };
  }

  /**
   * Valida que la configuración esencial esté presente
   */
  private validateConfiguration(): void {
    const requiredFields = [
      'database.url',
      'database.anonKey',
    ];

    const missing: string[] = [];

    requiredFields.forEach(field => {
      const value = this.getNestedValue(this.config, field);
      if (!value) {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }

  /**
   * Obtiene un valor anidado del objeto de configuración
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // ============================================================================
  // MÉTODOS PÚBLICOS DE ACCESO
  // ============================================================================

  /**
   * Obtiene toda la configuración
   */
  public getConfig(): Readonly<AppConfig> {
    return this.config;
  }

  /**
   * Obtiene configuración de base de datos
   */
  public getDatabaseConfig() {
    return this.config.database;
  }

  /**
   * Obtiene configuración de pagos
   */
  public getPaymentConfig() {
    return this.config.payments;
  }

  /**
   * Obtiene configuración de features
   */
  public getFeatures() {
    return this.config.features;
  }

  /**
   * Verifica si una feature está habilitada
   */
  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Obtiene configuración de SEO
   */
  public getSEOConfig() {
    return this.config.seo;
  }

  /**
   * Obtiene configuración de cache
   */
  public getCacheConfig(): Readonly<CacheConfig> {
    return this.cacheConfig;
  }

  /**
   * Obtiene TTL de cache para un tipo específico
   */
  public getCacheTTL(type: keyof CacheConfig): number {
    return this.cacheConfig[type];
  }

  /**
   * Obtiene el entorno actual
   */
  public getEnvironment(): string {
    return this.config.environment;
  }

  /**
   * Verifica si está en producción
   */
  public isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Verifica si está en desarrollo
   */
  public isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  /**
   * Obtiene información de la aplicación
   */
  public getAppInfo() {
    return {
      name: this.config.appName,
      version: this.config.version,
      environment: this.config.environment,
    };
  }

  // ============================================================================
  // MÉTODOS UTILITARIOS
  // ============================================================================

  /**
   * Recarga la configuración (útil para testing)
   */
  public reload(): void {
    this.config = this.loadConfiguration();
    this.cacheConfig = this.loadCacheConfiguration();
    this.validateConfiguration();
  }

  /**
   * Verifica si el manager está inicializado
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Obtiene un resumen de la configuración (sin datos sensibles)
   */
  public getConfigSummary() {
    return {
      appName: this.config.appName,
      version: this.config.version,
      environment: this.config.environment,
      features: this.config.features,
      hasDatabase: !!this.config.database.url,
      hasStripe: !!this.config.payments.stripe.publishableKey,
      hasPayPal: !!this.config.payments.paypal.clientId,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Función helper para obtener la instancia del ConfigManager
 * Simplifica el acceso desde otros módulos
 */
export const getConfig = (): ConfigManager => {
  return ConfigManager.getInstance();
};

/**
 * Hook personalizado para React (opcional)
 * Permite usar la configuración en componentes
 */
export const useConfig = () => {
  const config = ConfigManager.getInstance();
  
  return {
    config: config.getConfig(),
    features: config.getFeatures(),
    isFeatureEnabled: (feature: keyof AppConfig['features']) => config.isFeatureEnabled(feature),
    environment: config.getEnvironment(),
    isProduction: config.isProduction(),
    isDevelopment: config.isDevelopment(),
  };
};
