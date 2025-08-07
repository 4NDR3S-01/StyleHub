"use client";

// Importaciones principales
import React from "react";
import "./globals.css";

// Importación de providers de contexto para manejo de estado global
import { AuthProvider } from "../context/AuthContext";
import { PersonalizationProvider } from "../context/PersonalizationContext";
import ClientProviders from "../components/providers/ClientProviders";

// Importación de componentes de layout
import ThemeProvider from "../components/layout/ThemeProvider";
import { inter } from "../lib/fonts";

/**
 * RootLayout - Layout principal de la aplicación
 * Maneja la estructura general y contextos globales
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        {/* Estructura jerárquica de providers para manejo de estado global */}
        <AuthProvider>
          <PersonalizationProvider>
            <ThemeProvider>
              <ClientProviders>
                {children}
              </ClientProviders>
            </ThemeProvider>
          </PersonalizationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
