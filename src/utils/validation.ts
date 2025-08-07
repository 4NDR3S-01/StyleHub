import { z } from 'zod';
import isEmail from 'validator/lib/isEmail';

/**
 * ESQUEMAS DE VALIDACIÓN PARA LA APLICACIÓN
 * Utiliza Zod para validación de tipos y datos en tiempo de ejecución
 * Centraliza todas las reglas de validación para mantener consistencia
 */

// ============================================================================
// ESQUEMAS BÁSICOS REUTILIZABLES
// ============================================================================

/**
 * Validación de email con formato estándar
 */
export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .refine((val) => isEmail(val), { message: 'Formato de email inválido' });

/**
 * Validación de contraseña con requisitos de seguridad
 * - Mínimo 8 caracteres
 * - Al menos una minúscula, mayúscula, número y carácter especial
 */
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .refine((val) => /[a-z]/.test(val), { message: 'Debe contener al menos una letra minúscula' })
  .refine((val) => /[A-Z]/.test(val), { message: 'Debe contener al menos una letra mayúscula' })
  .refine((val) => /\d/.test(val), { message: 'Debe contener al menos un número' })
  .refine((val) => /[@$!%*?&]/.test(val), { message: 'Debe contener al menos un carácter especial' });

/**
 * Validación de teléfono internacional
 */
export const phoneSchema = z
  .string()
  .min(10, 'El teléfono debe tener al menos 10 dígitos')
  .refine((val) => /^\+?[\d\s\-()]+$/.test(val), { message: 'Formato de teléfono inválido' });

/**
 * Validación de nombres (solo letras y espacios, incluye caracteres latinos)
 */
export const nameSchema = z
  .string()
  .min(2, 'Debe tener al menos 2 caracteres')
  .refine((val) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val), { message: 'Solo se permiten letras y espacios' });

// ============================================================================
// ESQUEMAS COMPUESTOS PARA FORMULARIOS
// ============================================================================

/**
 * Esquema para registro de usuario
 * Combina validaciones básicas para el formulario de registro
 */
export const registerSchema = z.object({
  name: nameSchema,
  lastname: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Esquema para login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Esquema para checkout
export const checkoutSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(10, 'La dirección debe ser más específica'),
  city: z.string().min(2, 'Ciudad requerida'),
  state: z.string().min(2, 'Estado/Provincia requerida'),
  zipCode: z.string().min(4, 'Código postal requerido'),
  country: z.string().min(2, 'País requerido'),
  saveInfo: z.boolean().default(false),
});

// Utilidades de validación
export const validateCardNumber = (cardNumber: string): boolean => {
  const num = cardNumber.replace(/\s/g, '');
  
  if (!/^\d{13,19}$/.test(num)) return false;
  
  // Luhn algorithm
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i]);
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
};

export const validateExpiryDate = (expiry: string): boolean => {
  const [month, year] = expiry.split('/');
  if (!month || !year) return false;
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear() % 100;
  
  const expMonth = parseInt(month);
  const expYear = parseInt(year);
  
  if (expMonth < 1 || expMonth > 12) return false;
  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;
  
  return true;
};

export const validateCVV = (cvv: string, cardType?: string): boolean => {
  if (cardType === 'amex') {
    return /^\d{4}$/.test(cvv);
  }
  return /^\d{3}$/.test(cvv);
};

// Validador de stock
export const validateStock = (requestedQuantity: number, availableStock: number): boolean => {
  return requestedQuantity > 0 && requestedQuantity <= availableStock;
};

// Validador de precios
export const validatePrice = (price: number): boolean => {
  return price > 0 && Number.isFinite(price);
};

// Validador de imágenes
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Tipo de archivo no permitido. Use JPG, PNG o WebP.' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: 'El archivo es muy grande. Máximo 5MB.' };
  }
  
  return { isValid: true };
};

// Sanitizador de HTML para prevenir XSS
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validador de URL
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
