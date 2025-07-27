export interface productos {
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
}

export interface CartItem {
  producto: productos;
  quantity: number;
  size: string;
  color: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  lastname: string;
  avatar?: string;
  role: string;
}

export interface categorias {
  id: string;
  name: string;
  image: string;
  slug: string;
}