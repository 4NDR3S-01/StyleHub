import supabase from '@/lib/supabaseClient';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  images: string[];
  category_id: string;
  brand?: string;
  gender?: 'masculino' | 'femenino' | 'unisex';
  material?: string;
  season?: 'primavera' | 'verano' | 'otoño' | 'invierno' | 'todo_año';
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
  product_variants?: ProductVariant[];
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
  active: boolean;
  sort_order?: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  gender?: string;
  season?: string;
  featured?: boolean;
  sale?: boolean;
  active?: boolean;
  tags?: string[];
}

/**
 * Obtiene productos con filtros
 */
export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        product_variants:product_variants(*)
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

    if (filters.brand) {
      query = query.eq('brand', filters.brand);
    }

    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }

    if (filters.season) {
      query = query.eq('season', filters.season);
    }

    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    if (filters.sale !== undefined) {
      query = query.eq('sale', filters.sale);
    }

    if (filters.active !== undefined) {
      query = query.eq('active', filters.active).eq('is_active', filters.active);
    }

    // Siempre filtrar productos activos por defecto si no se especifica
    if (filters.active === undefined) {
      query = query.eq('active', true).eq('is_active', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProducts:', error);
    return [];
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
        product_variants:product_variants(*)
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
        product_variants:product_variants(*)
      `)
      .eq('featured', true)
      .eq('active', true)
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
        product_variants:product_variants(*)
      `)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      .eq('active', true)
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
export async function getProductsByCategory(categorySlug: string, limit?: number): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name, slug),
        product_variants:product_variants(*)
      `)
      .eq('category.slug', categorySlug)
      .eq('active', true)
      .eq('is_active', true);

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProductsByCategory:', error);
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
        product_variants:product_variants(*)
      `)
      .eq('active', true)
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
        product_variants:product_variants(*)
      `)
      .eq('sale', true)
      .eq('active', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
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
 * Obtiene todas las categorías
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error.message || error.details || JSON.stringify(error));
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCategories:', error);
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
      .eq('active', true)
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
 * Obtiene categorías principales (sin parent_id)
 */
export async function getMainCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name');

    if (error) {
      console.error('Error fetching main categories:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMainCategories:', error);
    return [];
  }
}

/**
 * Obtiene variantes de un producto
 */
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('color')
      .order('size');

    if (error) {
      console.error('Error fetching product variants:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProductVariants:', error);
    return [];
  }
}

/**
 * Obtiene productos relacionados (misma categoría)
 */
export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
  try {
    // Primero obtener el producto actual para conocer su categoría
    const { data: currentProduct, error: currentError } = await supabase
      .from('products')
      .select('category_id')
      .eq('id', productId)
      .single();

    if (currentError || !currentProduct) {
      console.error('Error fetching current product:', currentError);
      return [];
    }

    // Obtener productos relacionados
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        product_variants:product_variants(*)
      `)
      .eq('category_id', currentProduct.category_id)
      .neq('id', productId)
      .eq('active', true)
      .eq('is_active', true)
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

/**
 * Obtiene marcas disponibles
 */
export async function getBrands(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .eq('active', true)
      .eq('is_active', true)
      .not('brand', 'is', null);

    if (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }

    // Obtener marcas únicas y ordenarlas
    const brands = Array.from(new Set(data.map(item => item.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    return brands;
  } catch (error) {
    console.error('Error in getBrands:', error);
    return [];
  }
}
