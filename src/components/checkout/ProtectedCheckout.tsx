'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

interface ProtectedCheckoutProps {
  children: React.ReactNode;
}

export function ProtectedCheckout({ children }: ProtectedCheckoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si ya terminó de cargar y no hay usuario, mostrar pantalla de login
    if (!isLoading && !user) {
      // No redirigir automáticamente, solo mostrar mensaje
      return;
    }
  }, [user, isLoading]);

  // Si hay usuario, mostrar contenido
  if (user) {
    return <>{children}</>;
  }

  // Si está cargando, mostrar contenido con overlay sutil
  if (isLoading) {
    return (
      <div className="relative">
        {children}
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar mensaje de login requerido
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-blue-600" />
          </div>
          
          <h2 className="text-xl font-semibold mb-2">
            Iniciar Sesión Requerido
          </h2>
          
          <p className="text-gray-600 mb-6">
            Necesitas iniciar sesión para proceder con el pago.
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Iniciar Sesión
            </Button>
            <Button 
              onClick={() => router.push('/register')} 
              variant="outline" 
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Registrarse
            </Button>
            
            <Button 
              onClick={() => router.push('/')} 
              variant="ghost" 
              className="w-full mt-4"
            >
              Continuar Comprando
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
