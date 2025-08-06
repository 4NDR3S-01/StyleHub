// Alias para creación de producto y variante sin los campos generados automáticamente
export type CreateProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type CreateProductVariantInput = Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>;
// Tipos para género y temporada
export type Gender = 'masculino' | 'femenino' | 'unisex';
export type Season = 'primavera' | 'verano' | 'otoño' | 'invierno' | 'todo_año';
/**
 * Opciones de ordenamiento para productos
 */
export interface ProductSort {
  field: ProductSortField;
  direction: SortDirection;
}
import supabase from '@/lib/supabaseClient';
// Alias para uniones repetidas (S4323 SonarQube)
export type ProductSortField = 'created_at' | 'name' | 'price';
export type SortDirection = 'asc' | 'desc';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  images: string[];
  category_id: string;
  brand?: string;
  gender?: Gender;
  material?: string;
  season?: Season;
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

/**
 * Filtros para búsqueda de productos
 */
export interface ProductFilters {
  category?: string;
  brand?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  season?: string;
  featured?: boolean;
  sale?: boolean;
  search?: string;
  tags?: string[];
}

/**
 * Opciones de paginación
 */
export type PaginationSortField = 'name' | 'price' | 'created_at' | 'popularity';
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: PaginationSortField;
  sortOrder?: SortDirection;
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

/**
 * Interfaz del repositorio de productos
 * Define todas las operaciones de acceso a datos para productos
 */
export interface IProductRepository {
  // Operaciones básicas CRUD
  findById(id: string): Promise<Product | null>;
  findAll(filters?: ProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  create(product: CreateProductInput): Promise<Product>;
  update(id: string, updates: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  
  // Operaciones específicas de búsqueda
  findByCategory(categoryId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  findFeatured(limit?: number): Promise<Product[]>;
  findOnSale(pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  search(query: string, filters?: ProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  
  // Operaciones de variantes
  findVariants(productId: string): Promise<ProductVariant[]>;
  createVariant(variant: CreateProductVariantInput): Promise<ProductVariant>;
  updateVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant | null>;
  deleteVariant(id: string): Promise<boolean>;
}

// ============================================================================
// REPOSITORY IMPLEMENTATION
// ============================================================================

/**
 * Implementación del repositorio de productos usando Supabase
 */
class ProductRepository implements IProductRepository {
  
  async findById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug),
          product_variants(*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching product by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Repository error in findById:', error);
      return null;
    }
  }

  async findAll(filters?: ProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug),
          product_variants(*)
        `, { count: 'exact' })
        .eq('is_active', true);

      query = this.applyProductFilters(query, filters);
      query = this.applyPaginationAndSorting(query, pagination);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      const totalPages = pagination ? Math.ceil((count || 0) / pagination.limit) : 1;

      return {
        data: data || [],
        total: count || 0,
        page: pagination?.page || 1,
        limit: pagination?.limit || data?.length || 0,
        totalPages
      };
    } catch (error) {
      console.error('Repository error in findAll:', error);
      throw error;
    }
  }

  private applyProductFilters(query: any, filters?: ProductFilters) {
    if (!filters) return query;
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters.brand) {
      query = query.eq('brand', filters.brand);
    }
    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }
    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters.featured !== undefined) {
      query = query.eq('is_featured', filters.featured);
    }
    if (filters.sale !== undefined) {
      query = query.eq('sale', filters.sale);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%, description.ilike.%${filters.search}%`);
    }
    return query;
  }

  private applyPaginationAndSorting(query: any, pagination?: PaginationOptions) {
    if (!pagination) return query;
    const { page, limit, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;
    return query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);
  }

  async create(product: CreateProductInput): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Repository error in create:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Repository error in update:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Repository error in delete:', error);
      return false;
    }
  }

  async findByCategory(categoryId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ category: categoryId }, pagination);
  }

  async findFeatured(limit: number = 10): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug),
          product_variants(*)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching featured products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Repository error in findFeatured:', error);
      return [];
    }
  }

  async findOnSale(pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ sale: true }, pagination);
  }

  async search(query: string, filters?: ProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ ...filters, search: query }, pagination);
  }

  async findVariants(productId: string): Promise<ProductVariant[]> {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('color')
        .order('size');

      if (error) {
        console.error('Error fetching product variants:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Repository error in findVariants:', error);
      return [];
    }
  }

  async createVariant(variant: CreateProductVariantInput): Promise<ProductVariant> {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert(variant)
        .select()
        .single();

      if (error) {
        console.error('Error creating product variant:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Repository error in createVariant:', error);
      throw error;
    }
  }

  async updateVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant | null> {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product variant:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Repository error in updateVariant:', error);
      return null;
    }
  }

  async deleteVariant(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product variant:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Repository error in deleteVariant:', error);
      return false;
    }
  }
}

