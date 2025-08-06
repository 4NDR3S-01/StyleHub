import supabase from '@/lib/supabaseClient'

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
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
  discountAmount?: number;
}

/**
 * Valida un cupón por su código y calcula el descuento aplicable
 */
export async function validateCoupon(
  code: string, 
  userId: string, 
  subtotal: number, 
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

    const minAmountValidation = validateMinimumAmount(coupon, subtotal);
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

    const discountAmount = calculateDiscount(coupon, subtotal);

    return {
      valid: true,
      coupon,
      discountAmount: Math.round(discountAmount * 100) / 100
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
    // Registrar uso del cupón
    const { error: usageError } = await supabase
      .from('coupon_usage')
      .insert([{
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount
      }]);

    if (usageError) throw usageError;

    // Incrementar contador de usos
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ used_count: supabase.rpc('increment_used_count', { coupon_id: couponId }) })
      .eq('id', couponId);

    if (updateError) {
      // Si falla el RPC, hacer update manual
      const { data: coupon } = await supabase
        .from('coupons')
        .select('used_count')
        .eq('id', couponId)
        .single();

      if (coupon) {
        await supabase
          .from('coupons')
          .update({ used_count: coupon.used_count + 1 })
          .eq('id', couponId);
      }
    }

  } catch (error: any) {
    console.error('Error recording coupon usage:', error);
    throw new Error('Error al registrar uso del cupón');
  }
}