import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'promotion';
  read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
  type: Notification['type'];
  data?: Record<string, any>;
}

export class NotificationService {
  /**
   * Crear nueva notificación
   */
  static async createNotification(notificationData: CreateNotificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear notificación');
    }
  }

  /**
   * Obtener notificaciones del usuario
   */
  static async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Notification[];
    } catch (error: any) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Marcar notificación como leída
   */
  static async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al marcar como leída');
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  static async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al marcar todas como leídas');
    }
  }

  /**
   * Eliminar notificación
   */
  static async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar notificación');
    }
  }

  /**
   * Obtener count de notificaciones no leídas
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Notificaciones específicas para órdenes
   */
  static async createOrderNotification(
    userId: string, 
    orderId: string, 
    status: string
  ) {
    const notifications = {
      'pending': {
        title: '🛍️ Orden Recibida',
        message: 'Tu orden ha sido recibida y está siendo procesada.',
        type: 'order' as const
      },
      'processing': {
        title: '📦 Orden en Preparación',
        message: 'Tu orden está siendo preparada para el envío.',
        type: 'order' as const
      },
      'shipped': {
        title: '🚛 Orden Enviada',
        message: 'Tu orden ha sido enviada y está en camino.',
        type: 'order' as const
      },
      'delivered': {
        title: '✅ Orden Entregada',
        message: '¡Tu orden ha sido entregada exitosamente!',
        type: 'success' as const
      },
      'cancelled': {
        title: '❌ Orden Cancelada',
        message: 'Tu orden ha sido cancelada.',
        type: 'warning' as const
      }
    };

    const notification = notifications[status as keyof typeof notifications];
    
    if (notification) {
      return await this.createNotification({
        user_id: userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: { orderId, status }
      });
    }
  }

  /**
   * Notificaciones para promociones
   */
  static async createPromotionNotification(
    userId: string,
    title: string,
    message: string,
    promotionData?: Record<string, any>
  ) {
    return await this.createNotification({
      user_id: userId,
      title: `🎉 ${title}`,
      message,
      type: 'promotion',
      data: promotionData
    });
  }

  /**
   * Notificaciones masivas
   */
  static async createBulkNotifications(notifications: CreateNotificationData[]) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;
      return data as Notification[];
    } catch (error: any) {
      throw new Error(error.message || 'Error al crear notificaciones masivas');
    }
  }

  /**
   * Notificar a todos los usuarios
   */
  static async notifyAllUsers(
    title: string,
    message: string,
    type: Notification['type'] = 'info'
  ) {
    try {
      // Obtener todos los usuarios activos
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('active', true);

      if (usersError) throw usersError;

      const notifications = users?.map(user => ({
        user_id: user.id,
        title,
        message,
        type,
      })) || [];

      return await this.createBulkNotifications(notifications);
    } catch (error: any) {
      throw new Error(error.message || 'Error al notificar a todos los usuarios');
    }
  }

  /**
   * Limpiar notificaciones antiguas
   */
  static async cleanOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al limpiar notificaciones');
    }
  }

  /**
   * Suscribirse a notificaciones en tiempo real
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as Notification);
      })
      .subscribe();
  }

  /**
   * Obtener estadísticas de notificaciones para admin
   */
  static async getNotificationStats() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, read, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        unread: data?.filter(n => !n.read).length || 0,
        byType: {} as Record<string, number>,
        last7Days: 0,
        last24Hours: 0
      };

      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const week = 7 * day;

      data?.forEach(notification => {
        // Contar por tipo
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        
        // Contar por fecha
        const notificationTime = new Date(notification.created_at).getTime();
        if (now - notificationTime < day) {
          stats.last24Hours++;
        }
        if (now - notificationTime < week) {
          stats.last7Days++;
        }
      });

      return stats;
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener estadísticas');
    }
  }
}

export default NotificationService;