// ============================================================================
// REPOSITORY SINGLETON INSTANCE
// ============================================================================

/**
 * Instancia única del repositorio de productos
 */
const productRepository = new ProductRepository();

// ============================================================================
// SERVICE LAYER (USANDO REPOSITORY PATTERN)
// ============================================================================

/**
 * Servicio de productos que utiliza el Repository Pattern
 * Esta clase orquesta las operaciones de negocio usando el repositorio
 */
export class ProductService {
  private readonly repository: IProductRepository;

  constructor(repository?: IProductRepository) {
    this.repository = repository || productRepository;
  }

  /**
   * Obtener producto por ID con validaciones de negocio
   */
  async getProductById(id: string): Promise<Product | null> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID de producto inválido');
    }

    try {
      const product = await this.repository.findById(id);
      
      // Lógica de negocio: verificar disponibilidad
      if (product && !product.is_active) {
        return null; // Producto inactivo no se devuelve
      }

      return product;
    } catch (error) {
      console.error('Error in ProductService.getProductById:', error);
      throw new Error('No se pudo obtener el producto');
    }
  }

  /**
   * Obtener productos con filtros y paginación
   */
  async getProducts(
    filters?: ProductFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>> {
    try {
      return await this.repository.findAll(filters, pagination);
    } catch (error) {
      console.error('Error in ProductService.getProducts:', error);
      throw new Error('No se pudieron obtener los productos');
    }
  }

  /**
   * Obtener productos destacados
   */
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    try {
      return await this.repository.findFeatured(limit);
    } catch (error) {
      console.error('Error in ProductService.getFeaturedProducts:', error);
      return [];
    }
  }

  /**
   * Obtener productos en oferta
   */
  async getSaleProducts(pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    try {
      return await this.repository.findOnSale(pagination);
    } catch (error) {
      console.error('Error in ProductService.getSaleProducts:', error);
      throw new Error('No se pudieron obtener los productos en oferta');
    }
  }

  /**
   * Buscar productos
   */
  async searchProducts(
    query: string, 
    filters?: ProductFilters, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>> {
    if (!query || query.trim().length < 2) {
      throw new Error('La búsqueda debe tener al menos 2 caracteres');
    }

    try {
      return await this.repository.search(query.trim(), filters, pagination);
    } catch (error) {
      console.error('Error in ProductService.searchProducts:', error);
      throw new Error('Error en la búsqueda de productos');
    }
  }

  /**
   * Crear nuevo producto
   */
  async createProduct(productData: CreateProductInput): Promise<Product> {
    // Validaciones de negocio
    if (!productData.name || productData.name.trim().length === 0) {
      throw new Error('El nombre del producto es obligatorio');
    }

    if (!productData.price || productData.price <= 0) {
      throw new Error('El precio debe ser mayor a 0');
    }

    if (!productData.category_id) {
      throw new Error('La categoría es obligatoria');
    }

    try {
      // Establecer valores por defecto
      const product = {
        ...productData,
        is_active: productData.is_active ?? true,
        is_featured: productData.is_featured ?? false,
        sale: productData.sale ?? false,
      };

      return await this.repository.create(product);
    } catch (error) {
      console.error('Error in ProductService.createProduct:', error);
      throw new Error('No se pudo crear el producto');
    }
  }

  /**
   * Actualizar producto
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (!id) {
      throw new Error('ID de producto requerido');
    }

    // Validaciones de negocio
    if (updates.price !== undefined && updates.price <= 0) {
      throw new Error('El precio debe ser mayor a 0');
    }

    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error('El nombre del producto no puede estar vacío');
    }

    try {
      return await this.repository.update(id, updates);
    } catch (error) {
      console.error('Error in ProductService.updateProduct:', error);
      throw new Error('No se pudo actualizar el producto');
    }
  }

  /**
   * Eliminar producto (soft delete)
   */
  async deleteProduct(id: string): Promise<boolean> {
    if (!id) {
      throw new Error('ID de producto requerido');
    }

    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error('Error in ProductService.deleteProduct:', error);
      throw new Error('No se pudo eliminar el producto');
    }
  }
}

