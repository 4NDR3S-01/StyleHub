# 📋 DOCUMENTACIÓN DE PATRONES DE DISEÑO - StyleHub

Este documento detalla la implementación de los 4 patrones de diseño solicitados en la aplicación StyleHub.

## 🎯 **RESUMEN EJECUTIVO**

✅ **TODOS LOS PATRONES IMPLEMENTADOS:**
- **Singleton Pattern** - ✅ Completo y mejorado
- **Factory Method Pattern** - ✅ Nuevo, implementado completo
- **Repository Pattern** - ✅ Nuevo, implementado completo  
- **Strategy Pattern** - ✅ Nuevo, implementado completo

---

## 📍 **1. SINGLETON PATTERN**

### **Ubicación:** 
- **Principal**: `/src/patterns/singleton/Logger.ts`
- **Original**: `/src/utils/logger.ts` (existente, mejorado)

### **Función:**
Garantiza que solo exista **una instancia única** del Logger en toda la aplicación, proporcionando un punto de acceso global para el sistema de logging.

### **Implementación:**
```typescript
class Logger {
  private static instance: Logger | null = null;
  private static isCreating = false;
  
  private constructor(config?: Partial<LoggerConfig>) {
    // Constructor privado
  }

  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.isCreating = true;
      Logger.instance ??= new Logger(config);
      Logger.isCreating = false;
    }
    return Logger.instance;
  }
}

// Instancia singleton exportada
export const logger = Logger.getInstance();
```

### **Características:**
- **Thread-safe**: Previene creación de múltiples instancias concurrentes
- **Configuración flexible**: Permite configurar niveles de log, storage, etc.
- **Gestión de memoria**: Limita logs almacenados para evitar memory leaks
- **Environment-aware**: Diferentes configuraciones para desarrollo vs producción

### **Uso en la aplicación:**
```typescript
import { logger } from '@/patterns/singleton/Logger';

logger.info('Usuario logueado', { userId: user.id });
logger.error('Error en checkout', error);
```

---

## 🏭 **2. FACTORY METHOD PATTERN**

### **Ubicación:** 
- **Principal**: `/src/patterns/factory/PaymentMethodFactory.ts`

### **Función:**
Crea diferentes tipos de **métodos de pago** (Stripe, PayPal, Débito) sin exponer la lógica de instanciación al cliente, permitiendo agregar nuevos métodos fácilmente.

### **Implementación:**
```typescript
// Interfaz común
export interface PaymentMethod {
  type: string;
  processPayment(amount: number, orderId: string): Promise<PaymentResult>;
  validatePaymentData(data: any): boolean;
  getProviderInfo(): PaymentProviderInfo;
}

// Implementaciones concretas
export class StripePaymentMethod implements PaymentMethod {
  type = 'stripe';
  async processPayment(amount: number, orderId: string): Promise<PaymentResult> {
    // Lógica específica de Stripe
  }
}

export class PayPalPaymentMethod implements PaymentMethod {
  type = 'paypal';
  async processPayment(amount: number, orderId: string): Promise<PaymentResult> {
    // Lógica específica de PayPal
  }
}

// Factory Method
export class PaymentMethodFactory {
  private static readonly supportedMethods = new Map<string, () => PaymentMethod>();

  static createPaymentMethod(type: string): PaymentMethod {
    const creator = this.supportedMethods.get(type.toLowerCase());
    if (!creator) {
      throw new Error(`Método de pago no soportado: ${type}`);
    }
    return creator();
  }
}
```

### **Características:**
- **Extensible**: Fácil agregar nuevos métodos de pago
- **Registro dinámico**: Permite registrar métodos en runtime
- **Validación**: Cada método valida sus propios datos
- **Información del proveedor**: Cada método proporciona su metadata

### **Uso en la aplicación:**
```typescript
// Crear método de pago dinámicamente
const paymentMethod = PaymentMethodFactory.createPaymentMethod('stripe');
const result = await paymentMethod.processPayment(100000, 'order-123');

// Procesar pago usando utility
const result = await PaymentProcessor.processPayment('paypal', 50000, 'order-456');
```

---

## 🗃️ **3. REPOSITORY PATTERN**

