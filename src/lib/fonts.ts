import { Inter } from 'next/font/google';

// Configuración de Inter desde Google Fonts con fallbacks robustos
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    'sans-serif'
  ],
  variable: '--font-inter',
  preload: true,
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  // Configuración adicional para manejar timeouts
  adjustFontFallback: true,
});
