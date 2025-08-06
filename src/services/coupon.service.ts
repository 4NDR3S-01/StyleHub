import supabase from '@/lib/supabaseClient'
import { createClient } from '@supabase/supabase-js'

// Cliente administrativo para operaciones que requieren permisos elevados
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// STRATEGY PATTERN - DISCOUNT CALCULATION
// ============================================================================

/**
 * Contexto del descuento - información necesaria para calcular descuentos
 */
export interface DiscountContext {
  subtotal: number;
  cartItems?: Array<{
    product: { id: string; price: number; category_id?: string };
    quantity: number;
  }>;
  userId?: string;
  isFirstPurchase?: boolean;
  membershipLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

/**
 * Resultado del cálculo de descuento
 */
export interface DiscountResult {
  discountAmount: number;
  finalAmount: number;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Interfaz Strategy para diferentes tipos de descuento
 */
export interface DiscountStrategy {
  calculate(context: DiscountContext, value: number): DiscountResult;
  isApplicable(context: DiscountContext): boolean;
  getDescription(value: number): string;
}

/**
 * Estrategia: Descuento por porcentaje
 */
export class PercentageDiscountStrategy implements DiscountStrategy {
  calculate(context: DiscountContext, value: number): DiscountResult {
    const discountAmount = (context.subtotal * value) / 100;
    
    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round((context.subtotal - discountAmount) * 100) / 100,
      description: `Descuento del ${value}%`,
      metadata: { type: 'percentage', rate: value }
    };
  }

  isApplicable(context: DiscountContext): boolean {
    return context.subtotal > 0;
  }

  getDescription(value: number): string {
    return `${value}% de descuento`;
  }
}

/**
 * Estrategia: Descuento por cantidad fija
 */
export class FixedDiscountStrategy implements DiscountStrategy {
  calculate(context: DiscountContext, value: number): DiscountResult {
    const discountAmount = Math.min(value, context.subtotal);
    
    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round((context.subtotal - discountAmount) * 100) / 100,
      description: `Descuento de $${value.toLocaleString()}`,
      metadata: { type: 'fixed', amount: value }
    };
  }

  isApplicable(context: DiscountContext): boolean {
    return context.subtotal > 0;
  }

  getDescription(value: number): string {
    return `$${value.toLocaleString()} de descuento`;
  }
}

/**
 * Estrategia: Descuento de membresía
 */
export class MembershipDiscountStrategy implements DiscountStrategy {
  private readonly membershipRates = {
    bronze: 5,
    silver: 10,
    gold: 15,
    platinum: 20
  };

  calculate(context: DiscountContext, value: number): DiscountResult {
    const membershipRate = context.membershipLevel 
      ? this.membershipRates[context.membershipLevel] 
      : 0;
    
    const totalRate = Math.min(value + membershipRate, 50); // Máximo 50%
    const discountAmount = (context.subtotal * totalRate) / 100;
    
    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round((context.subtotal - discountAmount) * 100) / 100,
      description: `Descuento de membresía ${context.membershipLevel}: ${totalRate}%`,
      metadata: { 
        type: 'membership', 
        baseRate: value, 
        membershipRate,
        totalRate 
      }
    };
  }

  isApplicable(context: DiscountContext): boolean {
    return !!(context.subtotal > 0 && context.membershipLevel);
  }

  getDescription(value: number): string {
    return `Descuento especial de membresía`;
  }
}

/**
 * Estrategia: Descuento primera compra
 */
export class FirstPurchaseDiscountStrategy implements DiscountStrategy {
  calculate(context: DiscountContext, value: number): DiscountResult {
    const discountAmount = (context.subtotal * value) / 100;
    
    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round((context.subtotal - discountAmount) * 100) / 100,
      description: `¡Bienvenido! ${value}% de descuento en tu primera compra`,
      metadata: { type: 'first_purchase', rate: value }
    };
  }

  isApplicable(context: DiscountContext): boolean {
    return !!(context.subtotal > 0 && context.isFirstPurchase);
  }

  getDescription(value: number): string {
    return `${value}% descuento primera compra`;
  }
}

/**
 * Context class que maneja las diferentes estrategias de descuento
 */
export class DiscountCalculator {
  private readonly strategies: Map<string, DiscountStrategy> = new Map();

  constructor() {
    this.registerStrategy('percentage', new PercentageDiscountStrategy());
    this.registerStrategy('fixed', new FixedDiscountStrategy());
    this.registerStrategy('membership', new MembershipDiscountStrategy());
    this.registerStrategy('first_purchase', new FirstPurchaseDiscountStrategy());
  }

  registerStrategy(type: string, strategy: DiscountStrategy): void {
    this.strategies.set(type, strategy);
  }

