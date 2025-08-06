/**
 * Utilidades para formateo de moneda y números
 * Sistema configurado para USD (Dólar estadounidense) - Ecuador
 */

export const CURRENCY_CONFIG = {
  code: 'USD',
  symbol: '$',
  locale: 'en-US', // Para formato americano de números (USD estándar)
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
 * @returns String formateado como $X.XX o $X,XXX.XX
 */
export function formatPrice(amount: number): string {
  // Para montos menores a 1000, usar formato simple sin separador de miles
  if (amount < 1000) {
    return `${CURRENCY_CONFIG.symbol}${amount.toFixed(2)}`;
  }
  
  // Para montos mayores, usar toLocaleString
  return `${CURRENCY_CONFIG.symbol}${amount.toLocaleString(CURRENCY_CONFIG.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Formatea un número como moneda simple con decimales cuando sea necesario
 * @param amount - El monto a formatear
 * @returns String formateado como $X.XX o $X,XXX.XX
 */
export function formatPriceSimple(amount: number): string {
  // Para USD, siempre mostrar 2 decimales
  if (CURRENCY_CONFIG.code === 'USD') {
    // Para montos menores a 1000, usar formato simple sin separador de miles
    if (amount < 1000) {
      return `${CURRENCY_CONFIG.symbol}${amount.toFixed(2)}`;
    }
    
    // Para montos mayores, usar toLocaleString
    return `${CURRENCY_CONFIG.symbol}${amount.toLocaleString(CURRENCY_CONFIG.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  
  // Para otras monedas, mostrar sin decimales si es entero
  const hasDecimals = amount % 1 !== 0;
  return `${CURRENCY_CONFIG.symbol}${amount.toLocaleString(CURRENCY_CONFIG.locale, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
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
