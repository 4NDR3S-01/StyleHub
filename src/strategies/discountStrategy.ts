/**
 * STRATEGY PATTERN - DISCOUNT STRATEGIES
 * 
 * Este patrón permite seleccionar algoritmos de cálculo de descuentos
 * en tiempo de ejecución. Facilita agregar nuevos tipos de descuentos
 * sin modificar el código existente y mantiene el principio abierto/cerrado.
 */

import { CartItem } from '@/types';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

/**
 * Contexto de aplicación de descuento
 */
export interface DiscountContext {
  items: CartItem[];
  subtotal: number;
  user?: {
    id: string;
    email: string;
    isFirstPurchase?: boolean;
    totalOrders?: number;
    membershipLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  couponCode?: string;
  appliedAt: Date;
}

/**
 * Resultado de aplicación de descuento
 */
export interface DiscountResult {
  success: boolean;
  discountAmount: number;
  discountPercentage?: number;
  finalAmount: number;
  description: string;
  appliedItems?: string[];  // IDs de productos afectados
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Configuración de descuento
 */
export interface DiscountConfig {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'category' | 'membership' | 'shipping';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  validFrom?: Date;
  validUntil?: Date;
  usageLimit?: number;
  usageCount?: number;
  stackable?: boolean;
  firstPurchaseOnly?: boolean;
  membershipLevels?: string[];
}

/**
 * Interfaz base para estrategias de descuento
 */
export interface DiscountStrategy {
  calculate(context: DiscountContext, config: DiscountConfig): Promise<DiscountResult>;
  isApplicable(context: DiscountContext, config: DiscountConfig): boolean;
  getDescription(): string;
}

// ============================================================================
// IMPLEMENTACIONES DE ESTRATEGIAS
// ============================================================================

/**
 * Estrategia de descuento por porcentaje
 * Aplica un porcentaje de descuento sobre el total o productos específicos
 */
export class PercentageDiscountStrategy implements DiscountStrategy {
  getDescription(): string {
    return 'Descuento por porcentaje sobre el total de la compra';
  }

  isApplicable(context: DiscountContext, config: DiscountConfig): boolean {
    // Verificar monto mínimo
    if (config.minPurchase && context.subtotal < config.minPurchase) {
      return false;
    }

    // Verificar fechas de validez
    const now = context.appliedAt;
    if (config.validFrom && now < config.validFrom) return false;
    if (config.validUntil && now > config.validUntil) return false;

    // Verificar límites de uso
    if (config.usageLimit && (config.usageCount || 0) >= config.usageLimit) {
      return false;
    }

    return true;
  }

  async calculate(context: DiscountContext, config: DiscountConfig): Promise<DiscountResult> {
    if (!this.isApplicable(context, config)) {
      return {
        success: false,
        discountAmount: 0,
        finalAmount: context.subtotal,
        description: 'Descuento no aplicable',
        error: 'No cumple con los requisitos del descuento'
      };
    }

    try {
      let applicableAmount = context.subtotal;
      let appliedItems: string[] = [];

      // Si hay categorías o productos específicos, calcular solo sobre esos
      if (config.applicableCategories?.length || config.applicableProducts?.length) {
        applicableAmount = this.calculateApplicableAmount(context.items, config);
        appliedItems = this.getApplicableItems(context.items, config);
      }

      const discountAmount = Math.min(
        (applicableAmount * config.value) / 100,
        config.maxDiscount || Number.MAX_SAFE_INTEGER
      );

      const finalAmount = Math.max(0, context.subtotal - discountAmount);

      return {
        success: true,
        discountAmount: Math.round(discountAmount * 100) / 100,
        discountPercentage: config.value,
        finalAmount: Math.round(finalAmount * 100) / 100,
        description: `${config.value}% de descuento`,
        appliedItems,
        metadata: {
          strategy: 'percentage',
          originalAmount: applicableAmount,
          configId: config.id
        }
      };
    } catch (error) {
      return {
        success: false,
        discountAmount: 0,
        finalAmount: context.subtotal,
        description: 'Error al calcular descuento',
        error: `Error en cálculo: ${error}`
      };
    }
  }