  getStrategy(type: string): DiscountStrategy | undefined {
    return this.strategies.get(type);
  }

  calculateDiscount(
    type: string, 
    context: DiscountContext, 
    value: number
  ): DiscountResult | null {
    const strategy = this.strategies.get(type);
    
    if (!strategy) {
      console.warn(`Discount strategy '${type}' not found`);
      return null;
    }

    if (!strategy.isApplicable(context)) {
      return null;
    }

    return strategy.calculate(context, value);
  }
}

// ============================================================================
// SINGLETON DISCOUNT CALCULATOR INSTANCE
// ============================================================================

/**
 * Instancia única del calculador de descuentos
 */
export const discountCalculator = new DiscountCalculator();

// ============================================================================
// COUPON INTERFACES (ACTUALIZADAS)
// ============================================================================

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'membership' | 'first_purchase';
  discount_value: number;
  minimum_amount: number;
  maximum_discount?: number;
  max_uses?: number;
  used_count: number;
  user_limit: number;
  first_time_only: boolean;
  categories?: string[];
  products?: string[];
  starts_at?: string;
  expires_at?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discountResult?: DiscountResult;
}

/**
 * Valida un cupón y calcula el descuento usando Strategy Pattern
 */
export async function validateCoupon(
  code: string, 
  userId: string, 
  discountContext: DiscountContext,
  categories?: string[], 
  products?: string[]
): Promise<CouponValidationResult> {
  try {
    const normalized = code.trim().toUpperCase();

    const coupon = await fetchCouponByCode(normalized);
    if (!coupon) {
      return { valid: false, error: 'Cupón no encontrado' };
    }

    const dateValidation = validateCouponDates(coupon);
    if (!dateValidation.valid) return dateValidation;

    const minAmountValidation = validateMinimumAmount(coupon, discountContext.subtotal);
    if (!minAmountValidation.valid) return minAmountValidation;

    const maxUsesValidation = validateMaxUses(coupon);
    if (!maxUsesValidation.valid) return maxUsesValidation;

    const firstTimeValidation = await validateFirstTimeOnly(coupon, userId);
    if (!firstTimeValidation.valid) return firstTimeValidation;

    const userLimitValidation = await validateUserLimit(coupon, userId);
    if (!userLimitValidation.valid) return userLimitValidation;

    const categoryValidation = validateCategories(coupon, categories);
    if (!categoryValidation.valid) return categoryValidation;

    const productValidation = validateProducts(coupon, products);
    if (!productValidation.valid) return productValidation;

    // USAR STRATEGY PATTERN para calcular descuento
    const discountResult = discountCalculator.calculateDiscount(
      coupon.discount_type,
      discountContext,
      coupon.discount_value
    );

    if (!discountResult) {
      return { 
        valid: false, 
        error: `Tipo de descuento '${coupon.discount_type}' no es aplicable` 
      };
    }

    // Aplicar límite máximo de descuento si existe
    if (coupon.maximum_discount && discountResult.discountAmount > coupon.maximum_discount) {
      discountResult.discountAmount = coupon.maximum_discount;
      discountResult.finalAmount = discountContext.subtotal - coupon.maximum_discount;
      discountResult.description += ` (limitado a $${coupon.maximum_discount.toLocaleString()})`;
    }

    return {
      valid: true,
      coupon,
      discountResult
    };

  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return { 
      valid: false, 
      error: 'Error al validar cupón' 
    };
  }
}

// Helper functions

async function fetchCouponByCode(code: string): Promise<Coupon | null> {
  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  if (!coupon?.active) {
    return null;
  }

  return coupon;
}

function validateCouponDates(coupon: Coupon): CouponValidationResult {
  const now = new Date();
  const startsAt = coupon.starts_at ? new Date(coupon.starts_at) : null;
  const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;

  if (startsAt && startsAt > now) {
    return { valid: false, error: 'Cupón aún no está activo' };
  }

  if (expiresAt && expiresAt < now) {
    return { valid: false, error: 'Cupón expirado' };
  }

  return { valid: true };
}

function validateMinimumAmount(coupon: Coupon, subtotal: number): CouponValidationResult {
  if (coupon.minimum_amount && subtotal < coupon.minimum_amount) {
    return { 
      valid: false, 
      error: `Monto mínimo requerido: $${coupon.minimum_amount}` 
    };
  }
  return { valid: true };
}

function validateMaxUses(coupon: Coupon): CouponValidationResult {
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return { valid: false, error: 'Cupón agotado' };
  }
  return { valid: true };
}

