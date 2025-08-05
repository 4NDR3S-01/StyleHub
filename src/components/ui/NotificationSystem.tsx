import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSystemProps {
  notifications: NotificationProps[];
  onRemove: (id: string) => void;
}

export function NotificationSystem({ notifications, onRemove }: Readonly<NotificationSystemProps>) {
  const getIcon = (type: NotificationProps['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <X className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = (type: NotificationProps['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border shadow-lg transform transition-all duration-300 ${getStyles(notification.type)}`}
          role="alert"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <h4 className="font-medium">{notification.title}</h4>
              {notification.message && (
                <p className="mt-1 text-sm opacity-90">{notification.message}</p>
              )}
              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="mt-2 text-sm font-medium underline hover:no-underline"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => onRemove(notification.id)}
              className="ml-2 flex-shrink-0 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hook para usar el sistema de notificaciones
export function useNotifications() {
  const [notifications, setNotifications] = React.useState<NotificationProps[]>([]);

  const addNotification = React.useCallback((notification: Omit<NotificationProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    setNotifications(prev => [...prev, { ...notification, id }]);

    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  }, []);

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const success = React.useCallback((title: string, message?: string) => {
    addNotification({ type: 'success', title, message });
  }, [addNotification]);

  const error = React.useCallback((title: string, message?: string) => {
    addNotification({ type: 'error', title, message });
  }, [addNotification]);

  const warning = React.useCallback((title: string, message?: string) => {
    addNotification({ type: 'warning', title, message });
  }, [addNotification]);

  const info = React.useCallback((title: string, message?: string) => {
    addNotification({ type: 'info', title, message });
  }, [addNotification]);

  return {
    notifications,
    success,
    error,
    warning,
    info,
    removeNotification,
    NotificationSystem: () => (
      <NotificationSystem notifications={notifications} onRemove={removeNotification} />
    ),
  };
}
