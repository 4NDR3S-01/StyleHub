export interface productos {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  original_price?: number;
  images: string[];
  category: string;
  category_id?: string;
  sizes: string[];
  colors: string[];
  stock: number;
  rating: number;
  reviews: number;
  featured?: boolean;
  sale?: boolean;
  brand?: string;
  gender?: 'hombre' | 'mujer' | 'unisex' | 'niño';
  material?: string;
  season?: 'verano' | 'invierno' | 'otoño' | 'primavera';
  tags?: string[];
  variants?: ProductVariant[];
  product_variants?: ProductVariant[];
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id?: string;
  color: string;
  size: string;
  stock: number;
  image?: string;
}

export interface CartItem {
  id: string;
  producto: {
    id: string;
    name: string;
    price: number;
    original_price?: number;
    images: string[];
    category_id: string;
    brand?: string;
    gender?: string;
  };
  variant?: {
    id: string;
    color: string;
    size: string;
    stock: number;
  };
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  lastname: string;
  avatar?: string;
  role: string;
  address?: Address;
  phone?: string;
  createdAt?: string;
  created_at?: string;
  // Para compatibilidad con AuthModal/AuthContext
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface categorias {
  id: string;
  name: string;
  image: string;
  slug: string;
  description?: string;
  parentId?: string;
  parent_id?: string;
}

export interface Order {
  id: string;
  userId: string;
  user_id?: string;
  items: CartItem[];
  order_items?: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  address: Address | string;
  paymentMethod: 'card' | 'paypal';
  payment_method?: string;
  trackingNumber?: string;
  tracking_number?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  product?: productos;
  variant?: ProductVariant;
}