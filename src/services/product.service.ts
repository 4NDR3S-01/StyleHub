import supabase from '@/lib/supabaseClient';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  images: string[];
  category_id: string;
  brand?: string;
  gender?: string;
  material?: string;
  season?: string;
  tags?: string[];
  featured: boolean;
  sale: boolean;
  active: boolean;
  created_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  product_variants?: Array<{
    id: string;
    color: string;
    size: string;
    stock: number;
    image?: string;
  }>;
}

export interface ProductFilters {
  category?: string;
  gender?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sale?: boolean;
  search?: string;
  tags?: string[];
}

export interface ProductSort {
  field: 'name' | 'price' | 'created_at';
  direction: 'asc' | 'desc';
}

/**
 * Obtiene todos los productos con filtros y ordenamiento
 */
export async function getProducts(
  filters: ProductFilters = {},
  sort: ProductSort = { field: 'created_at', direction: 'desc' },
  page: number = 1,
  limit: number = 12
): Promise<{ products: Product[]; total: number }> {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      product_variants(*)
    `)
    .eq('active', true);

  // Aplicar filtros
  if (filters.category) {
    query = query.eq('category_id', filters.category);
  }

  if (filters.gender) {
    query = query.eq('gender', filters.gender);
  }

  if (filters.brand) {
    query = query.eq('brand', filters.brand);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.featured !== undefined) {
    query = query.eq('featured', filters.featured);
  }

  if (filters.sale !== undefined) {
    query = query.eq('sale', filters.sale);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  // Contar total antes de aplicar paginación
  const { count } = await query.count();

  // Aplicar ordenamiento y paginación
  query = query
    .order(sort.field, { ascending: sort.direction === 'asc' })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('Error al cargar productos');
  }

  return {
    products: data || [],
    total: count || 0,
  };
}

/**
 * Obtiene un producto por ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      product_variants(*)
    `)
    .eq('id', id)
    .eq('active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Producto no encontrado
    }
    console.error('Error fetching product:', error);
    throw new Error('Error al cargar producto');
  }

  return data;
}

/**
 * Obtiene productos por slug de categoría
 */
export async function getProductsByCategorySlug(
  slug: string,
  filters: ProductFilters = {},
  sort: ProductSort = { field: 'created_at', direction: 'desc' },
  page: number = 1,
  limit: number = 12
): Promise<{ products: Product[]; total: number; category: any }> {
  // Primero obtener la categoría
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (categoryError) {
    console.error('Error fetching category:', categoryError);
    throw new Error('Categoría no encontrada');
  }

  // Obtener productos de la categoría y subcategorías
  const { data: subcategories } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', category.id);

  const categoryIds = [category.id, ...(subcategories?.map(c => c.id) || [])];

  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      product_variants(*)
    `)
    .in('category_id', categoryIds)
    .eq('active', true);

  // Aplicar filtros adicionales
  if (filters.gender) {
    query = query.eq('gender', filters.gender);
  }

  if (filters.brand) {
    query = query.eq('brand', filters.brand);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Contar total
  const { count } = await query.count();

  // Aplicar ordenamiento y paginación
  query = query
    .order(sort.field, { ascending: sort.direction === 'asc' })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching products by category:', error);
    throw new Error('Error al cargar productos de la categoría');
  }

  return {
    products: data || [],
    total: count || 0,
    category,
  };
}

/**
 * Busca productos
 */
export async function searchProducts(query: string, limit: number = 10): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
    .eq('active', true)
    .limit(limit);

  if (error) {
    console.error('Error searching products:', error);
    throw new Error('Error al buscar productos');
  }

  return data || [];
}

/**
 * Obtiene todas las categorías principales
 */
export async function getAllCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('name');
  
  if (error) throw error;
  return data || [];
}

/**
 * Obtiene subcategorías de una categoría
 */
export async function getSubcategories(parentId: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', parentId)
    .order('name');
  
  if (error) throw error;
  return data || [];
}

/**
 * Obtiene productos destacados
 */
export async function getFeaturedProducts(limit: number = 6): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      product_variants(*)
    `)
    .eq('featured', true)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured products:', error);
    throw new Error('Error al cargar productos destacados');
  }

  return data || [];
}

/**
 * Obtiene productos en oferta
 */
export async function getSaleProducts(limit: number = 8): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      product_variants(*)
    `)
    .eq('sale', true)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching sale products:', error);
    throw new Error('Error al cargar productos en oferta');
  }

  return data || [];
}

/**
 * Obtiene marcas únicas
 */
export async function getBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .eq('active', true)
    .not('brand', 'is', null);

  if (error) {
    console.error('Error fetching brands:', error);
    throw new Error('Error al cargar marcas');
  }

  const brands = [...new Set(data?.map(p => p.brand).filter(Boolean))];
  return brands.sort();
}

/**
 * Obtiene productos relacionados
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit: number = 4
): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      product_variants(*)
    `)
    .eq('category_id', categoryId)
    .eq('active', true)
    .neq('id', productId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching related products:', error);
    throw new Error('Error al cargar productos relacionados');
  }

  return data || [];
}

/**
 * Actualiza stock de variantes
 */
export async function updateProductStock(variantId: string, quantity: number): Promise<void> {
  const { error } = await supabase
    .from('product_variants')
    .update({ stock: quantity })
    .eq('id', variantId);

  if (error) {
    console.error('Error updating product stock:', error);
    throw new Error('Error al actualizar stock');
  }
}

/**
 * Obtiene estadísticas de productos (solo para admin)
 */
export async function getProductStats() {
  const { data: total, error: totalError } = await supabase
    .from('products')
    .select('id', { count: 'exact' });

  const { data: active, error: activeError } = await supabase
    .from('products')
    .select('id', { count: 'exact' })
    .eq('active', true);

  const { data: featured, error: featuredError } = await supabase
    .from('products')
    .select('id', { count: 'exact' })
    .eq('featured', true);

  const { data: sale, error: saleError } = await supabase
    .from('products')
    .select('id', { count: 'exact' })
    .eq('sale', true);

  if (totalError || activeError || featuredError || saleError) {
    console.error('Error fetching product stats:', { totalError, activeError, featuredError, saleError });
    throw new Error('Error al cargar estadísticas de productos');
  }

  return {
    total: total?.length || 0,
    active: active?.length || 0,
    featured: featured?.length || 0,
    sale: sale?.length || 0,
  };
}