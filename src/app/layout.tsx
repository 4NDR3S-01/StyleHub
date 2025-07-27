"use client";
import React from "react";
import "./globals.css";
import { usePathname } from "next/navigation";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { inter } from "../lib/fonts";
import { Toaster } from "sonner";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  // Memoiza el valor para evitar renders innecesarios
  const isAdmin = React.useMemo(() => pathname?.startsWith("/admin"), [pathname]);
  const isAuth = React.useMemo(() => 
    pathname === "/login" || 
    pathname === "/register" || 
    pathname === "/reset-password" || 
    pathname === "/confirm-email" || 
    pathname === "/change-email", 
    [pathname]
  );

  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        {/* Contextos globales y layout ético */}
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col">
              {/* Navbar y Footer solo en rutas no admin y no auth */}
              {!isAdmin && !isAuth && <Navbar />}
              <main className="flex-1">{children}</main>
              {!isAdmin && !isAuth && <Footer />}
            </div>
            <Toaster 
              position="top-right"
              richColors
              closeButton
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
