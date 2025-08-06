/**
 * SINGLETON PATTERN MEJORADO
 * 
 * Mejoramos el patrón Singleton existente en logger.ts
 * para hacerlo más robusto y thread-safe.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
}

/**
 * SINGLETON PATTERN - Clase Logger mejorada
 * 
 * Asegura que solo exista una instancia del logger en toda la aplicación
 * y proporciona un punto de acceso global para el logging.
 */
class Logger {
  private static instance: Logger | null = null;
  private static isCreating = false;
  
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  /**
   * Constructor privado para evitar instanciación directa
   */
  private constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      minLevel: 'info',
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      ...config
    };

    console.log('🔧 Logger Singleton inicializado con configuración:', this.config);
  }

  /**
   * Método estático para obtener la instancia única (Thread-safe)
   */
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    // Verificación con doble bloqueo para thread safety
    if (!Logger.instance) {
      if (Logger.isCreating) {
        // Evitar crear múltiples instancias si se llama concurrentemente
        while (Logger.isCreating && !Logger.instance) {
          // Esperar un poco antes de verificar de nuevo
          // En un entorno real, podrías usar setTimeout o Promise
        }
        if (Logger.instance) {
          return Logger.instance;
        }
      }
      
      Logger.isCreating = true;
      
      Logger.instance ??= new Logger(config);
      
      Logger.isCreating = false;
    }

    return Logger.instance;
  }

  /**
   * Configurar el logger después de la creación
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('info', 'Logger reconfigurado', config);
  }

  /**
   * Método principal de logging
   */
  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    // Verificar si el nivel es suficiente para logear
    if (this.levelPriority[level] < this.levelPriority[this.config.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      context
    };

    // Almacenar en memoria si está habilitado
    if (this.config.enableStorage) {
      this.addToStorage(entry);
    }

    // Mostrar en consola si está habilitado
    if (this.config.enableConsole) {
      this.printToConsole(entry);
    }
  }

  /**
   * Métodos públicos para cada nivel de log
   */
  debug(message: string, data?: any, context?: string): void {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: any, context?: string): void {
    this.log('error', message, data, context);
  }

  /**
   * Almacenar en memoria con límite de entries
   */
  private addToStorage(entry: LogEntry): void {
    this.logs.push(entry);

    // Mantener solo las últimas N entradas
    if (this.logs.length > this.config.maxStorageEntries) {
      this.logs = this.logs.slice(-this.config.maxStorageEntries);
    }
  }

  /**
   * Imprimir en consola con formato
   */
  private printToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    const prefix = `${timestamp} ${entry.level.toUpperCase()} ${context}`;

    switch (entry.level) {
      case 'debug':
        console.debug(`🔍 ${prefix}`, entry.message, entry.data || '');
        break;
      case 'info':
        console.info(`ℹ️ ${prefix}`, entry.message, entry.data || '');
        break;
      case 'warn':
        console.warn(`⚠️ ${prefix}`, entry.message, entry.data || '');
        break;
      case 'error':
        console.error(`❌ ${prefix}`, entry.message, entry.data || '');
        break;
    }
  }

  /**
   * Obtener logs almacenados
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = level 
      ? this.logs.filter(log => log.level === level)
      : this.logs;

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return [...filteredLogs]; // Retornar copia para evitar mutaciones
  }

  /**
   * Limpiar logs almacenados
   */
  clearLogs(): void {
    this.logs = [];
    this.info('Logs limpiados');
  }

  /**
   * Exportar logs como JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Obtener estadísticas de logging
   */
  getStats(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    this.logs.forEach(log => {
      stats[log.level]++;
    });

    return stats;
  }

  /**
   * Método para debugging - NO usar en producción
   */
  static resetInstance(): void {
    if (process.env.NODE_ENV !== 'production') {
      Logger.instance = null;
      Logger.isCreating = false;
      console.warn('⚠️ Logger instance reset - ONLY FOR DEVELOPMENT');
    } else {
      console.error('❌ Cannot reset Logger instance in production');
    }
  }
}

/**
 * Instancia singleton del logger para exportar
 * Se crea con configuración por defecto
 */
export const logger = Logger.getInstance({
  minLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 1000
});

/**
 * Hook para logging en componentes React
 */
export function useLogger(context?: string) {
  const loggerInstance = Logger.getInstance();

  return {
    debug: (message: string, data?: any) => loggerInstance.debug(message, data, context),
    info: (message: string, data?: any) => loggerInstance.info(message, data, context),
    warn: (message: string, data?: any) => loggerInstance.warn(message, data, context),
    error: (message: string, data?: any) => loggerInstance.error(message, data, context),
    getLogs: () => loggerInstance.getLogs(),
    getStats: () => loggerInstance.getStats()
  };
}

/**
 * Middleware para logging de errores no capturados
 */
export function setupGlobalErrorHandling(): void {
  const loggerInstance = Logger.getInstance();

  // Capturar errores JavaScript no manejados
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      loggerInstance.error('Error no manejado', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      }, 'GlobalErrorHandler');
    });

    // Capturar promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      loggerInstance.error('Promesa rechazada no manejada', {
        reason: event.reason
      }, 'GlobalErrorHandler');
    });
  }

  loggerInstance.info('Global error handling configurado');
}

/**
 * Decorador para logging automático de funciones
 */
export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T {
  const loggerInstance = Logger.getInstance();
  const functionName = name || fn.name || 'anonymous';

  return ((...args: any[]) => {
    const startTime = Date.now();
    loggerInstance.debug(`Ejecutando función: ${functionName}`, { args }, 'FunctionLogger');

    try {
      const result = fn(...args);

      // Si es una promesa, manejar el logging asíncrono
      if (result && typeof result.then === 'function') {
        return result
          .then((value: any) => {
            const duration = Date.now() - startTime;
            loggerInstance.debug(`Función ${functionName} completada`, { duration, result: value }, 'FunctionLogger');
            return value;
          })
          .catch((error: any) => {
            const duration = Date.now() - startTime;
            loggerInstance.error(`Error en función ${functionName}`, { duration, error }, 'FunctionLogger');
            throw error;
          });
      } else {
        const duration = Date.now() - startTime;
        loggerInstance.debug(`Función ${functionName} completada`, { duration, result }, 'FunctionLogger');
        return result;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      loggerInstance.error(`Error en función ${functionName}`, { duration, error }, 'FunctionLogger');
      throw error;
    }
  }) as T;
}

/**
 * Clase para logging específico de módulos/componentes
 */
export class ModuleLogger {
  private readonly logger: Logger;
  private readonly context: string;

  constructor(context: string) {
    this.logger = Logger.getInstance();
    this.context = context;
  }

  debug(message: string, data?: any): void {
    this.logger.debug(message, data, this.context);
  }

  info(message: string, data?: any): void {
    this.logger.info(message, data, this.context);
  }

  warn(message: string, data?: any): void {
    this.logger.warn(message, data, this.context);
  }

  error(message: string, data?: any): void {
    this.logger.error(message, data, this.context);
  }
}

export default logger;
