import { createClient } from '@supabase/supabase-js';
import type { productos } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  size?: string;
  color?: string;
  created_at: string;
  product: productos;
}

export interface AddToCartData {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface UpdateCartItemData {
  quantity?: number;
  size?: string;
  color?: string;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export class CartService {
  /**
   * Agregar producto al carrito
   */
  static async addToCart(userId: string, cartData: AddToCartData) {
    try {
      // Verificar si el producto ya está en el carrito con las mismas opciones
      const { data: existingItem } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', cartData.productId)
        .eq('size', cartData.size || '')
        .eq('color', cartData.color || '')
        .single();

      if (existingItem) {
        // Actualizar cantidad si ya existe
        return await this.updateCartItem(
          existingItem.id,
          { quantity: existingItem.quantity + cartData.quantity }
        );
      } else {
        // Crear nuevo item
        const { data, error } = await supabase
          .from('cart')
          .insert([
            {
              user_id: userId,
              product_id: cartData.productId,
              quantity: cartData.quantity,
              size: cartData.size || null,
              color: cartData.color || null,
            },
          ])
          .select(`
            *,
            product:products(*)
          `)
          .single();

        if (error) throw error;
        return data as CartItem;
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al agregar al carrito');
    }
  }

  /**
   * Obtener carrito del usuario
   */
  static async getCart(userId: string): Promise<CartItem[]> {
    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CartItem[];
    } catch (error: any) {
      console.error('Error getting cart:', error);
      return [];
    }
  }

  /**
   * Actualizar item del carrito
   */
  static async updateCartItem(cartItemId: string, updates: UpdateCartItemData) {
    try {
      const { data, error } = await supabase
        .from('cart')
        .update(updates)
        .eq('id', cartItemId)
        .select(`
          *,
          product:products(*)
        `)
        .single();

      if (error) throw error;
      return data as CartItem;
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar item del carrito');
    }
  }

  /**
   * Eliminar item del carrito
   */
  static async removeFromCart(cartItemId: string) {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar del carrito');
    }
  }

  /**
   * Limpiar carrito
   */
  static async clearCart(userId: string) {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al limpiar carrito');
    }
  }

  /**
   * Obtener resumen del carrito con cálculos
   */
  static async getCartSummary(userId: string): Promise<CartSummary> {
    try {
      const items = await this.getCart(userId);
      
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = items.reduce(
        (sum, item) => sum + (item.product.price * item.quantity), 
        0
      );
      
      // Calcular impuestos (ejemplo: 16% IVA)
      const tax = subtotal * 0.16;
      
      // Calcular envío (gratis si subtotal > $1000, sino $100)
      const shipping = subtotal > 1000 ? 0 : 100;
      
      const total = subtotal + tax + shipping;

      return {
        items,
        totalItems,
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        shipping,
        total: Number(total.toFixed(2)),
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error al calcular resumen del carrito');
    }
  }

  /**
   * Verificar disponibilidad de productos en el carrito
   */
  static async validateCartStock(userId: string): Promise<{
    valid: boolean;
    outOfStockItems: string[];
    lowStockItems: { productId: string; available: number; requested: number }[];
  }> {
    try {
      const cartItems = await this.getCart(userId);
      const outOfStockItems: string[] = [];
      const lowStockItems: { productId: string; available: number; requested: number }[] = [];

      for (const item of cartItems) {
        if (item.product.stock === 0) {
          outOfStockItems.push(item.product.id);
        } else if (item.product.stock < item.quantity) {
          lowStockItems.push({
            productId: item.product.id,
            available: item.product.stock,
            requested: item.quantity,
          });
        }
      }

      return {
        valid: outOfStockItems.length === 0 && lowStockItems.length === 0,
        outOfStockItems,
        lowStockItems,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error al validar stock del carrito');
    }
  }

  /**
   * Aplicar cupón de descuento
   */
  static async applyCoupon(userId: string, couponCode: string): Promise<{
    valid: boolean;
    discount: number;
    message: string;
  }> {
    try {
      // Verificar si el cupón existe y está activo
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .single();

      if (error || !coupon) {
        return {
          valid: false,
          discount: 0,
          message: 'Cupón no válido o expirado',
        };
      }

      // Verificar fecha de expiración
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return {
          valid: false,
          discount: 0,
          message: 'Cupón expirado',
        };
      }

      // Verificar límite de uso
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        return {
          valid: false,
          discount: 0,
          message: 'Cupón agotado',
        };
      }

      // Obtener resumen del carrito para calcular descuento
      const cartSummary = await this.getCartSummary(userId);
      
      // Verificar monto mínimo
      if (coupon.minimum_amount && cartSummary.subtotal < coupon.minimum_amount) {
        return {
          valid: false,
          discount: 0,
          message: `Monto mínimo requerido: $${coupon.minimum_amount}`,
        };
      }

      // Calcular descuento
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (cartSummary.subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount && discount > coupon.max_discount) {
          discount = coupon.max_discount;
        }
      } else {
        discount = coupon.discount_value;
      }

      return {
        valid: true,
        discount: Number(discount.toFixed(2)),
        message: `Descuento aplicado: $${discount.toFixed(2)}`,
      };
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      throw new Error(error.message || 'Error al aplicar cupón');
    }
  }

  /**
   * Mover productos del carrito a lista de deseos
   */
  static async moveToWishlist(userId: string, cartItemId: string) {
    try {
      // Obtener item del carrito
      const { data: cartItem, error: cartError } = await supabase
        .from('cart')
        .select('*')
        .eq('id', cartItemId)
        .eq('user_id', userId)
        .single();

      if (cartError || !cartItem) {
        throw new Error('Item no encontrado en el carrito');
      }

      // Agregar a lista de deseos
      const { error: wishlistError } = await supabase
        .from('wishlist')
        .insert([
          {
            user_id: userId,
            product_id: cartItem.product_id,
          },
        ]);

      if (wishlistError && !wishlistError.message.includes('duplicate')) {
        throw wishlistError;
      }

      // Eliminar del carrito
      await this.removeFromCart(cartItemId);
    } catch (error: any) {
      throw new Error(error.message || 'Error al mover a lista de deseos');
    }
  }

  /**
   * Obtener productos relacionados basados en el carrito
   */
  static async getRecommendedProducts(userId: string, limit: number = 4): Promise<productos[]> {
    try {
      const cartItems = await this.getCart(userId);
      
      if (cartItems.length === 0) {
        // Si no hay items en el carrito, mostrar productos populares
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .limit(limit);

        if (error) throw error;
        return data as productos[];
      }

      // Obtener categorías de productos en el carrito
      const categories = Array.from(new Set(cartItems.map(item => item.product.category)));
      
      // Obtener productos relacionados de las mismas categorías
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('category', categories)
        .not('id', 'in', `(${cartItems.map(item => item.product.id).join(',')})`)
        .limit(limit);

      if (error) throw error;
      return data as productos[];
    } catch (error: any) {
      console.error('Error getting recommended products:', error);
      return [];
    }
  }

  /**
   * Calcular tiempo estimado de entrega
   */
  static calculateEstimatedDelivery(): { min: number; max: number; business: boolean } {
    // Ejemplo de cálculo de entrega (3-7 días hábiles)
    const minDays = 3;
    const maxDays = 7;
    
    return {
      min: minDays,
      max: maxDays,
      business: true, // días hábiles
    };
  }
}

export default CartService;
