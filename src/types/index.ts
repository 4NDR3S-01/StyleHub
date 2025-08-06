// Product (match con tabla 'products')
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  images?: string[];
  category_id: string;
  brand?: string;
  gender?: 'masculino' | 'femenino' | 'unisex';
  material?: string;
  season?: 'primavera' | 'verano' | 'otoño' | 'invierno' | 'todo_año';
  tags?: string[];
  featured?: boolean;          // deprecated, usar is_featured
  sale?: boolean;
  active?: boolean;
  is_active?: boolean;         // preferible usar este
  is_featured?: boolean;
  sku?: string;
  weight?: number;
  dimensions?: any;            // mejor si tienes una interfaz Dimensions
  stock_alert_threshold?: number;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;

  // Relación
  product_variants?: ProductVariant[];
}

// ProductVariant (match tabla 'product_variants')
export interface ProductVariant {
  id: string;
  product_id: string;
  color: string;
  size: string;
  stock: number;
  price_adjustment?: number;
  image?: string;
  sku?: string;
  weight_adjustment?: number;
  created_at?: string;
  updated_at?: string;
}

// CartItem
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