### **Ubicación:** 
- **Principal**: `/src/patterns/repository/BaseRepository.ts`

### **Función:**
Encapsula la **lógica de acceso a datos** y proporciona una interfaz orientada a objetos para acceder a la base de datos, desacoplando la infraestructura de la lógica de negocio.

### **Implementación:**
```typescript
// Interfaz base
export interface BaseRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
  exists(id: ID): Promise<boolean>;
}

// Repositorio base abstracto
export abstract class BaseSupabaseRepository<T, ID = string> implements BaseRepository<T, ID> {
  protected abstract tableName: string;

  async findById(id: ID): Promise<T | null> {
    // Implementación común para Supabase
  }
  
  // Métodos de mapeo que deben implementar las clases hijas
  protected abstract mapFromDatabase(data: any): T;
  protected abstract mapToDatabase(entity: Partial<T>): any;
}

// Repositorio específico
export class ProductRepository extends BaseSupabaseRepository<Product> {
  protected tableName = 'products';

  async findByCategory(categoryId: string): Promise<Product[]> {
    // Lógica específica para productos
  }

  async findFeatured(): Promise<Product[]> {
    // Lógica específica para productos destacados
  }
}

// Factory para repositorios
export class RepositoryFactory {
  static getProductRepository(): ProductRepository {
    // Singleton para repositorios
  }
}
```

### **Características:**
- **Separación de responsabilidades**: Lógica de datos separada del negocio
- **Interfaz consistente**: Mismas operaciones para todas las entidades
- **Mapeo automático**: Convierte entre objetos de dominio y base de datos
- **Búsqueda avanzada**: Criterios de filtrado, ordenamiento y paginación
- **Factory incluido**: Gestión centralizada de instancias de repositorios

### **Uso en la aplicación:**
```typescript
// Obtener repositorio
const productRepo = RepositoryFactory.getProductRepository();

// Operaciones CRUD
const product = await productRepo.findById('product-123');
const featuredProducts = await productRepo.findFeatured();
const newProduct = await productRepo.create({ name: 'Nuevo Producto' });

// Búsqueda avanzada
const result = await productRepo.findByCriteria({
  filters: { category_id: 'cat-1', active: true },
  sort: { field: 'name', direction: 'asc' },
  pagination: { page: 1, limit: 10 }
});
```

---

## 🎛️ **4. STRATEGY PATTERN**

### **Ubicación:** 
- **Principal**: `/src/patterns/strategy/ShippingStrategy.ts`

### **Función:**
Define una familia de **algoritmos de cálculo de envío** (Estándar, Express, Overnight, Pickup), los encapsula y los hace intercambiables en tiempo de ejecución.

### **Implementación:**
```typescript
// Interfaz estrategia
export interface ShippingStrategy {
  name: string;
  description: string;
  calculateCost(subtotal: number, weight?: number, distance?: number): number;
  getEstimatedDays(): string;
  isAvailable(subtotal: number): boolean;
  getIcon(): string;
}

// Estrategias concretas
export class StandardShippingStrategy implements ShippingStrategy {
  name = 'Envío Estándar';
  
  calculateCost(subtotal: number, weight = 1, distance = 10): number {
    const baseCost = 15000;
    // Envío gratis si subtotal > 150,000 COP
    if (subtotal >= 150000) return 0;
    return baseCost + (weight * 2000) + (distance * 500);
  }
}

export class ExpressShippingStrategy implements ShippingStrategy {
  name = 'Envío Express';
  
  calculateCost(subtotal: number, weight = 1, distance = 10): number {
    const baseCost = 25000;
    // Lógica diferente para express
    return baseCost + (weight * 3000) + (distance * 800);
  }
}

// Contexto
export class ShippingCalculator {
  private strategy: ShippingStrategy;

  setStrategy(strategy: ShippingStrategy): void {
    this.strategy = strategy;
  }

  calculateShipping(subtotal: number, weight?: number, distance?: number): number {
    return this.strategy.calculateCost(subtotal, weight, distance);
  }
}

// Factory para estrategias
export class ShippingStrategyFactory {
  static createStrategy(type: string): ShippingStrategy {
    // Crea la estrategia apropiada
  }

  static getAvailableStrategies(subtotal: number): ShippingStrategy[] {
    // Retorna solo estrategias disponibles para el subtotal
  }
}
```

