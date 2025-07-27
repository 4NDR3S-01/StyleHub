'use client';

import SidebarAdmin from '../../components/admin/SidebarAdmin';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: Readonly<AdminLayoutProps>) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        setTimeoutReached(true);
      }, 5000); // 5 segundos
    } else {
      setTimeoutReached(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  useEffect(() => {
    // Solo redirigir si la carga terminó y el usuario existe pero no es admin
    if (!isLoading && user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // Mostrar loader mientras se restaura la sesión, pero con límite de tiempo
  // Loader profesional mientras se verifica la sesión
  // Loader siempre primero, o si no hay usuario y no ha pasado el timeout
  if (isLoading || (!user && !timeoutReached)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-400 border-opacity-50"></div>
        <span className="ml-4 text-red-400 font-semibold text-lg">Verificando sesión...</span>
      </div>
    );
  }
  // Si no hay usuario y ya pasó el timeout, mostrar mensaje de acceso denegado
  if (!user && timeoutReached) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-full h-12 w-12 border-4 border-red-400 border-opacity-50 flex items-center justify-center text-red-400 text-2xl font-bold">!</div>
        <div className="ml-4 text-red-400 font-semibold text-lg">No tienes acceso al panel de administración.<br />Por favor, inicia sesión como administrador.</div>
        <button
          className="ml-8 px-4 py-2 bg-red-400 text-white rounded hover:bg-red-500"
          onClick={() => router.replace('/')}
        >Volver al inicio</button>
      </div>
    );
  }
  // Si la carga supera el tiempo y aún está cargando, mostrar mensaje de error
  if (isLoading && timeoutReached) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-full h-12 w-12 border-4 border-red-400 border-opacity-50 flex items-center justify-center text-red-400 text-2xl font-bold">!</div>
        <div className="ml-4 text-red-400 font-semibold text-lg">No se pudo verificar la sesión.<br />Por favor, verifica tu conexión o inicia sesión nuevamente.</div>
        <button
          className="ml-8 px-4 py-2 bg-red-400 text-white rounded hover:bg-red-500"
          onClick={() => router.replace('/')}
        >Volver al inicio</button>
      </div>
    );
  }
  // Si el usuario existe pero no es admin, ya se está redirigiendo a /
    if (user && user.role !== 'admin') {
    return null;
    }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAdmin />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
