import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * UTILIDADES GLOBALES DE STYLEHUB
 * Funciones helper reutilizables en toda la aplicación
 */

/**
 * Combina clases CSS de manera inteligente
 * Utiliza clsx para concatenación condicional y tailwind-merge para resolver conflictos
 * 
 * @param inputs - Clases CSS, objetos condicionales, arrays, etc.
 * @returns String de clases CSS optimizado sin conflictos
 * 
 * @example
 * cn('bg-red-500', 'bg-blue-500') // 'bg-blue-500' (última gana)
 * cn('p-4', isActive && 'bg-blue-500') // Condicional
 * cn(['bg-red-500', 'text-white'], className) // Merge con props
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
