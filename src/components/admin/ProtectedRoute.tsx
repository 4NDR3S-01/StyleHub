'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children }: { readonly children: React.ReactNode }) {  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  useEffect(() => {
    // Solo marcar como cargado inicialmente una vez
    if (!isLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }

    // Solo verificar una vez cuando termine de cargar por primera vez
    if (!isLoading && hasInitiallyLoaded && !hasChecked) {
      setHasChecked(true);
      
      // Si no hay usuario, redirigir al inicio
      if (!user) {
        router.replace('/');
        return;
      }
      
      // Si el usuario no es admin, redirigir al inicio
      if (user.role !== 'admin') {
        router.replace('/');
        return;
      }
    }
  }, [isLoading, user, router, hasChecked, hasInitiallyLoaded]);

  // Solo mostrar loader en la carga inicial
  if (isLoading && !hasInitiallyLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
        <div className="flex flex-col items-center gap-4 p-8 rounded-xl shadow-lg bg-white/90 border border-gray-200">
          <span className="bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent text-xl font-bold tracking-wide drop-shadow-lg">Verificando sesión...</span>
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#ff6f61]"></div>
        </div>
      </div>
    );
  }

  // Solo renderizar contenido si el usuario es admin
  if (user && user.role === 'admin') {
    return <>{children}</>;
  }

  // Si llegamos aquí, el usuario no está autorizado (se está redirigiendo)
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="flex flex-col items-center gap-4 p-8 rounded-xl shadow-lg bg-white/90 border border-red-400">
        <span className="text-red-400 text-xl font-bold tracking-wide">Acceso denegado</span>
        <span className="text-gray-700 text-base">Redirigiendo...</span>
      </div>
    </div>
  );
}
