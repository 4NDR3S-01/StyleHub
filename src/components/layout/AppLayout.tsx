'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';

interface AppLayoutProps {
  readonly children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isAdmin = React.useMemo(() => pathname?.startsWith("/admin"), [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Renderizado condicional: Navbar solo en rutas públicas */}
      {!isAdmin && <Navbar />}
      
      {/* Contenido principal de cada página */}
      <main className="flex-1">{children}</main>
      
      {/* Renderizado condicional: Footer solo en rutas públicas */}
      {!isAdmin && <Footer />}
    </div>
  );
}
