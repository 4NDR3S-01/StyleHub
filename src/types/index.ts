/**
 * DEFINICIONES DE TIPOS GLOBALES PARA STYLEHUB
 * 
 * Este archivo centraliza todas las interfaces TypeScript utilizadas
 * en la aplicación para mantener consistencia y facilitar el mantenimiento.
 * Las interfaces están organizadas por dominio funcional.
 */

// ============================================================================
// TIPOS DE PRODUCTOS Y CATÁLOGO
// ============================================================================

/**
 * Producto principal del catálogo
 * Corresponde con la tabla 'products' en la base de datos
 */
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;                          // Precio actual
  original_price?: number;                // Precio original (para calcular descuentos)
  images?: string[];                      // Array de URLs de imágenes
  category_id: string;                    // ID de la categoría padre
  brand?: string;                         // Marca del producto
  gender?: 'masculino' | 'femenino' | 'unisex';  // Género objetivo
  material?: string;                      // Material principal
  season?: 'primavera' | 'verano' | 'otoño' | 'invierno' | 'todo_año';
  tags?: string[];                        // Etiquetas para búsqueda
  featured?: boolean;                     // DEPRECATED: usar is_featured
  sale?: boolean;                         // Producto en oferta
  active?: boolean;                       // DEPRECATED: usar is_active
  is_active?: boolean;                    // Estado activo del producto
  is_featured?: boolean;                  // Producto destacado
  sku?: string;                          // Código de producto único
  weight?: number;                       // Peso en gramos
  dimensions?: any;                      // Crear interface Dimensions
  stock_alert_threshold?: number;         // Umbral de alerta de stock bajo
  meta_title?: string;                   // SEO: Título meta
  meta_description?: string;             // SEO: Descripción meta
  created_at?: string;
  updated_at?: string;

  // Relaciones con otras tablas
  product_variants?: ProductVariant[];    // Variantes del producto
}

/**
 * Variantes de producto (tallas, colores, etc.)
 * Corresponde con la tabla 'product_variants'
 */
export interface ProductVariant {
  id: string;
  product_id: string;                     // Referencia al producto padre
  color: string;                          // Color de la variante
  size: string;                           // Talla de la variante
  stock: number;                          // Cantidad disponible
  price_adjustment?: number;              // Ajuste de precio (+/-)
  image?: string;                         // Imagen específica de la variante
  sku?: string;                          // SKU específico de la variante
  weight_adjustment?: number;             // Ajuste de peso (+/-)
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// TIPOS DE CARRITO DE COMPRAS
// ============================================================================

/**
 * Item del carrito de compras
 * Representa un producto específico en el carrito con su variante
 */
export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  color?: string;
  size?: string;
  created_at?: string;
  updated_at?: string;

  // Relación para mostrar detalles (opcional en frontend)
  product?: Product;
  variant?: ProductVariant;
}

// User (match tabla 'users')
export interface User {
  id: string;
  email: string;
  name: string;
  lastname: string;
  avatar?: string;
  role: 'admin' | 'cliente';
  phone?: string;
  email_verified?: boolean;
  last_login?: string;
  login_count?: number;
  account_status?: 'active' | 'suspended' | 'deactivated';
  preferences?: Record<string, any>;
  created_at?: string;
  updated_at?: string;

  // Para compatibilidad con Auth
  user_metadata?: {
    name?: string;
    lastname?: string;
    avatar_url?: string;
    role?: string;
  };
}

// Address (match tabla 'addresses' y uso en orders)
export interface Address {
  id?: string;
  user_id?: string;
  name?: string; // Nombre de la dirección (en la tabla addresses existe)
  phone?: string;
  address: string; // Campo "address" en la tabla
  city: string;
  state?: string;
  zip_code?: string;
  country: string;
  is_default?: boolean;
  address_type?: 'shipping' | 'billing' | 'both';
  created_at?: string;
  updated_at?: string;
}

// Category (match tabla 'categories')
export interface Category {
  id: string;
  name: string;
  image?: string;
  slug: string;
  description?: string;
  parent_id?: string;
  active?: boolean;
  sort_order?: number;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}

// Order (match tabla 'orders')
export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  total: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  payment_method: 'stripe' | 'paypal';
  address: any;           // JSONB, puede ser Address o un objeto plano
  shipping_address?: any; // JSONB, igual que address
  billing_address?: any;
  tracking_number?: string;
  tracking_url?: string;
  payment_intent_id?: string;
  stripe_session_id?: string;
  paypal_order_id?: string;
  notes?: string;
  estimated_delivery_date?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at?: string;
  updated_at?: string;

  // Relación
  order_items?: OrderItem[];
}

// OrderItem (match tabla 'order_items')
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
  total: number;
  created_at?: string;

  // Relación (opcional, para consulta JOIN)
  product?: Product;
  variant?: ProductVariant;
}

// ShippingMethod (match tabla 'shipping_methods')
export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  cost: number; // Alias para price
  price: number;
  free_shipping_threshold?: number; // Alias para free_over_amount
  free_over_amount?: number;
  delivery_time?: string; // Alias para estimated_days
  estimated_days?: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
