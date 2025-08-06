import supabase from '@/lib/supabaseClient';

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

export interface CreateShippingMethodData {
  name: string;
  description?: string;
  cost: number;
  delivery_time?: string;
  free_shipping_threshold?: number;
  active?: boolean;
}

export interface UpdateShippingMethodData {
  name?: string;
  description?: string;
  cost?: number;
  delivery_time?: string;
  free_shipping_threshold?: number;
  active?: boolean;
}

/**
 * Obtener todos los métodos de envío activos
 */
export async function getActiveShippingMethods(): Promise<ShippingMethod[]> {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    
    // Mapear campos para compatibilidad
    return (data || []).map(method => ({
      ...method,
      cost: method.price,
      delivery_time: method.estimated_days,
      free_shipping_threshold: method.free_over_amount
    }));
  } catch (error: any) {
    console.error('Error al obtener métodos de envío:', error);
    throw new Error(error.message || 'Error al obtener métodos de envío');
  }
}

/**
 * Obtener todos los métodos de envío (incluyendo inactivos) - Para admin
 */
export async function getAllShippingMethods(): Promise<ShippingMethod[]> {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    
    // Mapear campos para compatibilidad
    return (data || []).map(method => ({
      ...method,
      cost: method.price,
      delivery_time: method.estimated_days,
      free_shipping_threshold: method.free_over_amount
    }));
  } catch (error: any) {
    console.error('Error al obtener métodos de envío:', error);
    throw new Error(error.message || 'Error al obtener métodos de envío');
  }
}

/**
 * Crear un nuevo método de envío
 */
export async function createShippingMethod(data: CreateShippingMethodData): Promise<ShippingMethod> {
  try {
    const insertData = {
      name: data.name,
      description: data.description,
      price: data.cost,
      estimated_days: data.delivery_time,
      free_over_amount: data.free_shipping_threshold,
      active: data.active ?? true,
      sort_order: 0
    };

    const { data: result, error } = await supabase
      .from('shipping_methods')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    
    // Mapear campos para compatibilidad
    return {
      ...result,
      cost: result.price,
      delivery_time: result.estimated_days,
      free_shipping_threshold: result.free_over_amount
    };
  } catch (error: any) {
    console.error('Error al crear método de envío:', error);
    throw new Error(error.message || 'Error al crear método de envío');
  }
}

/**
 * Actualizar un método de envío
 */
export async function updateShippingMethod(id: string, data: UpdateShippingMethodData): Promise<ShippingMethod> {
  try {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.cost !== undefined) updateData.price = data.cost;
    if (data.delivery_time !== undefined) updateData.estimated_days = data.delivery_time;
    if (data.free_shipping_threshold !== undefined) updateData.free_over_amount = data.free_shipping_threshold;
    if (data.active !== undefined) updateData.active = data.active;

    const { data: result, error } = await supabase
      .from('shipping_methods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Mapear campos para compatibilidad
    return {
      ...result,
      cost: result.price,
      delivery_time: result.estimated_days,
      free_shipping_threshold: result.free_over_amount
    };
  } catch (error: any) {
    console.error('Error al actualizar método de envío:', error);
    throw new Error(error.message || 'Error al actualizar método de envío');
  }
}

/**
 * Eliminar un método de envío
 */
export async function deleteShippingMethod(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('shipping_methods')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error al eliminar método de envío:', error);
    throw new Error(error.message || 'Error al eliminar método de envío');
  }
}

/**
 * Calcular el costo de envío basado en el subtotal y método seleccionado
 */
export function calculateShippingCost(
  method: ShippingMethod,
  subtotal: number
): number {
  // Si hay un monto mínimo para envío gratis y el subtotal lo supera
  const threshold = method.free_shipping_threshold || method.free_over_amount;
  if (threshold && subtotal >= threshold) {
    return 0;
  }
  
  return method.cost || method.price;
}

/**
 * Obtener método de envío por ID
 */
export async function getShippingMethodById(id: string): Promise<ShippingMethod | null> {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Mapear campos para compatibilidad
    return {
      ...data,
      cost: data.price,
      delivery_time: data.estimated_days,
      free_shipping_threshold: data.free_over_amount
    };
  } catch (error: any) {
    console.error('Error al obtener método de envío:', error);
    return null;
  }
}