  private calculateApplicableAmount(items: CartItem[], config: DiscountConfig): number {
    return items
      .filter(item => this.isItemApplicable(item, config))
      .reduce((total, item) => {
        const price = item.product?.price || 0;
        return total + (price * item.quantity);
      }, 0);
  }

  private getApplicableItems(items: CartItem[], config: DiscountConfig): string[] {
    return items
      .filter(item => this.isItemApplicable(item, config))
      .map(item => item.product_id);
  }

  private isItemApplicable(item: CartItem, config: DiscountConfig): boolean {
    // Verificar productos específicos
    if (config.applicableProducts?.length) {
      return config.applicableProducts.includes(item.product_id);
    }

    // Verificar categorías específicas
    if (config.applicableCategories?.length && item.product?.category_id) {
      return config.applicableCategories.includes(item.product.category_id);
    }

    return true;
  }
}

/**
 * Estrategia de descuento fijo
 * Aplica un monto fijo de descuento
 */
export class FixedDiscountStrategy implements DiscountStrategy {
  getDescription(): string {
    return 'Descuento de monto fijo';
  }

  isApplicable(context: DiscountContext, config: DiscountConfig): boolean {
    // El descuento fijo debe ser menor al subtotal
    if (config.value >= context.subtotal) return false;

    // Verificar monto mínimo
    if (config.minPurchase && context.subtotal < config.minPurchase) {
      return false;
    }

    return true;
  }

  async calculate(context: DiscountContext, config: DiscountConfig): Promise<DiscountResult> {
    if (!this.isApplicable(context, config)) {
      return {
        success: false,
        discountAmount: 0,
        finalAmount: context.subtotal,
        description: 'Descuento no aplicable',
        error: 'El monto del descuento es mayor al subtotal'
      };
    }

    const discountAmount = Math.min(config.value, context.subtotal);
    const finalAmount = context.subtotal - discountAmount;
    const discountPercentage = (discountAmount / context.subtotal) * 100;

    return {
      success: true,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountPercentage: Math.round(discountPercentage * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      description: `$${discountAmount} de descuento`,
      metadata: {
        strategy: 'fixed',
        configId: config.id
      }
    };
  }
}

/**
 * Estrategia BOGO (Buy One Get One)
 * Compra uno y lleva otro gratis o con descuento
 */
export class BOGODiscountStrategy implements DiscountStrategy {
  getDescription(): string {
    return 'Compra uno y lleva otro gratis o con descuento';
  }

  isApplicable(context: DiscountContext, config: DiscountConfig): boolean {
    // Debe haber al menos 2 productos aplicables
    const applicableItems = context.items.filter(item => 
      this.isItemApplicable(item, config)
    );
    
    return applicableItems.length >= 1 && 
           applicableItems.some(item => item.quantity >= 2);
  }

  async calculate(context: DiscountContext, config: DiscountConfig): Promise<DiscountResult> {
    if (!this.isApplicable(context, config)) {
      return {
        success: false,
        discountAmount: 0,
        finalAmount: context.subtotal,
        description: 'Descuento BOGO no aplicable',
        error: 'Se requieren al menos 2 productos del mismo tipo'
      };
    }

    let totalDiscount = 0;
    const appliedItems: string[] = [];

    // Aplicar BOGO por cada producto elegible
    context.items.forEach(item => {
      if (this.isItemApplicable(item, config) && item.quantity >= 2) {
        const price = item.product?.price || 0;
        const freeItems = Math.floor(item.quantity / 2);
        const itemDiscount = freeItems * price * (config.value / 100);
        
        totalDiscount += itemDiscount;
        appliedItems.push(item.product_id);
      }
    });

    const finalAmount = context.subtotal - totalDiscount;
    const discountPercentage = (totalDiscount / context.subtotal) * 100;

    return {
      success: true,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      discountPercentage: Math.round(discountPercentage * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      description: `BOGO: ${config.value}% en el segundo producto`,
      appliedItems,
      metadata: {
        strategy: 'bogo',
        configId: config.id
      }
    };
  }

  private isItemApplicable(item: CartItem, config: DiscountConfig): boolean {
    // Si ambos están definidos, el producto debe estar en la lista y la categoría también
    if (config.applicableProducts?.length && config.applicableCategories?.length) {
      return (
        config.applicableProducts.includes(item.product_id) &&
        !!item.product?.category_id &&
        config.applicableCategories.includes(item.product.category_id)
      );
    }
    // Solo productos
    if (config.applicableProducts?.length) {
      return config.applicableProducts.includes(item.product_id);
    }
    // Solo categorías
    if (config.applicableCategories?.length && item.product?.category_id) {
      return config.applicableCategories.includes(item.product.category_id);
    }
    // Si no hay restricciones, es aplicable
    return true;
  }
}

/**
 * Estrategia de descuento por membresía
 * Aplica descuentos basados en el nivel de membresía del usuario
 */
export class MembershipDiscountStrategy implements DiscountStrategy {
  getDescription(): string {
    return 'Descuento por nivel de membresía';
  }

