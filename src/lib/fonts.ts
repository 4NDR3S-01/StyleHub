import { Inter } from 'next/font/google';

/**
 * CONFIGURACIÓN DE FUENTES PARA STYLEHUB
 * 
 * Configuración optimizada de tipografías usando Next.js font optimization
 * Incluye fallbacks robustos y estrategias de loading para mejor performance
 */

/**
 * Fuente principal: Inter de Google Fonts
 * 
 * Inter es una fuente diseñada específicamente para pantallas digitales
 * con excelente legibilidad y soporte completo para caracteres latinos
 * 
 * Configuración optimizada para:
 * - Todos los pesos de fuente (100-900)
 * - Display swap para evitar FOIT (Flash of Invisible Text)
 * - Fallbacks del sistema para carga inmediata
 * - Preload para mejor performance inicial
 */
export const inter = Inter({
  subsets: ['latin'],                     // Subconjunto de caracteres latinos
  display: 'swap',                        // Estrategia de intercambio de fuentes
  fallback: [
    // Fallbacks ordenados por disponibilidad en diferentes sistemas
    'system-ui',                          // Fuente del sistema (moderno)
    '-apple-system',                      // macOS/iOS
    'BlinkMacSystemFont',                 // macOS (Webkit)
    'Segoe UI',                          // Windows
    'Roboto',                            // Android
    'Oxygen',                            // Linux (KDE)
    'Ubuntu',                            // Linux (Ubuntu)
    'Cantarell',                         // Linux (GNOME)
    'Fira Sans',                         // Mozilla
    'Droid Sans',                        // Android (legacy)
    'Helvetica Neue',                    // macOS (legacy)
    'sans-serif'                         // Fallback genérico
  ],
  variable: '--font-inter',               // Variable CSS para uso en Tailwind
  preload: true,                          // Precargar para mejor performance
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  adjustFontFallback: true,               // Ajuste automático de métricas de fallback
});
