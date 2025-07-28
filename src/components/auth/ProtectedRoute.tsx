'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, UserPlus } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showUnauthorized, setShowUnauthorized] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  useEffect(() => {
    // Solo mostrar el loading en la carga inicial
    if (!isLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }

    // Si no está cargando y no hay usuario
    if (!isLoading && !user) {
      setShowUnauthorized(true);
      return;
    }
    
    // Si se requiere admin y el usuario no es admin
    if (!isLoading && user && requireAdmin && user.role !== 'admin') {
      setShowUnauthorized(true);
      return;
    }
    
    // Si todo está bien
    if (!isLoading && user && (!requireAdmin || user.role === 'admin')) {
      setShowUnauthorized(false);
    }
  }, [user, isLoading, requireAdmin, hasInitiallyLoaded]);

  // Solo mostrar loading en la carga inicial
  if (isLoading && !hasInitiallyLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Mostrar mensaje de acceso denegado
  if (showUnauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              {!user ? (
                <LogIn className="h-8 w-8 text-red-600" />
              ) : (
                <Lock className="h-8 w-8 text-red-600" />
              )}
            </div>
            
            <h2 className="text-xl font-semibold mb-2">
              {!user ? 'Acceso Requerido' : 'Acceso Denegado'}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {!user 
                ? 'Necesitas iniciar sesión para acceder a esta página.'
                : requireAdmin 
                  ? 'No tienes permisos para acceder a esta área de administración.'
                  : 'No tienes permisos para acceder a esta página.'
              }
            </p>
            
            <div className="space-y-2">
              {!user ? (
                <>
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
                    Volver al Inicio
                  </Button>
                </>
              ) : (
                <Button onClick={() => router.push('/')} className="w-full">
                  Volver al Inicio
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si todo está bien, mostrar el contenido protegido
  return <>{children}</>;
}
