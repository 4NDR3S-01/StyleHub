// Extiende la interfaz Window para incluir __sessionCounter
declare global {
  interface Window {
    __sessionCounter?: number;
  }
}
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly sessionId = this.generateSessionId();

  private generateSessionId(): string {
    // Usar un contador incremental global para evitar Math.random()
    if (typeof window !== 'undefined') {
      if (!window.__sessionCounter) window.__sessionCounter = 0;
      window.__sessionCounter++;
    }
    const counter = typeof window !== 'undefined' ? window.__sessionCounter : Date.now();
    return `session-${Date.now()}-${counter}`;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // Obtener del contexto de autenticación si está disponible
    if (typeof window !== 'undefined') {
      try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user).id : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry(level, message, context);

    // Console output en desarrollo
    if (this.isDevelopment) {
      console[level === 'debug' ? 'log' : level](
        `[${level.toUpperCase()}] ${message}`,
        context ?? ''
      );
    }

    // Enviar a servicio de logging en producción
    if (!this.isDevelopment) {
      this.sendToLoggingService(entry);
    }

    // Almacenar logs críticos localmente para debugging
    if (level === 'error') {
      this.storeErrorLocally(entry);
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('Failed to send log to service:', error);
    }
  }

  private storeErrorLocally(entry: LogEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      logs.push(entry);
      
      // Mantener solo los últimos 50 logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store error locally:', error);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  // Logs específicos para diferentes áreas
  auth(action: string, success: boolean, context?: Record<string, any>) {
    this.info(`Auth: ${action}`, { success, ...context });
  }

  payment(action: string, amount?: number, status?: string, context?: Record<string, any>) {
    this.info(`Payment: ${action}`, { amount, status, ...context });
  }

  api(method: string, url: string, status: number, duration?: number) {
    this.info(`API: ${method} ${url}`, { status, duration });
  }

  userAction(action: string, context?: Record<string, any>) {
    this.info(`User Action: ${action}`, context);
  }

  performance(metric: string, value: number, context?: Record<string, any>) {
    this.info(`Performance: ${metric}`, { value, ...context });
  }

  // Obtener logs almacenados localmente
  getStoredErrors(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Limpiar logs almacenados
  clearStoredErrors() {
    localStorage.removeItem('error_logs');
  }
}

// Instancia singleton del logger
export const logger = new Logger();

// Hook para logging en componentes React
export function useLogger() {
  return logger;
}

// Middleware para logging de errores no capturados
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    // Capturar errores de JavaScript no manejados
    window.addEventListener('error', (event) => {
      logger.error('Unhandled Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Capturar promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });

    // Logging de navegación
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      logger.userAction('Navigation', { url: args[2] });
      return originalPushState.apply(this, args);
    };
  }
}

// Decorador para logging automático de funciones
export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T {
  return ((...args: any[]) => {
    const functionName = name || fn.name || 'anonymous';
    const startTime = Date.now();
    
    logger.debug(`Function Start: ${functionName}`, { args });
    
    try {
      const result = fn(...args);
      
      // Si es una promesa, manejar async
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = Date.now() - startTime;
            logger.debug(`Function Success: ${functionName}`, { duration });
            return value;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            logger.error(`Function Error: ${functionName}`, { 
              error: error.message, 
              stack: error.stack,
              duration 
            });
            throw error;
          });
      }
      
      // Función síncrona
      const duration = Date.now() - startTime;
      logger.debug(`Function Success: ${functionName}`, { duration });
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`Function Error: ${functionName}`, { 
        error: error.message, 
        stack: error.stack,
        duration 
      });
      throw error;
    }
  }) as T;
}

export default logger;
