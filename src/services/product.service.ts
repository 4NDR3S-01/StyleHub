import supabase from '@/lib/supabaseClient';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number; // ✅ Match con DB
  images: string[];
  category_id: string;
  brand?: string;
  gender?: 'masculino' | 'femenino' | 'unisex'; // ✅ Match con DB
  material?: string;
  season?: 'primavera' | 'verano' | 'otoño' | 'invierno' | 'todo_año'; // ✅ Match con DB
  tags?: string[];
  featured?: boolean;
  sale?: boolean;
  active?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  sku?: string;
  weight?: number;
  dimensions?: any;
  stock_alert_threshold?: number;
  meta_title?: string;
  meta_description?: string;
  product_variants?: ProductVariant[]; // ✅ Consistente con DB
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ProductVariant {
  id: string;
  product_id?: string;
  color: string;
  size: string;
  stock: number;
  image?: string;
  price_adjustment?: number;
  sku?: string;
  weight_adjustment?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sale?: boolean;
  gender?: 'masculino' | 'femenino' | 'unisex'; // ✅ Match con DB
  material?: string;
  season?: 'primavera' | 'verano' | 'otoño' | 'invierno' | 'todo_año'; // ✅ Match con DB
  brand?: string;
  active?: boolean;
  search?: string;
}

export interface ProductSort {
  field: 'created_at' | 'name' | 'price';
  direction: 'asc' | 'desc';
}

/**
 * Obtiene todos los productos con filtros opcionales
 */
export async function getProducts(
  filters: ProductFilters = {}, 
  sort?: ProductSort, 
  limit?: number
) {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        subcategory:subcategories(id, name, slug)
      `);

    // Aplicar filtros
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters.featured !== undefined) {
      query = query.eq('is_featured', filters.featured);
    }

    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }

    if (filters.active !== undefined) {
      query = query.eq('is_active', filters.active);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Aplicar ordenamiento
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Aplicar límite
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProducts:', error);
    throw error;
  }
}

/**
 * Obtiene un producto por ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        subcategory:subcategories(id, name, slug)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getProductById:', error);
    return null;
  }
}

/**
 * Obtiene productos destacados
 */
export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        subcategory:subcategories(id, name, slug)
      `)
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getFeaturedProducts:', error);
    return [];
  }
}

/**
 * Busca productos por texto
 */
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        subcategory:subcategories(id, name, slug)
      `)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error searching products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchProducts:', error);
    return [];
  }
}

/**
 * Obtiene productos por categoría (slug)
 */
export async function getProductsByCategorySlug(categorySlug: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name, slug),
        subcategory:subcategories(id, name, slug)
      `)
      .eq('category.slug', categorySlug)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products by category slug:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProductsByCategorySlug:', error);
    return [];
  }
}

/**
 * Obtiene una categoría por slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching category by slug:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCategoryBySlug:', error);
    return null;
  }
}

/**
 * Obtiene todas las categorías
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCategories:', error);
    return [];
  }
}

/**
 * Obtiene productos nuevos/recientes
 */
export async function getNewProducts(limit: number = 8): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        subcategory:subcategories(id, name, slug)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching new products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getNewProducts:', error);
    return [];
  }
}

/**
 * Obtiene productos en oferta
 */
export async function getSaleProducts(limit: number = 8): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        subcategory:subcategories(id, name, slug)
      `)
      .eq('is_active', true)
      .lt('price', 50) // Productos con precio menor a 50 como "oferta"
      .order('price', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching sale products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSaleProducts:', error);
    return [];
  }
}

/**
 * Obtiene productos relacionados
 */
export async function getRelatedProducts(productId: string, categoryId: string, limit: number = 4): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        subcategory:subcategories(id, name, slug)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', productId) // Excluir el producto actual
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching related products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRelatedProducts:', error);
    return [];
  }
}