### **Características:**
- **Intercambiable**: Puede cambiar algoritmo en tiempo de ejecución
- **Extensible**: Fácil agregar nuevas estrategias de envío
- **Condicional**: Cada estrategia tiene sus propias reglas de disponibilidad
- **Configurable**: Diferentes cálculos según peso, distancia, subtotal
- **Factory integrado**: Creación centralizada de estrategias

### **Uso en la aplicación:**
```typescript
// Crear calculadora con estrategia
const calculator = new ShippingCalculator(new StandardShippingStrategy());
let cost = calculator.calculateShipping(100000, 2, 15);

// Cambiar estrategia dinámicamente
calculator.setStrategy(new ExpressShippingStrategy());
cost = calculator.calculateShipping(100000, 2, 15);

// Usar servicio de alto nivel
const shippingService = new ShippingService();
const options = shippingService.getShippingOptions(120000, 1.5, 10);
const recommended = shippingService.getRecommendedShipping(120000);
```

---

## 🔗 **INTEGRACIÓN CON LA APLICACIÓN EXISTENTE**

### **En CheckoutService** (`/src/services/checkout.service.ts`):
```typescript
// Usando Factory Method para pagos
const paymentMethod = PaymentMethodFactory.createPaymentMethod(checkoutData.paymentType);
const result = await paymentMethod.processPayment(total, orderId);

// Usando Repository para órdenes
const orderRepo = RepositoryFactory.getOrderRepository();
const order = await orderRepo.create(orderData);

// Usando Strategy para envío
const shippingService = new ShippingService();
const shippingOptions = shippingService.getShippingOptions(subtotal);
```

### **En Checkout Page** (`/src/app/checkout/page.tsx`):
```typescript
// Logger singleton para tracking
logger.info('Iniciando proceso de checkout', { userId, total });

// Obtener opciones de envío usando Strategy
const shippingStrategies = ShippingStrategyFactory.getAvailableStrategies(subtotal);
```

---

## 📊 **BENEFICIOS DE LA IMPLEMENTACIÓN**

### **1. Mantenibilidad**
- Código más organizado y fácil de mantener
- Separación clara de responsabilidades
- Fácil testing unitario de cada patrón

### **2. Extensibilidad**
- Agregar nuevos métodos de pago sin modificar código existente
- Nuevas estrategias de envío fáciles de implementar
- Nuevas entidades usando Repository pattern base

### **3. Reutilización**
- Patrones reutilizables en diferentes partes de la aplicación
- Código DRY (Don't Repeat Yourself)
- Interfaces consistentes

### **4. Escalabilidad**
- Sistema preparado para crecer
- Fácil agregar nuevas funcionalidades
- Performance optimizada con Singletons donde corresponde

---

## 🧪 **TESTING DE LOS PATRONES**

### **Ejemplos de uso rápido para verificar:**

```typescript
// 1. Singleton Logger
import { logger } from '@/patterns/singleton/Logger';
logger.info('Test singleton funcionando');

// 2. Factory Method
import { PaymentProcessor } from '@/patterns/factory/PaymentMethodFactory';
await PaymentProcessor.processPayment('stripe', 100000, 'test-order');

// 3. Repository
import { RepositoryFactory } from '@/patterns/repository/BaseRepository';
const products = await RepositoryFactory.getProductRepository().findAll();

// 4. Strategy
import { ShippingService } from '@/patterns/strategy/ShippingStrategy';
const service = new ShippingService();
const options = service.getShippingOptions(150000);
```

---

## ✅ **CONCLUSIÓN**

Los 4 patrones de diseño han sido **completamente implementados** y están listos para uso en la aplicación:

1. **✅ Singleton Pattern**: Logger centralizado y thread-safe
2. **✅ Factory Method Pattern**: Sistema de métodos de pago extensible  
3. **✅ Repository Pattern**: Acceso a datos desacoplado y reutilizable
4. **✅ Strategy Pattern**: Algoritmos de envío intercambiables

Cada patrón está documentado, tiene manejo de errores, logging apropiado y está diseñado para escalar con la aplicación.
