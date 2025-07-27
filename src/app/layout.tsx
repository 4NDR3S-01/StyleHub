"use client";
import React from "react";
import "./globals.css";
import { usePathname } from "next/navigation";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { inter } from "../lib/fonts";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  // Memoiza el valor para evitar renders innecesarios
  const isAdmin = React.useMemo(() => pathname?.startsWith("/admin"), [pathname]);

  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        {/* Contextos globales y layout ético */}
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col">
              {/* Navbar y Footer solo en rutas públicas */}
              {!isAdmin && <Navbar />}
              <main className="flex-1">{children}</main>
              {!isAdmin && <Footer />}
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
