import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

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
});

// Fuente de sistema como fallback completo
export const systemFont = localFont({
  src: [
    {
      path: '../../../public/fonts/system-ui.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-system',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

// Clase CSS para usar cuando Inter falle
export const fontClassName = `${inter.variable} font-sans`;
export const systemFontClassName = 'font-system';
