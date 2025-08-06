/**
 * Utilidades para formateo de moneda y números
 * Sistema configurado para USD (Dólar estadounidense) - Ecuador
 */

export const CURRENCY_CONFIG = {
  code: 'USD',
  symbol: '$',
  locale: 'en-US', // Para formato americano de números
  name: 'Dólar estadounidense'
} as const;

/**
 * Formatea un número como moneda en USD
 * @param amount - El monto a formatear
 * @param options - Opciones adicionales de formateo
 * @returns String formateado como moneda USD
 */
export function formatCurrency(
  amount: number, 
  options: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
   const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  const formatted = new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: CURRENCY_CONFIG.code,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);

  return formatted;
}

/**
 * Formatea un número como moneda simple (solo con símbolo $)
 * @param amount - El monto a formatear
 * @returns String formateado como $X,XXX.XX
 */
export function formatPrice(amount: number): string {
  return `${CURRENCY_CONFIG.symbol}${amount.toLocaleString(CURRENCY_CONFIG.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Formatea un número como moneda simple sin decimales
 * @param amount - El monto a formatear
 * @returns String formateado como $X,XXX
 */
export function formatPriceSimple(amount: number): string {
  return `${CURRENCY_CONFIG.symbol}${amount.toLocaleString(CURRENCY_CONFIG.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

/**
 * Obtiene el símbolo de la moneda
 * @returns El símbolo de la moneda ($)
 */
export function getCurrencySymbol(): string {
  return CURRENCY_CONFIG.symbol;
}

/**
 * Obtiene el código de la moneda
 * @returns El código de la moneda (USD)
 */
export function getCurrencyCode(): string {
  return CURRENCY_CONFIG.code;
}

/**
 * Parsea un string de precio a número
 * @param priceString - String con formato de precio (ej: "$1,234.56")
 * @returns Número parseado
 */
export function parsePrice(priceString: string): number {
  // Remover símbolo de moneda y comas
  const cleanString = priceString.replace(/[$,]/g, '');
  return parseFloat(cleanString) || 0;
}
