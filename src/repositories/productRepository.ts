/**
 * REPOSITORY PATTERN - PRODUCT REPOSITORY
 * 
 * Este patrón encapsula la lógica de acceso a datos y proporciona una interfaz
 * consistente para las operaciones CRUD. Desacopla la lógica de negocio
 * de la implementación específica de la base de datos.
 */

import supabase from '@/lib/supabaseClient';
import { Product, ProductVariant } from '@/types';

// ============================================================================
// INTERFACES DEL REPOSITORY
// ============================================================================

/**
 * Filtros para búsqueda de productos
 */
export interface ProductFilters {
  category_id?: string;
  brand?: string;
  gender?: 'masculino' | 'femenino' | 'unisex';
  season?: string;
  is_active?: boolean;
  is_featured?: boolean;
  sale?: boolean;
  price_min?: number;
  price_max?: number;
  search?: string;
  tags?: string[];
}

/**
 * Opciones de ordenamiento
 */
export interface ProductSortOptions {
  field: 'name' | 'price' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page: number;
  limit: number;
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
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Interfaz base del repository
 */
export interface IProductRepository {
  // Operaciones básicas CRUD
  findById(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  findAll(filters?: ProductFilters, sort?: ProductSortOptions, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
  create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  
  // Operaciones específicas del dominio
  findFeatured(limit?: number): Promise<Product[]>;
  findOnSale(limit?: number): Promise<Product[]>;
  findByCategory(categoryId: string, limit?: number): Promise<Product[]>;
  search(query: string, filters?: ProductFilters): Promise<Product[]>;
  findRelated(productId: string, limit?: number): Promise<Product[]>;
  
  // Operaciones de stock
  updateStock(variantId: string, quantity: number): Promise<boolean>;
  getStockLevel(variantId: string): Promise<number>;
  findLowStock(threshold?: number): Promise<ProductVariant[]>;
  
  // Operaciones de análisis
  getMostViewed(limit?: number): Promise<Product[]>;
  getBestSellers(limit?: number): Promise<Product[]>;
  getRecentlyAdded(limit?: number): Promise<Product[]>;
}

// ============================================================================
// IMPLEMENTACIÓN DEL REPOSITORY
// ============================================================================

/**
 * Implementación del Repository para productos usando Supabase
 * 
 * BENEFICIOS:
 * - Abstrae la complejidad de las consultas SQL
 * - Proporciona una API consistente para operaciones de datos
 * - Facilita el testing con mocks
 * - Centraliza la lógica de acceso a datos
 * - Permite cambiar la implementación de BD sin afectar la lógica de negocio
 */
export class ProductRepository implements IProductRepository {
  private readonly tableName = 'products';
  private readonly variantsTableName = 'product_variants';

  // ============================================================================
  // OPERACIONES BÁSICAS CRUD
  // ============================================================================

  /**
   * Busca un producto por ID con sus variantes
   */
  async findById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          product_variants (*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error finding product by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in findById:', error);
      return null;
    }
  }

  /**
   * Busca múltiples productos por sus IDs
   */
  async findByIds(ids: string[]): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          product_variants (*)
        `)
        .in('id', ids)
        .eq('is_active', true);

      if (error) {
        console.error('Error finding products by IDs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in findByIds:', error);
      return [];
    }
  }

  /**
   * Busca productos con filtros, ordenamiento y paginación
   */
  async findAll(
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          product_variants (*)
        `, { count: 'exact' });

      // Aplicar filtros
      if (filters) {
        query = this.applyFilters(query, filters);
      }

      // Aplicar ordenamiento
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Aplicar paginación
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.range(offset, offset + pagination.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error in findAll:', error);
        return this.createEmptyPaginatedResult(pagination);
      }

