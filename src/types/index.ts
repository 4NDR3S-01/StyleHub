export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
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
}

export interface ProductVariant {
  id: string;
  color: string;
  size: string;
  stock: number;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
  variantId?: string;
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

export interface Category {
  id: string;
  name: string;
  image: string;
  slug: string;
  description?: string;
  parentId?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  address: Address;
  paymentMethod: 'card' | 'paypal';
  trackingNumber?: string;
}