async function validateFirstTimeOnly(coupon: Coupon, userId: string): Promise<CouponValidationResult> {
  if (!coupon.first_time_only) return { valid: true };
  const { data: userOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .eq('payment_status', 'paid')
    .limit(1);

  if (userOrders && userOrders.length > 0) {
    return { 
      valid: false, 
      error: 'Cupón válido solo para nuevos usuarios' 
    };
  }
  return { valid: true };
}

async function validateUserLimit(coupon: Coupon, userId: string): Promise<CouponValidationResult> {
  const { data: userUsage, error: usageError } = await supabase
    .from('coupon_usage')
    .select('id')
    .eq('coupon_id', coupon.id)
    .eq('user_id', userId);

  if (usageError) throw usageError;

  if (userUsage && userUsage.length >= coupon.user_limit) {
    return { 
      valid: false, 
      error: 'Has alcanzado el límite de usos para este cupón' 
    };
  }
  return { valid: true };
}

function validateCategories(coupon: Coupon, categories?: string[]): CouponValidationResult {
  if (coupon.categories && coupon.categories.length > 0 && categories) {
    const hasValidCategory = categories.some(cat => 
      coupon.categories!.includes(cat)
    );
    if (!hasValidCategory) {
      return { 
        valid: false, 
        error: 'Cupón no aplicable a productos en el carrito' 
      };
    }
  }
  return { valid: true };
}

function validateProducts(coupon: Coupon, products?: string[]): CouponValidationResult {
  if (coupon.products && coupon.products.length > 0 && products) {
    const hasValidProduct = products.some(prod => 
      coupon.products!.includes(prod)
    );
    if (!hasValidProduct) {
      return { 
        valid: false, 
        error: 'Cupón no aplicable a productos en el carrito' 
      };
    }
  }
  return { valid: true };
}

function calculateDiscount(coupon: Coupon, subtotal: number): number {
  let discountAmount = 0;
  if (coupon.discount_type === 'percentage') {
    discountAmount = subtotal * (coupon.discount_value / 100);
    if (coupon.maximum_discount && discountAmount > coupon.maximum_discount) {
      discountAmount = coupon.maximum_discount;
    }
  } else {
    discountAmount = coupon.discount_value;
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }
  }
  return discountAmount;
}

/**
 * Registra el uso de un cupón
 */
export async function recordCouponUsage(
  couponId: string, 
  userId: string, 
  orderId: string, 
  discountAmount: number
): Promise<void> {
  try {
    // Registrar uso del cupón usando cliente administrativo
    const { error: usageError } = await adminSupabase
      .from('coupon_usage')
      .insert([{
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount
      }]);

    if (usageError) throw usageError;

    // Incrementar contador de usos - obtener el valor actual primero
    const { data: coupon, error: fetchError } = await adminSupabase
      .from('coupons')
      .select('used_count')
      .eq('id', couponId)
      .single();

    if (fetchError) throw fetchError;

    if (coupon) {
      const { error: updateError } = await adminSupabase
        .from('coupons')
        .update({ used_count: coupon.used_count + 1 })
        .eq('id', couponId);

      if (updateError) throw updateError;
    }

  } catch (error: any) {
    console.error('Error recording coupon usage:', error);
    throw new Error('Error al registrar uso del cupón');
  }
}

// ============================================================================
// STRATEGY PATTERN USAGE EXAMPLES
// ============================================================================

/**
 * Ejemplo de uso del Strategy Pattern para cálculo de descuentos
 * 
 * // Descuento por porcentaje
 * const context: DiscountContext = {
 *   subtotal: 100000,
 *   userId: 'user-123'
 * };
 * const result = discountCalculator.calculateDiscount('percentage', context, 15);
 * 
 * // Descuento de membresía
 * const memberContext: DiscountContext = {
 *   subtotal: 200000,
 *   userId: 'user-456',
 *   membershipLevel: 'gold'
 * };
 * const memberResult = discountCalculator.calculateDiscount('membership', memberContext, 10);
 * 
 * // Agregar nueva estrategia personalizada
 * class CustomDiscountStrategy implements DiscountStrategy {
 *   calculate(context: DiscountContext, value: number): DiscountResult {
 *     // Lógica personalizada
 *   }
 * }
 * discountCalculator.registerStrategy('custom', new CustomDiscountStrategy());
 */

/**
 * BENEFICIOS DEL STRATEGY PATTERN IMPLEMENTADO:
 * 
 * 1. EXTENSIBILIDAD: Fácil agregar nuevos tipos de descuento sin modificar código existente
 * 2. MANTENIBILIDAD: Cada estrategia está encapsulada en su propia clase
 * 3. TESTABILIDAD: Cada estrategia se puede probar de forma independiente
 * 4. FLEXIBILIDAD: Se pueden combinar estrategias o cambiar en tiempo de ejecución
 * 5. PRINCIPIO ABIERTO/CERRADO: Abierto para extensión, cerrado para modificación
 */