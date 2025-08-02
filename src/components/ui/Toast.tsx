'use client';

import React, { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: (id: string) => void;
}

export function Toast({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  action,
  onClose 
}: Readonly<ToastProps>) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  };

  if (!isVisible) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  const IconComponent = icons[type];

  return (
    <div
      className={cn(
        'flex items-start p-4 rounded-lg border shadow-lg max-w-md transition-all duration-300',
        colors[type],
        isLeaving ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'
      )}
    >
      <IconComponent className={cn('h-5 w-5 mr-3 mt-0.5 flex-shrink-0', iconColors[type])} />
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold mb-1">{title}</h4>
        {message && <p className="text-sm opacity-90">{message}</p>}
        
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-xs font-medium underline hover:no-underline focus:outline-none"
          >
            {action.label}
          </button>
        )}
      </div>
      
      <button
        onClick={handleClose}
        className="ml-3 flex-shrink-0 p-1 rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Container para las notificaciones
export function ToastContainer({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      <div className="pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

// Context y hook para gestionar toasts
interface ToastContextType {
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast,
    };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const contextValue = useMemo(() => ({
    addToast,
    removeToast
  }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  return context;
}