      return this.createPaginatedResult(data || [], count || 0, pagination);
    } catch (error) {
      console.error('Unexpected error in findAll:', error);
      return this.createEmptyPaginatedResult(pagination);
    }
  }

  /**
   * Crea un nuevo producto
   */
  async create(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([{
          ...productData,
          is_active: productData.is_active ?? true,
          is_featured: productData.is_featured ?? false,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        throw new Error(`Failed to create product: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in create:', error);
      throw error;
    }
  }

  /**
   * Actualiza un producto existente
   */
  async update(id: string, productData: Partial<Product>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...productData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in update:', error);
      return null;
    }
  }

  /**
   * Elimina un producto (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in delete:', error);
      return false;
    }
  }

  // ============================================================================
  // OPERACIONES ESPECÍFICAS DEL DOMINIO
  // ============================================================================

  /**
   * Busca productos destacados
   */
  async findFeatured(limit: number = 10): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          product_variants (*)
        `)
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error finding featured products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in findFeatured:', error);
      return [];
    }
  }

  /**
   * Busca productos en oferta
   */
  async findOnSale(limit: number = 10): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          product_variants (*)
        `)
        .eq('sale', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error finding sale products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in findOnSale:', error);
      return [];
    }
  }

  /**
   * Busca productos por categoría
   */
  async findByCategory(categoryId: string, limit: number = 20): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          product_variants (*)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error finding products by category:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in findByCategory:', error);
      return [];
    }
  }

  /**
   * Busca productos por texto
   */
  async search(query: string, filters?: ProductFilters): Promise<Product[]> {
    try {
      let supabaseQuery = supabase
        .from(this.tableName)
        .select(`
          *,
          product_variants (*)
        `)
        .eq('is_active', true);

      // Búsqueda por texto en nombre y descripción
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);

      // Aplicar filtros adicionales
      if (filters) {
        supabaseQuery = this.applyFilters(supabaseQuery, filters);
      }

      const { data, error } = await supabaseQuery
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error searching products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in search:', error);
      return [];
    }
  }

  /**
   * Busca productos relacionados (misma categoría, excluyendo el actual)
   */
  async findRelated(productId: string, limit: number = 6): Promise<Product[]> {
    try {
      // Primero obtenemos la categoría del producto actual
      const currentProduct = await this.findById(productId);
      if (!currentProduct) return [];

      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          product_variants (*)
        `)
        .eq('category_id', currentProduct.category_id)
        .eq('is_active', true)
        .neq('id', productId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error finding related products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in findRelated:', error);
      return [];
    }
  }

  // ============================================================================
  // OPERACIONES DE STOCK
  // ============================================================================

  /**
   * Actualiza el stock de una variante
   */
  async updateStock(variantId: string, quantity: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.variantsTableName)
        .update({ stock: quantity })
        .eq('id', variantId);

      if (error) {
        console.error('Error updating stock:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in updateStock:', error);
      return false;
    }
  }

  /**
   * Obtiene el nivel de stock de una variante
   */
  async getStockLevel(variantId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from(this.variantsTableName)
        .select('stock')
        .eq('id', variantId)
        .single();

      if (error) {
        console.error('Error getting stock level:', error);
        return 0;
      }

      return data?.stock || 0;
    } catch (error) {
      console.error('Unexpected error in getStockLevel:', error);
      return 0;
    }
  }

  /**
   * Busca variantes con stock bajo
   */
  async findLowStock(threshold: number = 5): Promise<ProductVariant[]> {
    try {
      const { data, error } = await supabase
        .from(this.variantsTableName)
        .select('*')
        .lte('stock', threshold)
        .order('stock', { ascending: true });

      if (error) {
        console.error('Error finding low stock products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in findLowStock:', error);
      return [];
    }
  }

  // ============================================================================
  // OPERACIONES DE ANÁLISIS
  // ============================================================================

  /**
   * Obtiene productos más vistos (placeholder - requiere tracking)
   */
  async getMostViewed(limit: number = 10): Promise<Product[]> {
    // Por ahora devolvemos productos destacados como placeholder
    // En el futuro se puede implementar con una tabla de analytics
    return this.findFeatured(limit);
  }

  /**
   * Obtiene productos más vendidos (placeholder - requiere analytics)
   */
  async getBestSellers(limit: number = 10): Promise<Product[]> {
    // Por ahora devolvemos productos en oferta como placeholder
    // En el futuro se puede implementar con análisis de order_items
    return this.findOnSale(limit);
  }

  /**
   * Obtiene productos recién agregados
   */
  async getRecentlyAdded(limit: number = 10): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          product_variants (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error finding recently added products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in getRecentlyAdded:', error);
      return [];
    }
  }

  // ============================================================================
  // MÉTODOS HELPER PRIVADOS
  // ============================================================================

  /**
   * Aplica filtros a una query de Supabase
   */
  private applyFilters(query: any, filters: ProductFilters): any {
    let filteredQuery = query;

    if (filters.category_id) {
      filteredQuery = filteredQuery.eq('category_id', filters.category_id);
    }

    if (filters.brand) {
      filteredQuery = filteredQuery.eq('brand', filters.brand);
    }

    if (filters.gender) {
      filteredQuery = filteredQuery.eq('gender', filters.gender);
    }

    if (filters.season) {
      filteredQuery = filteredQuery.eq('season', filters.season);
    }

    if (filters.is_active !== undefined) {
      filteredQuery = filteredQuery.eq('is_active', filters.is_active);
    }

    if (filters.is_featured !== undefined) {
      filteredQuery = filteredQuery.eq('is_featured', filters.is_featured);
    }

    if (filters.sale !== undefined) {
      filteredQuery = filteredQuery.eq('sale', filters.sale);
    }

    if (filters.price_min !== undefined) {
      filteredQuery = filteredQuery.gte('price', filters.price_min);
    }

    if (filters.price_max !== undefined) {
      filteredQuery = filteredQuery.lte('price', filters.price_max);
    }

    return filteredQuery;
  }

  /**
   * Crea un resultado paginado
   */
  private createPaginatedResult<T>(
    data: T[],
    total: number,
    pagination?: PaginationOptions
  ): PaginatedResult<T> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || data.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Crea un resultado paginado vacío
   */
  private createEmptyPaginatedResult<T>(pagination?: PaginationOptions): PaginatedResult<T> {
    return this.createPaginatedResult<T>([], 0, pagination);
  }
}