// ============================================================================
// SINGLETON SERVICE INSTANCE
// ============================================================================

/**
 * Instancia única del servicio de productos
 */
export const productService = new ProductService();

// ============================================================================
// COMPATIBILITY LAYER (MANTENER FUNCIONES EXISTENTES)
// ============================================================================

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

export interface ServiceProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  colors?: string[];
  sizes?: string[];
  seasons?: string[];
  featured?: boolean;
  sale?: boolean;
  active?: boolean;
  tags?: string[];
  search?: string;
}


/**
 * Obtiene productos con filtros
 */
export async function getProducts(
  filters: ServiceProductFilters = {},
  sort?: ProductSort,
  limit?: number
): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        product_variants:product_variants(*)
      `);

// Filtro para la capa de compatibilidad (ServiceProductFilters)
const applyProductFiltersService = (query: any, filters: ServiceProductFilters) => {
  if (filters.category) query = query.eq('category_id', filters.category);
  if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);
  if (filters.brands && filters.brands.length > 0) query = query.in('brand', filters.brands);
  if (filters.seasons && filters.seasons.length > 0) query = query.in('season', filters.seasons);
  if (filters.featured !== undefined) query = query.eq('featured', filters.featured);
  if (filters.sale !== undefined) query = query.eq('sale', filters.sale);
  if (filters.active !== undefined) {
    query = query.eq('active', filters.active).eq('is_active', filters.active);
  } else {
    query = query.eq('active', true).eq('is_active', true);
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
  }
  return query;
};

    query = applyProductFiltersService(query, filters);

    query = sort
      ? query.order(sort.field, { ascending: sort.direction === 'asc' })
      : query.order('created_at', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

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
    // Primero, obtener la categoría y todas sus subcategorías
    const { data: targetCategory, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (categoryError || !targetCategory) {
      console.error('Category not found:', categorySlug);
      return [];
    }

    // Obtener todas las subcategorías de esta categoría
    const { data: subcategories, error: subcatError } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', targetCategory.id);

    if (subcatError) {
      console.error('Error fetching subcategories:', subcatError);
      // Continuar solo con la categoría principal
    }

    // Crear array de IDs de categorías (principal + subcategorías)
    const categoryIds = [targetCategory.id];
    if (subcategories && subcategories.length > 0) {
      categoryIds.push(...subcategories.map(sub => sub.id));
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name, slug, parent_id),
        product_variants:product_variants(*)
      `)
      .in('category_id', categoryIds)
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

/**
 * Interfaz para filtros de productos avanzados
 */
export interface ProductFiltersAdvanced {
  categories?: string[];
  brands?: string[];
  genders?: string[];
  materials?: string[];
  seasons?: string[];
  priceMin?: number;
  priceMax?: number;
  onSale?: boolean;
  featured?: boolean;
  searchTerm?: string;
}

/**
 * Obtiene productos con filtros avanzados
 */
