'use client';

import { useEffect, useState } from 'react';

interface FontLoaderProps {
  children: React.ReactNode;
}

export default function FontLoader({ children }: Readonly<FontLoaderProps>) {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontError, setFontError] = useState(false);

  useEffect(() => {
    // Verificar si Inter está disponible
    const checkFont = async () => {
      try {
        // Intentar cargar la fuente Inter
        await document.fonts.load('400 16px Inter');
        
        // Verificar si la fuente está realmente disponible
        const fontFace = new FontFace('Inter', 'url(https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap)');
        await fontFace.load();
        
        setFontLoaded(true);
      } catch (error) {
        console.warn('Inter font failed to load, using system fonts:', error);
        setFontError(true);
        // Aplicar fuente de sistema como fallback
        document.documentElement.style.setProperty(
          '--font-inter', 
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        );
      }
    };

    // Timeout para evitar bloqueos
    const timeoutId = setTimeout(() => {
      if (!fontLoaded) {
        setFontError(true);
        console.warn('Font loading timeout, using system fonts');
        document.documentElement.style.setProperty(
          '--font-inter', 
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        );
      }
    }, 5000); // 5 segundos de timeout

    checkFont();

    return () => clearTimeout(timeoutId);
  }, [fontLoaded]);

  return (
    <div className={fontError ? 'font-system' : 'font-sans'}>
      {children}
    </div>
  );
}
