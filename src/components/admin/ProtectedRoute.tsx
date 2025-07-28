'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showUnauthorized, setShowUnauthorized] = useState(false);

  useEffect(() => {
    // Si no está cargando y no hay usuario, muestra acceso denegado y redirige
    if (!isLoading && !user) {
      setShowUnauthorized(true);
      const timeout = setTimeout(() => {
        router.replace('/');
      }, 2000);
      return () => clearTimeout(timeout);
    }
    // Si no está cargando, hay usuario, pero el rol no es admin, muestra acceso denegado y redirige
    if (!isLoading && user && user.role !== 'admin') {
      setShowUnauthorized(true);
      const timeout = setTimeout(() => {
        router.replace('/');
      }, 2000);
      return () => clearTimeout(timeout);
    }
    // Si está cargando o el usuario existe pero el rol aún no está definido, no muestra nada (loader)
    if (isLoading || (user && typeof user.role === 'undefined')) {
      setShowUnauthorized(false);
    }
  }, [isLoading, user, router]);

  // Loader profesional y full screen
  if (isLoading || (user && typeof user.role === 'undefined')) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
        <div className="flex flex-col items-center gap-4 p-8 rounded-xl shadow-lg bg-white/90 border border-gray-200">
          <span className="bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent text-xl font-bold tracking-wide drop-shadow-lg">Verificando sesión...</span>
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#ff6f61]"></div>
        </div>
      </div>
    );
  }

  // Mensaje de acceso denegado, también full screen
  if (showUnauthorized) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
        <div className="flex flex-col items-center gap-4 p-8 rounded-xl shadow-lg bg-white/90 border border-red-400">
          <span className="text-red-400 text-xl font-bold tracking-wide">Acceso denegado</span>
          <span className="text-gray-700 text-base">Será redirigido al inicio...</span>
        </div>
      </div>
    );
  }

  // Solo si está autenticado y es admin
  if (user && user.role === 'admin') {
    return <>{children}</>;
  }
  // Si no está autenticado o no es admin, no renderiza nada (previene flicker)
  return null;
}