  isApplicable(context: DiscountContext, config: DiscountConfig): boolean {
    if (!context.user?.membershipLevel) return false;
    
    return config.membershipLevels?.includes(context.user.membershipLevel) || false;
  }

  async calculate(context: DiscountContext, config: DiscountConfig): Promise<DiscountResult> {
    if (!this.isApplicable(context, config)) {
      return {
        success: false,
        discountAmount: 0,
        finalAmount: context.subtotal,
        description: 'Descuento por membresía no aplicable',
        error: 'Nivel de membresía no elegible'
      };
    }

    const membershipMultiplier = this.getMembershipMultiplier(context.user!.membershipLevel!);
    const effectiveDiscount = config.value * membershipMultiplier;
    
    const discountAmount = Math.min(
      (context.subtotal * effectiveDiscount) / 100,
      config.maxDiscount || Number.MAX_SAFE_INTEGER
    );

    const finalAmount = context.subtotal - discountAmount;

    return {
      success: true,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountPercentage: effectiveDiscount,
      finalAmount: Math.round(finalAmount * 100) / 100,
      description: `${effectiveDiscount}% descuento ${context.user!.membershipLevel}`,
      metadata: {
        strategy: 'membership',
        membershipLevel: context.user!.membershipLevel,
        configId: config.id
      }
    };
  }

  private getMembershipMultiplier(level: string): number {
    const multipliers: Record<string, number> = {
      bronze: 1,
      silver: 1.2,
      gold: 1.5,
      platinum: 2
    };
    return multipliers[level] || 1;
  }
}

/**
 * Estrategia de descuento para primera compra
 * Ofrece descuentos especiales para usuarios nuevos
 */
export class FirstPurchaseDiscountStrategy implements DiscountStrategy {
  getDescription(): string {
    return 'Descuento especial para primera compra';
  }

  isApplicable(context: DiscountContext, config: DiscountConfig): boolean {
    return config.firstPurchaseOnly === true && 
           context.user?.isFirstPurchase === true;
  }

  async calculate(context: DiscountContext, config: DiscountConfig): Promise<DiscountResult> {
    if (!this.isApplicable(context, config)) {
      return {
        success: false,
        discountAmount: 0,
        finalAmount: context.subtotal,
        description: 'Descuento primera compra no aplicable',
        error: 'Solo válido para primera compra'
      };
    }

    const discountAmount = Math.min(
      (context.subtotal * config.value) / 100,
      config.maxDiscount || Number.MAX_SAFE_INTEGER
    );

    const finalAmount = context.subtotal - discountAmount;

    return {
      success: true,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountPercentage: config.value,
      finalAmount: Math.round(finalAmount * 100) / 100,
      description: `¡Bienvenido! ${config.value}% de descuento en tu primera compra`,
      metadata: {
        strategy: 'first_purchase',
        configId: config.id
      }
    };
  }
}

// ============================================================================
// CONTEXT CLASS (STRATEGY PATTERN IMPLEMENTATION)
// ============================================================================

/**
 * Contexto que utiliza las estrategias de descuento
 * 
 * BENEFICIOS:
 * - Permite cambiar algoritmos de descuento dinámicamente
 * - Facilita agregar nuevos tipos de descuento
 * - Mantiene el código limpio y organizado
 * - Permite combinar múltiples estrategias
 * - Facilita el testing de cada estrategia por separado
 */
export class DiscountCalculator {
  private readonly strategies: Map<string, DiscountStrategy> = new Map();

