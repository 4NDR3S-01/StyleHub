'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });

    // Enviar error a servicio de monitoreo (ejemplo: Sentry)
    if (typeof window !== 'undefined') {
      console.log('Error reported to monitoring service');
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, retry }: Readonly<{ error?: Error; retry: () => void }>) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="text-red-500 mb-4">
          <AlertTriangle className="w-16 h-16 mx-auto" />
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          ¡Ups! Algo salió mal
        </h1>
        
        <p className="text-gray-600 mb-6">
          Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
        </p>

        {isDevelopment && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-red-800 mb-2">Error de desarrollo:</h3>
            <code className="text-sm text-red-700 break-all">
              {error.message}
            </code>
            {error.stack && (
              <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-32">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={retry}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </Button>
          
          <Link href="/" className="block w-full">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Si el problema persiste, contacta a soporte técnico.
        </p>
      </div>
    </div>
  );
}

// Hook para manejar errores asíncronos
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: any) => {
    console.error('Async error:', error, errorInfo);
    
    // Mostrar notificación al usuario
    if (typeof window !== 'undefined') {
      // Usar el sistema de notificaciones
      window.dispatchEvent(new CustomEvent('show-error', {
        detail: {
          title: 'Error',
          message: 'Ha ocurrido un error. Por favor, intenta de nuevo.',
        }
      }));
    }
  }, []);
}

// Componente para errores específicos de rutas
const RouteErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <div className="container mx-auto px-4 py-8 text-center">
    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
    <h2 className="text-lg font-semibold mb-2">Error al cargar la página</h2>
    <p className="text-gray-600 mb-4">
      No se pudo cargar el contenido solicitado.
    </p>
    <Button onClick={retry} className="mr-2">
      Reintentar
    </Button>
    <Link href="/">
      <Button variant="outline">Volver al inicio</Button>
    </Link>
  </div>
);

export function RouteErrorBoundary({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ErrorBoundary fallback={RouteErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
