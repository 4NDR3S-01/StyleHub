/**
 * REPOSITORY PATTERN
 * 
 * El patrón Repository encapsula la lógica de acceso a datos
 * y proporciona una interfaz más orientada a objetos para acceder
 * a los datos, desacoplando la infraestructura o tecnología de acceso
 * a datos de la capa de dominio del modelo.
 */

import supabase from '@/lib/supabaseClient';

// Interfaz base para todos los repositorios
export interface BaseRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
  exists(id: ID): Promise<boolean>;
}

// Interfaz específica para criterios de búsqueda
export interface SearchCriteria {
  filters?: Record<string, any>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  pagination?: { page: number; limit: number };
}

// Resultado paginado genérico
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * REPOSITORIO BASE ABSTRACTO
 * 
 * Implementa funcionalidad común que pueden usar todos los repositorios
 */
export abstract class BaseSupabaseRepository<T, ID = string> implements BaseRepository<T, ID> {
  protected abstract tableName: string;

  async findById(id: ID): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No encontrado
        throw error;
      }

      return this.mapFromDatabase(data);
    } catch (error: any) {
      console.error(`❌ Error en ${this.tableName}.findById:`, error);
      throw new Error(`Error buscando ${this.tableName} por ID: ${error.message}`);
    }
  }

  async findAll(): Promise<T[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => this.mapFromDatabase(item));
    } catch (error: any) {
      console.error(`❌ Error en ${this.tableName}.findAll:`, error);
      throw new Error(`Error obteniendo todos los ${this.tableName}: ${error.message}`);
    }
  }

  async create(entity: Partial<T>): Promise<T> {
    try {
      const dataToInsert = this.mapToDatabase(entity);
      
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([dataToInsert])
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ ${this.tableName} creado exitosamente:`, data.id);
      return this.mapFromDatabase(data);
    } catch (error: any) {
      console.error(`❌ Error en ${this.tableName}.create:`, error);
      throw new Error(`Error creando ${this.tableName}: ${error.message}`);
    }
  }

  async update(id: ID, entity: Partial<T>): Promise<T> {
    try {
      const dataToUpdate = this.mapToDatabase(entity);
      
      const { data, error } = await supabase
        .from(this.tableName)
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ ${this.tableName} actualizado exitosamente:`, id);
      return this.mapFromDatabase(data);
    } catch (error: any) {
      console.error(`❌ Error en ${this.tableName}.update:`, error);
      throw new Error(`Error actualizando ${this.tableName}: ${error.message}`);
    }
  }

  async delete(id: ID): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log(`✅ ${this.tableName} eliminado exitosamente:`, id);
      return true;
    } catch (error: any) {
      console.error(`❌ Error en ${this.tableName}.delete:`, error);
      return false;
    }
  }

  async exists(id: ID): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return !!data;
    } catch (error: any) {
      console.error(`❌ Error en ${this.tableName}.exists:`, error);
      return false;
    }
  }

  // Método para búsqueda con criterios avanzados
  async findByCriteria(criteria: SearchCriteria): Promise<PaginatedResult<T>> {
    try {
      let query = supabase.from(this.tableName).select('*', { count: 'exact' });

      // Aplicar filtros
      if (criteria.filters) {
        Object.entries(criteria.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Aplicar ordenamiento
      if (criteria.sort) {
        query = query.order(criteria.sort.field, { 
          ascending: criteria.sort.direction === 'asc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Aplicar paginación
      let page = 1;
      let limit = 10;
      if (criteria.pagination) {
        page = criteria.pagination.page || 1;
        limit = criteria.pagination.limit || 10;
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const mappedData = (data || []).map(item => this.mapFromDatabase(item));
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: mappedData,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error: any) {
      console.error(`❌ Error en ${this.tableName}.findByCriteria:`, error);
      throw new Error(`Error buscando ${this.tableName} con criterios: ${error.message}`);
    }
  }

  // Métodos abstractos que deben implementar las clases hijas
  protected abstract mapFromDatabase(data: any): T;
  protected abstract mapToDatabase(entity: Partial<T>): any;
}

/**
 * REPOSITORIO ESPECÍFICO PARA PRODUCTOS
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url?: string;
  featured: boolean;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class ProductRepository extends BaseSupabaseRepository<Product> {
  protected tableName = 'products';

  // Métodos específicos para productos
  async findByCategory(categoryId: string): Promise<Product[]> {
    try {
      const result = await this.findByCriteria({
        filters: { category_id: categoryId, active: true }
      });
      return result.data;
    } catch (error: any) {
      console.error('❌ Error buscando productos por categoría:', error);
      throw error;
    }
  }

  async findFeatured(): Promise<Product[]> {
    try {
      const result = await this.findByCriteria({
        filters: { featured: true, active: true },
        sort: { field: 'created_at', direction: 'desc' }
      });
      return result.data;
    } catch (error: any) {
      console.error('❌ Error buscando productos destacados:', error);
      throw error;
    }
  }

  async searchByName(name: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .ilike('name', `%${name}%`)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      return (data || []).map(item => this.mapFromDatabase(item));
    } catch (error: any) {
      console.error('❌ Error buscando productos por nombre:', error);
      throw error;
    }
  }

  protected mapFromDatabase(data: any): Product {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      category_id: data.category_id,
      image_url: data.image_url,
      featured: data.featured,
      active: data.active,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  protected mapToDatabase(entity: Partial<Product>): any {
    const mapped: any = {};
    
    if (entity.name !== undefined) mapped.name = entity.name;
    if (entity.description !== undefined) mapped.description = entity.description;
    if (entity.price !== undefined) mapped.price = entity.price;
    if (entity.category_id !== undefined) mapped.category_id = entity.category_id;
    if (entity.image_url !== undefined) mapped.image_url = entity.image_url;
    if (entity.featured !== undefined) mapped.featured = entity.featured;
    if (entity.active !== undefined) mapped.active = entity.active;

    return mapped;
  }
}

/**
 * REPOSITORIO ESPECÍFICO PARA ÓRDENES
 */
export interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  shipping_cost: number;
  payment_method: string;
  shipping_address: any;
  created_at: Date;
  updated_at: Date;
}

export class OrderRepository extends BaseSupabaseRepository<Order> {
  protected tableName = 'orders';

  async findByUser(userId: string): Promise<Order[]> {
    try {
      const result = await this.findByCriteria({
        filters: { user_id: userId },
        sort: { field: 'created_at', direction: 'desc' }
      });
      return result.data;
    } catch (error: any) {
      console.error('❌ Error buscando órdenes por usuario:', error);
      throw error;
    }
  }

  async findByStatus(status: string): Promise<Order[]> {
    try {
      const result = await this.findByCriteria({
        filters: { status },
        sort: { field: 'created_at', direction: 'desc' }
      });
      return result.data;
    } catch (error: any) {
      console.error('❌ Error buscando órdenes por estado:', error);
      throw error;
    }
  }

  async updateStatus(orderId: string, newStatus: string): Promise<Order> {
    try {
      return await this.update(orderId, { status: newStatus });
    } catch (error: any) {
      console.error('❌ Error actualizando estado de orden:', error);
      throw error;
    }
  }

  protected mapFromDatabase(data: any): Order {
    return {
      id: data.id,
      user_id: data.user_id,
      status: data.status,
      total: data.total,
      shipping_cost: data.shipping_cost,
      payment_method: data.payment_method,
      shipping_address: data.shipping_address,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  protected mapToDatabase(entity: Partial<Order>): any {
    const mapped: any = {};
    
    if (entity.user_id !== undefined) mapped.user_id = entity.user_id;
    if (entity.status !== undefined) mapped.status = entity.status;
    if (entity.total !== undefined) mapped.total = entity.total;
    if (entity.shipping_cost !== undefined) mapped.shipping_cost = entity.shipping_cost;
    if (entity.payment_method !== undefined) mapped.payment_method = entity.payment_method;
    if (entity.shipping_address !== undefined) mapped.shipping_address = entity.shipping_address;

    return mapped;
  }
}

/**
 * FACTORY PARA REPOSITORIOS
 * 
 * Centraliza la creación de repositorios y asegura instancias únicas
 */
export class RepositoryFactory {
  private static readonly repositories = new Map<string, any>();

  static getProductRepository(): ProductRepository {
    if (!this.repositories.has('product')) {
      this.repositories.set('product', new ProductRepository());
      console.log('🏭 Repository Factory: Creando ProductRepository');
    }
    return this.repositories.get('product');
  }

  static getOrderRepository(): OrderRepository {
    if (!this.repositories.has('order')) {
      this.repositories.set('order', new OrderRepository());
      console.log('🏭 Repository Factory: Creando OrderRepository');
    }
    return this.repositories.get('order');
  }

  // Método para limpiar caché de repositorios (útil para testing)
  static clearCache(): void {
    this.repositories.clear();
    console.log('🧹 Repository Factory: Cache limpiado');
  }
}

export default RepositoryFactory;