  constructor() {
    // Registrar estrategias disponibles
    this.registerStrategy('percentage', new PercentageDiscountStrategy());
    this.registerStrategy('fixed', new FixedDiscountStrategy());
    this.registerStrategy('bogo', new BOGODiscountStrategy());
    this.registerStrategy('membership', new MembershipDiscountStrategy());
    this.registerStrategy('first_purchase', new FirstPurchaseDiscountStrategy());
  }

  /**
   * Registra una nueva estrategia de descuento
   */
  registerStrategy(type: string, strategy: DiscountStrategy): void {
    this.strategies.set(type, strategy);
  }

  /**
   * Obtiene una estrategia por tipo
   */
  getStrategy(type: string): DiscountStrategy | undefined {
    return this.strategies.get(type);
  }

  /**
   * Calcula descuento usando la estrategia apropiada
   */
  async calculateDiscount(
    context: DiscountContext,
    config: DiscountConfig
  ): Promise<DiscountResult> {
    const strategy = this.getStrategy(config.type);
    
    if (!strategy) {
      return {
        success: false,
        discountAmount: 0,
        finalAmount: context.subtotal,
        description: 'Estrategia de descuento no encontrada',
        error: `Tipo de descuento no soportado: ${config.type}`
      };
    }

    return await strategy.calculate(context, config);
  }

  /**
   * Aplica múltiples descuentos de manera inteligente
   */
  async applyMultipleDiscounts(
    context: DiscountContext,
    configs: DiscountConfig[]
  ): Promise<DiscountResult> {
    let totalDiscount = 0;
    let currentSubtotal = context.subtotal;
    const appliedDescriptions: string[] = [];
    const appliedItems: Set<string> = new Set();
    const appliedConfigs: string[] = [];

    // Separar descuentos stackables y no-stackables
    const stackableDiscounts = configs.filter(config => config.stackable !== false);
    const nonStackableDiscounts = configs.filter(config => config.stackable === false);

    // Aplicar el mejor descuento no-stackable
    if (nonStackableDiscounts.length > 0) {
      let bestNonStackable: DiscountResult | null = null;
      
      for (const config of nonStackableDiscounts) {
        const result = await this.calculateDiscount(context, config);
        if (result.success && (!bestNonStackable || result.discountAmount > bestNonStackable.discountAmount)) {
          bestNonStackable = result;
          appliedConfigs.push(config.id);
        }
      }

      if (bestNonStackable) {
        totalDiscount = bestNonStackable.discountAmount;
        currentSubtotal = bestNonStackable.finalAmount;
        appliedDescriptions.push(bestNonStackable.description);
        bestNonStackable.appliedItems?.forEach(item => appliedItems.add(item));
      }
    }

    // Aplicar descuentos stackables sobre el monto restante
    for (const config of stackableDiscounts) {
      const discountContext: DiscountContext = {
        ...context,
        subtotal: currentSubtotal
      };

      const result = await this.calculateDiscount(discountContext, config);
      if (result.success) {
        totalDiscount += result.discountAmount;
        currentSubtotal = result.finalAmount;
        appliedDescriptions.push(result.description);
        result.appliedItems?.forEach(item => appliedItems.add(item));
        appliedConfigs.push(config.id);
      }
    }

    const finalAmount = context.subtotal - totalDiscount;
    const discountPercentage = context.subtotal > 0 ? (totalDiscount / context.subtotal) * 100 : 0;

    return {
      success: totalDiscount > 0,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      discountPercentage: Math.round(discountPercentage * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      description: appliedDescriptions.join(' + '),
      appliedItems: Array.from(appliedItems),
      metadata: {
        strategy: 'multiple',
        appliedConfigs,
        stackableCount: stackableDiscounts.length,
        nonStackableCount: nonStackableDiscounts.length
      }
    };
  }

  /**
   * Obtiene todas las estrategias disponibles
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }
}
