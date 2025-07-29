import supabase from '@/lib/supabaseClient';
import { CartItem } from '@/types';

export interface OrderData {
  user_id: string;
  items: CartItem[];
  shipping_info: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  payment_info: {
    method: string;
    lastFour: string;
  };
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface Order extends OrderData {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
}

export class OrderService {
  static async createOrder(orderData: Omit<OrderData, 'status'>): Promise<Order> {
    try {
      // Generar número de orden único
      const orderNumber = this.generateOrderNumber();
      
      const order = {
        ...orderData,
        order_number: orderNumber,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating order: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('OrderService.createOrder error:', error);
      throw error;
    }
  }

  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No se encontró la orden
        }
        throw new Error(`Error fetching order: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('OrderService.getOrderById error:', error);
      throw error;
    }
  }

  static async getOrdersByUserId(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error fetching orders: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('OrderService.getOrdersByUserId error:', error);
      throw error;
    }
  }

  static async updateOrderStatus(orderId: string, status: OrderData['status']): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating order status: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('OrderService.updateOrderStatus error:', error);
      throw error;
    }
  }

  static async getAllOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error fetching all orders: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('OrderService.getAllOrders error:', error);
      throw error;
    }
  }

  static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  }

  static calculateTotals(items: CartItem[]) {
    const subtotal = items.reduce((sum, item) => sum + (item.producto.price * item.quantity), 0);
    const shipping = subtotal > 200000 ? 0 : 15000; // Envío gratis por compras mayores a $200,000
    const tax = subtotal * 0.19; // IVA del 19%
    const total = subtotal + shipping + tax;

    return {
      subtotal,
      shipping,
      tax,
      total
    };
  }
}

// Simulador de procesador de pagos
export class PaymentService {
  static async processPayment(
    amount: number,
    paymentInfo: {
      cardNumber: string;
      cardHolder: string;
      expiryDate: string;
      cvv: string;
    }
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular diferentes escenarios de pago
    const lastDigit = parseInt(paymentInfo.cardNumber.slice(-1));
    
    if (lastDigit === 0) {
      // Simular tarjeta declinada
      return {
        success: false,
        error: 'Tarjeta declinada. Verifica tu información de pago.'
      };
    } else if (lastDigit === 1) {
      // Simular fondos insuficientes
      return {
        success: false,
        error: 'Fondos insuficientes.'
      };
    } else {
      // Pago exitoso
      return {
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    }
  }
}
