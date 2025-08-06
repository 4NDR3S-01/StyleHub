/**
 * STRATEGY PATTERN MEJORADO
 * 
 * El patrón Strategy permite definir una familia de algoritmos,
 * encapsularlos y hacerlos intercambiables en tiempo de ejecución.
 * En este caso, estrategias para diferentes métodos de envío.
 */

// Interfaz estrategia para cálculo de envío
export interface ShippingStrategy {
  name: string;
  description: string;
  calculateCost(subtotal: number, weight?: number, distance?: number): number;
  getEstimatedDays(): string;
  isAvailable(subtotal: number): boolean;
  getIcon(): string;
}

/**
 * ESTRATEGIA CONCRETA: Envío Estándar
 */
export class StandardShippingStrategy implements ShippingStrategy {
  name = 'Envío Estándar';
  description = 'Entrega normal en días laborables';

  calculateCost(subtotal: number, weight = 1, distance = 10): number {
    const baseCost = 15000; // Costo base en COP
    const weightCost = weight * 2000; // Costo por kg
    const distanceCost = distance * 500; // Costo por km
    
    // Envío gratis si subtotal > 150,000 COP
    if (subtotal >= 150000) {
      return 0;
    }
    
    return baseCost + weightCost + distanceCost;
  }

  getEstimatedDays(): string {
    return '5-7 días laborables';
  }

  isAvailable(subtotal: number): boolean {
    return subtotal >= 50000; // Mínimo 50,000 COP
  }

  getIcon(): string {
    return '📦';
  }
}

/**
 * ESTRATEGIA CONCRETA: Envío Express
 */
export class ExpressShippingStrategy implements ShippingStrategy {
  name = 'Envío Express';
  description = 'Entrega rápida en 1-2 días';

  calculateCost(subtotal: number, weight = 1, distance = 10): number {
    const baseCost = 25000; // Costo base más alto
    const weightCost = weight * 3000; // Costo por kg más alto
    const distanceCost = distance * 800; // Costo por km más alto
    
    // Sin envío gratis para express, pero descuento si subtotal > 300,000 COP
    if (subtotal >= 300000) {
      return (baseCost + weightCost + distanceCost) * 0.5; // 50% descuento
    }
    
    return baseCost + weightCost + distanceCost;
  }

  getEstimatedDays(): string {
    return '1-2 días laborables';
  }

  isAvailable(subtotal: number): boolean {
    return subtotal >= 100000; // Mínimo 100,000 COP para express
  }

  getIcon(): string {
    return '⚡';
  }
}

/**
 * ESTRATEGIA CONCRETA: Envío Overnight
 */
export class OvernightShippingStrategy implements ShippingStrategy {
  name = 'Envío Overnight';
  description = 'Entrega al día siguiente antes de las 12 PM';

  calculateCost(subtotal: number, weight = 1, distance = 10): number {
    const baseCost = 45000; // Costo base premium
    const weightCost = weight * 5000; // Costo por kg premium
    const distanceCost = distance * 1200; // Costo por km premium
    
    // Solo descuento mínimo para overnight
    if (subtotal >= 500000) {
      return (baseCost + weightCost + distanceCost) * 0.8; // 20% descuento
    }
    
    return baseCost + weightCost + distanceCost;
  }

  getEstimatedDays(): string {
    return 'Siguiente día laborable';
  }

  isAvailable(subtotal: number): boolean {
    return subtotal >= 200000; // Mínimo 200,000 COP para overnight
  }

  getIcon(): string {
    return '🚁';
  }
}

/**
 * ESTRATEGIA CONCRETA: Envío Gratis (Retiro en tienda)
 */
export class PickupShippingStrategy implements ShippingStrategy {
  name = 'Retiro en Tienda';
  description = 'Recoge tu pedido sin costo en nuestras tiendas';

  calculateCost(subtotal: number): number {
    return 0; // Siempre gratis
  }

  getEstimatedDays(): string {
    return '2-3 días laborables';
  }

  isAvailable(subtotal: number): boolean {
    return subtotal >= 20000; // Mínimo 20,000 COP
  }

  getIcon(): string {
    return '🏪';
  }
}

/**
 * CONTEXTO DEL STRATEGY PATTERN
 * 
 * Esta clase mantiene una referencia a una estrategia de envío
 * y permite cambiarla dinámicamente.
 */
export class ShippingCalculator {
  private strategy: ShippingStrategy;

  constructor(strategy: ShippingStrategy) {
    this.strategy = strategy;
  }

  /**
   * Cambiar la estrategia de envío en tiempo de ejecución
   */
  setStrategy(strategy: ShippingStrategy): void {
    this.strategy = strategy;
    console.log(`🔄 Estrategia de envío cambiada a: ${strategy.name}`);
  }

  /**
   * Calcular costo usando la estrategia actual
   */
  calculateShipping(subtotal: number, weight?: number, distance?: number): number {
    if (!this.strategy.isAvailable(subtotal)) {
      throw new Error(`Método de envío ${this.strategy.name} no disponible para este subtotal`);
    }

    const cost = this.strategy.calculateCost(subtotal, weight, distance);
    
    console.log(`💰 Costo calculado con ${this.strategy.name}: $${cost.toLocaleString('es-CO')}`);
    
    return cost;
  }

  /**
   * Obtener información de la estrategia actual
   */
  getShippingInfo() {
    return {
      name: this.strategy.name,
      description: this.strategy.description,
      estimatedDays: this.strategy.getEstimatedDays(),
      icon: this.strategy.getIcon()
    };
  }

