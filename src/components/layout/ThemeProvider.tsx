'use client';

import { useEffect } from 'react';
import { usePersonalizationContext } from '@/context/PersonalizationContext';

export default function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
  const { theme } = usePersonalizationContext();

  useEffect(() => {
    if (theme?.colors) {
      const root = document.documentElement;
      
      // Aplicar variables CSS personalizadas
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });

      // Aplicar clases de Tailwind dinámicamente
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        :root {
          --tw-color-primary: ${theme.colors.primary};
          --tw-color-secondary: ${theme.colors.secondary};
          --tw-color-accent: ${theme.colors.accent};
          --tw-color-neutral: ${theme.colors.neutral};
          --tw-color-background: ${theme.colors.background};
          --tw-color-text: ${theme.colors.text};
        }
        
        .bg-primary { background-color: ${theme.colors.primary} !important; }
        .text-primary { color: ${theme.colors.primary} !important; }
        .border-primary { border-color: ${theme.colors.primary} !important; }
        
        .bg-secondary { background-color: ${theme.colors.secondary} !important; }
        .text-secondary { color: ${theme.colors.secondary} !important; }
        .border-secondary { border-color: ${theme.colors.secondary} !important; }
        
        .bg-accent { background-color: ${theme.colors.accent} !important; }
        .text-accent { color: ${theme.colors.accent} !important; }
        .border-accent { border-color: ${theme.colors.accent} !important; }
        
        .hover\\:bg-primary:hover { background-color: ${theme.colors.primary} !important; }
        .hover\\:text-primary:hover { color: ${theme.colors.primary} !important; }
        
        .hover\\:bg-secondary:hover { background-color: ${theme.colors.secondary} !important; }
        .hover\\:text-secondary:hover { color: ${theme.colors.secondary} !important; }
      `;
      
      // Remover stylesheet anterior si existe
      const existingStyleSheet = document.getElementById('dynamic-theme');
      if (existingStyleSheet) {
        existingStyleSheet.remove();
      }
      
      styleSheet.id = 'dynamic-theme';
      document.head.appendChild(styleSheet);
    }
  }, [theme]);

  return <>{children}</>;
}
