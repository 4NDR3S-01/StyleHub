'use client';

import { useEffect, useState } from 'react';

/**
 * Hook que devuelve true solo cuando el componente está montado en el cliente
 * Útil para evitar problemas de hidratación con localStorage y otros APIs del navegador
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