export async function getProductsWithFilters(
  filters: ServiceProductFilters,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  limit?: number
): Promise<Product[]> {
  try {
    // Si hay un filtro de categoría, expandir para incluir subcategorías
    let expandedCategoryIds: string[] | undefined;
    if (filters.category) {
      const { data: subcategories } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', filters.category);

      expandedCategoryIds = [filters.category];
      if (subcategories && subcategories.length > 0) {
        expandedCategoryIds.push(...subcategories.map(sub => sub.id));
      }
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        product_variants:product_variants(*)
      `)
      .eq('active', true)
      .eq('is_active', true);

    // Aplicar filtros básicos con categorías expandidas
    query = applyBasicFilters(query, filters, expandedCategoryIds);
    
    // Aplicar filtros de precio
    query = applyPriceFilters(query, filters);

    // Aplicar filtros especiales
    query = applySpecialFilters(query, filters);

    // Aplicar búsqueda por texto
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
    }

    // Aplicar ordenamiento
    query = applySorting(query, sortBy, sortOrder);

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching filtered products:', error);
      throw error;
    }

    let products = data || [];

    // Aplicar filtros de variantes (colores y tallas) en el lado del cliente
    if (filters.colors && filters.colors.length > 0) {
      products = products.filter(product => 
        product.product_variants?.some((variant: any) => 
          filters.colors!.includes(variant.color)
        )
      );
    }

    if (filters.sizes && filters.sizes.length > 0) {
      products = products.filter(product => 
        product.product_variants?.some((variant: any) => 
          filters.sizes!.includes(variant.size)
        )
      );
    }

    return products;
  } catch (error) {
    console.error('Error in getProductsWithFilters:', error);
    return [];
  }
}

// Funciones auxiliares para reducir complejidad
function applyBasicFilters(query: any, filters: ServiceProductFilters, categoryIds?: string[]) {
  if (filters.category) {
    if (categoryIds && categoryIds.length > 0) {
      // Usar los IDs de categorías expandidos (incluyendo subcategorías)
      query = query.in('category_id', categoryIds);
    } else {
      // Fallback al comportamiento original
      query = query.eq('category_id', filters.category);
    }
  }

  if (filters.brands && filters.brands.length > 0) {
    query = query.in('brand', filters.brands);
  }

  if (filters.seasons && filters.seasons.length > 0) {
    query = query.in('season', filters.seasons);
  }

  return query;
}

function applyPriceFilters(query: any, filters: ServiceProductFilters) {
  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  return query;
}

function applySpecialFilters(query: any, filters: ServiceProductFilters) {
  if (filters.sale) {
    query = query.eq('sale', true);
  }

  if (filters.featured) {
    query = query.eq('is_featured', true).eq('featured', true);
  }

  return query;
}

function applySorting(query: any, sortBy: string, sortOrder: 'asc' | 'desc') {
  const sortConfig = getSortConfig(sortBy, sortOrder);
  return query.order(sortConfig.column, { ascending: sortConfig.ascending });
}

function getSortConfig(sortBy: string, sortOrder: 'asc' | 'desc') {
  switch (sortBy) {
    case 'price':
    case 'price-low':
      return { column: 'price', ascending: true };
    case 'price-high':
      return { column: 'price', ascending: false };
    case 'name':
      return { column: 'name', ascending: sortOrder === 'asc' };
    case 'featured':
      return { column: 'is_featured', ascending: false };
    default:
      return { column: 'created_at', ascending: sortOrder === 'asc' };
  }
}

/**
 * Obtiene estadísticas de productos para filtros
 */
export async function getProductFilterStats(): Promise<{
  categories: Array<{ name: string; count: number }>;
  brands: Array<{ name: string; count: number }>;
  genders: Array<{ name: string; count: number }>;
  materials: Array<{ name: string; count: number }>;
  seasons: Array<{ name: string; count: number }>;
  priceRange: { min: number; max: number };
}> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        price,
        brand,
        gender,
        material,
        season,
        category:categories!inner(name)
      `)
      .eq('active', true)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching product stats:', error);
      throw error;
    }

    const products = data || [];
    
    return {
      categories: countItems(products, (p: any) => p.category?.name),
      brands: countItems(products, (p: any) => p.brand),
      genders: countItems(products, (p: any) => p.gender),
      materials: countItems(products, (p: any) => p.material),
      seasons: countItems(products, (p: any) => p.season),
      priceRange: calculatePriceRange(products)
    };
  } catch (error) {
    console.error('Error in getProductFilterStats:', error);
    return {
      categories: [],
      brands: [],
      genders: [],
      materials: [],
      seasons: [],
      priceRange: { min: 0, max: 1000000 }
    };
  }
}

function countItems(products: any[], accessor: (item: any) => string | undefined): Array<{ name: string; count: number }> {
  const counts: Record<string, number> = {};
  
  products.forEach(product => {
    const value = accessor(product);
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function calculatePriceRange(products: any[]): { min: number; max: number } {
  if (products.length === 0) {
    return { min: 0, max: 1000000 };
  }

  const prices = products.map(p => p.price).filter(price => typeof price === 'number');
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}
