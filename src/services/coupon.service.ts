import supabase from '@/lib/supabaseClient'

export interface Coupon {
  id: string
  code: string
  discount_percent: number
  expires_at: string | null
  active: boolean
}

/**
 * Valida un cupón por su código.  Devuelve el cupón si está activo y no ha
 * expirado.  De lo contrario devuelve null.  El código se compara en
 * mayúsculas para evitar problemas de capitalización.
 *
 * @param code Código del cupón introducido por el usuario
 */
export async function validateCoupon(code: string): Promise<Coupon | null> {
  const normalized = code.trim().toUpperCase()
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', normalized)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw error
  }
  if (!data) return null
  const now = new Date()
  const expires = data.expires_at ? new Date(data.expires_at) : null
  if (!data.active) return null
  if (expires && expires < now) return null
  return data as Coupon
}