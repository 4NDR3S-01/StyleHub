"use client";

// Importaciones principales
import React from "react";
import "./globals.css";
import { usePathname } from "next/navigation";

// Importación de providers de contexto para manejo de estado global
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import { WishlistProvider } from "../context/WishlistContext";
import { PersonalizationProvider } from "../context/PersonalizationContext";

// Importación de componentes de layout
import ThemeProvider from "../components/layout/ThemeProvider";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { inter } from "../lib/fonts";

/**
 * RootLayout - Layout principal de la aplicación
 * Maneja la estructura general, contextos globales y renderizado condicional
 * de navbar/footer basado en la ruta actual
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  
  // Optimización: Memoización para evitar renders innecesarios del layout
  const isAdmin = React.useMemo(() => pathname?.startsWith("/admin"), [pathname]);

  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        {/* Estructura jerárquica de providers para manejo de estado global */}
        <AuthProvider>
          <PersonalizationProvider>
            <ThemeProvider>
              <CartProvider>
                <WishlistProvider>
                  <div className="min-h-screen flex flex-col">
                    {/* Renderizado condicional: Navbar solo en rutas públicas */}
                    {!isAdmin && <Navbar />}
                    
                    {/* Contenido principal de cada página */}
                    <main className="flex-1">{children}</main>
                    
                    {/* Renderizado condicional: Footer solo en rutas públicas */}
                    {!isAdmin && <Footer />}
                  </div>
                </WishlistProvider>
              </CartProvider>
            </ThemeProvider>
          </PersonalizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
