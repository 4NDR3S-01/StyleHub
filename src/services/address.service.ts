import supabase from '@/lib/supabaseClient';

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface CreateAddressData {
  name: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  country?: string;
  is_default?: boolean;
}

/**
 * Obtiene todas las direcciones de un usuario
 */
export async function getUserAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user addresses:', error);
    throw new Error('Error al cargar direcciones');
  }

  return data || [];
}

/**
 * Obtiene la dirección por defecto de un usuario
 */
export async function getDefaultAddress(userId: string): Promise<Address | null> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No default address found
    }
    console.error('Error fetching default address:', error);
    throw new Error('Error al cargar dirección por defecto');
  }

  return data;
}

/**
 * Crea una nueva dirección
 */
export async function createAddress(userId: string, addressData: CreateAddressData): Promise<Address> {
  // Si la nueva dirección es por defecto, desactivar las demás
  if (addressData.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert([{
      user_id: userId,
      ...addressData,
      country: addressData.country || 'Colombia'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating address:', error);
    throw new Error('Error al crear dirección');
  }

  return data;
}

/**
 * Actualiza una dirección existente
 */
export async function updateAddress(
  addressId: string,
  userId: string,
  updates: Partial<CreateAddressData>
): Promise<Address> {
  // Si la dirección se está marcando como por defecto, desactivar las demás
  if (updates.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('addresses')
    .update(updates)
    .eq('id', addressId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating address:', error);
    throw new Error('Error al actualizar dirección');
  }

  return data;
}

/**
 * Elimina una dirección
 */
export async function deleteAddress(addressId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting address:', error);
    throw new Error('Error al eliminar dirección');
  }
}

/**
 * Establece una dirección como por defecto
 */
export async function setDefaultAddress(addressId: string, userId: string): Promise<void> {
  // Primero desactivar todas las direcciones por defecto
  await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId)
    .eq('is_default', true);

  // Luego activar la dirección seleccionada
  const { error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error setting default address:', error);
    throw new Error('Error al establecer dirección por defecto');
  }
}

/**
 * Valida los datos de una dirección
 */
export function validateAddress(address: CreateAddressData) {
  const errors: string[] = [];

  // Validaciones básicas
  if (!address.name || address.name.length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }

  if (!address.address || address.address.length < 10) {
    errors.push('La dirección debe tener al menos 10 caracteres');
  }

  if (!address.city || address.city.length < 2) {
    errors.push('La ciudad debe tener al menos 2 caracteres');
  }

  if (!address.country || address.country.length < 2) {
    errors.push('El país es requerido');
  }

  // Validación de teléfono si se proporciona
  if (address.phone && !/^\+?[\d\s-()]{10,}$/.test(address.phone)) {
    errors.push('Formato de teléfono inválido');
  }

  // Validación de código postal
  if (address.zip_code && !/^[\d-]{4,10}$/.test(address.zip_code)) {
    errors.push('Código postal inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
/**
 * Formatea una dirección para mostrar
 */
export function formatAddress(address: Address): string {
  const parts = [
    address.name,
    address.address,
    address.city,
    address.state,
    address.zip_code,
    address.country
  ].filter(Boolean);

  return parts.join(', ');
} 