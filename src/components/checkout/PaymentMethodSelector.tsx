"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface SavedPaymentMethod {
  id: string;
  type: string;
  provider: string;
  external_id: string;
  card_last_four?: string;
  card_brand?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  paypal_email?: string;
  is_default: boolean;
  nickname?: string;
}

interface PaymentData {
  type: string;
  savedMethodId?: string | null;
  externalId?: string;
  isNew?: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod: string | null;
  onMethodSelect: (methodId: string, type: 'saved' | 'new') => void;
  onPaymentDataChange: (data: any) => void;
}

export default function PaymentMethodSelector({ 
  selectedMethod, 
  onMethodSelect, 
  onPaymentDataChange 
}: Readonly<PaymentMethodSelectorProps>) {
  const { user } = useAuth();
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMethodType, setNewMethodType] = useState<'card' | 'paypal'>('card');

  // Cargar métodos de pago guardados
  useEffect(() => {
    if (user?.id) {
      loadSavedMethods();
    }
  }, [user?.id]);

    const loadSavedMethods = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/payments/methods?user_id=${user.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error loading payment methods');
      }
      
      const methods = data.payment_methods || [];
      setSavedMethods(methods);
      
      // Seleccionar el método por defecto si existe
      const defaultMethod = methods.find((m: SavedPaymentMethod) => m.is_default);
      if (defaultMethod && !selectedMethod) {
        onMethodSelect(defaultMethod.id, 'saved');
        onPaymentDataChange({
          type: defaultMethod.type,
          savedMethodId: defaultMethod.id,
          externalId: defaultMethod.external_id
        });
      }
    } catch (error) {
      console.error('Error loading saved payment methods:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los métodos de pago guardados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelection = (methodId: string, type: 'saved' | 'new') => {
    onMethodSelect(methodId, type);
    
    if (type === 'saved') {
      const method = savedMethods.find((m: SavedPaymentMethod) => m.id === methodId);
      if (method) {
        // Normalizar el tipo de pago
        const normalizedType = method.type === 'stripe' ? 'card' : method.type;
        
        onPaymentDataChange({
          type: normalizedType,
          savedMethodId: method.id,
          externalId: method.external_id
        });
      }
    } else {
      onPaymentDataChange({
        type: newMethodType,
        savedMethodId: null,
        isNew: true
      });
    }
  };

  const formatCardNumber = (lastFour: string, brand: string) => {
    const brandIcons: Record<string, string> = {
      'visa': '💳',
      'mastercard': '💳',
      'amex': '💳',
      'discover': '💳',
      'diners': '💳',
      'jcb': '💳'
    };
    return `${brandIcons[brand.toLowerCase()] || '💳'} •••• •••• •••• ${lastFour}`;
  };

  const formatExpiry = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Método de pago</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Método de pago</h3>
      
      <div className="space-y-3">
        {/* Métodos guardados */}
        {savedMethods.length > 0 && (
          <>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Métodos guardados</h4>
            {savedMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors w-full text-left ${
                  selectedMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleMethodSelection(method.id, 'saved')}
              >
                <input
                  type="radio"
                  id={`saved-${method.id}`}
                  checked={selectedMethod === method.id}
                  onChange={() => handleMethodSelection(method.id, 'saved')}
                  className="text-blue-600"
                />
                <div className="flex-1">
                  {method.type === 'card' && method.card_last_four && (
                    <div>
                      <div className="font-medium">
                        {formatCardNumber(method.card_last_four, method.card_brand || 'card')}
                      </div>
                      <div className="text-sm text-gray-500">
                        Expira {formatExpiry(method.card_exp_month || 0, method.card_exp_year || 0)}
                        {method.is_default && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Por defecto
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {method.type === 'paypal' && (
                    <div>
                      <div className="font-medium">🏛️ PayPal</div>
                      <div className="text-sm text-gray-500">
                        {method.paypal_email}
                        {method.is_default && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Por defecto
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
            <hr className="my-4" />
          </>
        )}

        {/* Opción para agregar nuevo método */}
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          {savedMethods.length > 0 ? 'Agregar nuevo método' : 'Seleccionar método de pago'}
        </h4>
        
        {/* Nuevo método - Tarjeta */}
        <button
          type="button"
          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors w-full text-left ${
            selectedMethod === 'new-card'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => {
            setNewMethodType('card');
            handleMethodSelection('new-card', 'new');
          }}
        >
          <input
            type="radio"
            id="new-card"
            checked={selectedMethod === 'new-card'}
            onChange={() => {
              setNewMethodType('card');
              handleMethodSelection('new-card', 'new');
            }}
            className="text-blue-600"
          />
          <label htmlFor="new-card" className="flex items-center gap-2 cursor-pointer flex-1">
            <span>💳</span>
            <span>Nueva tarjeta de crédito/débito</span>
          </label>
        </button>

        {/* Nuevo método - PayPal */}
        <button
          type="button"
          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors w-full text-left ${
            selectedMethod === 'new-paypal'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => {
            setNewMethodType('paypal');
            handleMethodSelection('new-paypal', 'new');
          }}
        >
          <input
            type="radio"
            id="new-paypal"
            checked={selectedMethod === 'new-paypal'}
            onChange={() => {
              setNewMethodType('paypal');
              handleMethodSelection('new-paypal', 'new');
            }}
            className="text-blue-600"
          />
          <label htmlFor="new-paypal" className="flex items-center gap-2 cursor-pointer flex-1">
            <span>🏛️</span>
            <span>PayPal</span>
          </label>
        </button>
      </div>

      {/* Información de seguridad */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span>🔒</span>
          <p className="text-sm text-green-700">
            <strong>Pago seguro:</strong> Todos los pagos están protegidos con encriptación SSL y procesados por Stripe y PayPal.
          </p>
        </div>
      </div>
    </div>
  );
}
