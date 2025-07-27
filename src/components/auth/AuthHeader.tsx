'use client';

import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  showBackButton?: boolean;
}

export default function AuthHeader({ title, subtitle, showBackButton = true }: AuthHeaderProps) {
  const router = useRouter();

  const handleBackNavigation = () => {
    // Verificar si estamos en páginas de autenticación que pueden crear bucles
    const currentPath = window.location.pathname;
    const authPages = ['/login', '/register', '/reset-password', '/confirm-email', '/change-email'];
    
    // Solo aplicar lógica anti-bucle si estamos en páginas de auth específicas
    if (currentPath === '/login' || currentPath === '/register') {
      // Verificar si la página anterior también es login o register (bucle específico)
      const referrer = document.referrer;
      const isFromLoginRegisterLoop = referrer.includes('/login') || referrer.includes('/register');
      
      // Solo romper el bucle entre login y register
      if (isFromLoginRegisterLoop) {
        router.push('/');
        return;
      }
    }
    
    // Para todas las demás situaciones, usar navegación normal
    if (window.history.length > 1) {
      router.back();
    } else {
      // Solo ir al inicio si no hay historial
      router.push('/');
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 relative overflow-hidden shadow-lg">
      {/* Animated background patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="w-full h-full bg-repeat animate-pulse" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }}></div>
      </div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-2 right-1/4 w-8 h-8 bg-white/10 rounded-full animate-bounce delay-1000"></div>
      <div className="absolute bottom-2 left-1/3 w-6 h-6 bg-red-400/20 rounded-full animate-bounce delay-500"></div>
      <div className="absolute top-3 left-1/2 w-4 h-4 bg-red-400/30 rounded-full animate-pulse delay-700"></div>
      
      <div className="relative z-10 w-full px-2 sm:px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left - Navigation */}
          <div className="flex items-center">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackNavigation}
                className="text-white hover:text-white hover:bg-white/30 backdrop-blur-md border border-white/30 transition-all duration-300 h-10 px-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                <span className="font-medium">Volver</span>
              </Button>
            )}
          </div>

          {/* Right - Brand */}
          <div className="flex items-center pr-6">
            <Link href="/" className="flex items-center group">
              <div className="text-right">
                <h1 className="text-xl font-bold text-white group-hover:text-gray-100 transition-all duration-300 transform group-hover:scale-105 drop-shadow-lg">
                  Style<span className="text-red-400 animate-pulse">Hub</span>
                </h1>
                <p className="text-sm text-gray-200/90 -mt-1 font-light tracking-wide group-hover:text-white transition-colors duration-300">
                  Autenticación
                </p>
              </div>
              <div className="ml-3 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-12 shadow-lg">
                <Home className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