  /**
   * Verificar disponibilidad
   */
  isAvailable(subtotal: number): boolean {
    return this.strategy.isAvailable(subtotal);
  }
}

/**
 * FACTORY PARA ESTRATEGIAS DE ENVÍO
 * 
 * Centraliza la creación y gestión de estrategias
 */
export class ShippingStrategyFactory {
  private static readonly strategies = new Map<string, () => ShippingStrategy>([
    ['standard', () => new StandardShippingStrategy()],
    ['express', () => new ExpressShippingStrategy()],
    ['overnight', () => new OvernightShippingStrategy()],
    ['pickup', () => new PickupShippingStrategy()]
  ]);

  /**
   * Crear una estrategia específica
   */
  static createStrategy(type: string): ShippingStrategy {
    const creator = this.strategies.get(type.toLowerCase());
    
    if (!creator) {
      throw new Error(`Estrategia de envío no soportada: ${type}`);
    }

    console.log(`🏭 Creando estrategia de envío: ${type}`);
    return creator();
  }

  /**
   * Obtener todas las estrategias disponibles para un subtotal
   */
  static getAvailableStrategies(subtotal: number): ShippingStrategy[] {
    const availableStrategies: ShippingStrategy[] = [];
    const types = Array.from(this.strategies.keys());

    for (const type of types) {
      try {
        const strategy = this.createStrategy(type);
        if (strategy.isAvailable(subtotal)) {
          availableStrategies.push(strategy);
        }
      } catch (error) {
        console.warn(`⚠️ Error creando estrategia ${type}:`, error);
      }
    }

    console.log(`📋 Estrategias disponibles para subtotal $${subtotal.toLocaleString('es-CO')}:`, 
                availableStrategies.map(s => s.name));

    return availableStrategies;
  }

  /**
   * Obtener la mejor estrategia (más económica) para un subtotal
   */
  static getBestStrategy(subtotal: number, weight?: number, distance?: number): ShippingStrategy | null {
    const availableStrategies = this.getAvailableStrategies(subtotal);
    
    if (availableStrategies.length === 0) {
      return null;
    }

    let bestStrategy = availableStrategies[0];
    let lowestCost = bestStrategy.calculateCost(subtotal, weight, distance);

    for (const strategy of availableStrategies.slice(1)) {
      const cost = strategy.calculateCost(subtotal, weight, distance);
      if (cost < lowestCost) {
        bestStrategy = strategy;
        lowestCost = cost;
      }
    }

    console.log(`⭐ Mejor estrategia para subtotal $${subtotal.toLocaleString('es-CO')}: ${bestStrategy.name} ($${lowestCost.toLocaleString('es-CO')})`);

    return bestStrategy;
  }

  /**
   * Registrar una nueva estrategia dinámicamente
   */
  static registerStrategy(type: string, creator: () => ShippingStrategy): void {
    if (this.strategies.has(type)) {
      console.warn(`⚠️ Sobrescribiendo estrategia existente: ${type}`);
    }
    
    this.strategies.set(type, creator);
    console.log(`✅ Estrategia de envío registrada: ${type}`);
  }

  /**
   * Obtener tipos de estrategias soportadas
   */
  static getSupportedTypes(): string[] {
    return Array.from(this.strategies.keys());
  }
}

/**
 * SERVICIO DE ENVÍO QUE USA EL PATTERN STRATEGY
 * 
 * Proporciona una interfaz de alto nivel para manejar envíos
 */
export class ShippingService {
  private readonly calculator: ShippingCalculator;

  constructor(initialStrategy?: ShippingStrategy) {
    // Por defecto usar estrategia estándar
    this.calculator = new ShippingCalculator(
      initialStrategy || new StandardShippingStrategy()
    );
  }

  /**
   * Calcular opciones de envío para un pedido
   */
  getShippingOptions(subtotal: number, weight?: number, distance?: number) {
    const availableStrategies = ShippingStrategyFactory.getAvailableStrategies(subtotal);
    
    return availableStrategies.map(strategy => {
      const calculator = new ShippingCalculator(strategy);
      const cost = calculator.calculateShipping(subtotal, weight, distance);
      const info = calculator.getShippingInfo();
      
      return {
        id: strategy.name.toLowerCase().replace(/\s+/g, '-'),
        name: info.name,
        description: info.description,
        cost,
        estimatedDays: info.estimatedDays,
        icon: info.icon,
        isFree: cost === 0
      };
    });
  }

  /**
   * Seleccionar método de envío
   */
  selectShippingMethod(type: string, subtotal: number, weight?: number, distance?: number) {
    try {
      const strategy = ShippingStrategyFactory.createStrategy(type);
      this.calculator.setStrategy(strategy);
      
      const cost = this.calculator.calculateShipping(subtotal, weight, distance);
      const info = this.calculator.getShippingInfo();
      
      return {
        selected: true,
        cost,
        info
      };
    } catch (error: any) {
      console.error('❌ Error seleccionando método de envío:', error);
      throw error;
    }
  }

  /**
   * Obtener recomendación automática
   */
  getRecommendedShipping(subtotal: number, weight?: number, distance?: number) {
    const bestStrategy = ShippingStrategyFactory.getBestStrategy(subtotal, weight, distance);
    
    if (!bestStrategy) {
      throw new Error('No hay métodos de envío disponibles para este subtotal');
    }

    this.calculator.setStrategy(bestStrategy);
    const cost = this.calculator.calculateShipping(subtotal, weight, distance);
    const info = this.calculator.getShippingInfo();

    return {
      recommended: true,
      cost,
      info
    };
  }
}

export default ShippingService;
