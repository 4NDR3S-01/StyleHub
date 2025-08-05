'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Aquí podrías enviar el error a un servicio como Sentry
    // Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center border border-red-100">
            <div className="text-red-500 mb-6">
              <AlertTriangle className="w-20 h-20 mx-auto" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              ¡Oops! Algo salió mal
            </h1>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado 
              y estamos trabajando para solucionarlo.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  Detalles técnicos (desarrollo)
                </summary>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto text-red-600">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar página
              </Button>
              
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al inicio
              </Button>
            </div>
            
            <p className="text-xs text-gray-400 mt-6">
              Error ID: {Date.now().toString(36)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para reportar errores manualmente
export function useErrorReporting() {
  const reportError = (error: Error, context?: string) => {
    console.error(`Error in ${context}:`, error);
    // Aquí enviarías a tu servicio de monitoreo
    // Sentry.captureException(error, { tags: { context } });
  };

  return { reportError };
}
