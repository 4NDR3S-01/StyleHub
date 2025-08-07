"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Check, Lock } from 'lucide-react';

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

  useEffect(() => {
    if (user?.id) {
      loadSavedMethods();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadSavedMethods = async () => {
    try {
      const response = await fetch('/api/payments/methods');
      const data = await response.json();
      
      if (data.success) {
        setSavedMethods(data.methods || []);
        
        // Auto-seleccionar método por defecto si existe
        const defaultMethod = data.methods?.find((m: SavedPaymentMethod) => m.is_default);
        if (defaultMethod && !selectedMethod) {
          handleMethodSelection(defaultMethod.id, 'saved');
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
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
        const normalizedType = method.type === 'stripe' ? 'card' : method.type;
        
        onPaymentDataChange({
          type: normalizedType,
          savedMethodId: method.id,
          externalId: method.external_id,
          isNew: false,
          provider: method.provider,
          cardBrand: method.card_brand,
          cardLastFour: method.card_last_four,
          paypalEmail: method.paypal_email
        });
      }
    } else {
      // Para métodos nuevos, determinar el tipo por defecto
      const paymentType = methodId === 'new-paypal' ? 'paypal' : 'card';
      
      onPaymentDataChange({
        type: paymentType,
        savedMethodId: methodId,
        isNew: true,
        requiresForm: paymentType === 'card' // Las tarjetas nuevas requieren formulario
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
      'jcb': '💳',
      'unionpay': '💳'
    };
    
    return {
      icon: brandIcons[brand.toLowerCase()] || '💳',
      display: `•••• •••• •••• ${lastFour}`,
      brand: brand.toUpperCase()
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Método de pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Método de pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedMethods.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Tarjetas guardadas</h4>
            {savedMethods.map((method) => {
              const isSelected = selectedMethod === method.id;
              const cardInfo = method.card_last_four ? 
                formatCardNumber(method.card_last_four, method.card_brand || 'card') : 
                null;

              return (
                <button
                  key={method.id}
                  type="button"
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:border-gray-300 w-full text-left ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleMethodSelection(method.id, 'saved')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleMethodSelection(method.id, 'saved');
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {cardInfo && (
                        <span className="text-2xl">{cardInfo.icon}</span>
                      )}
                      <div>
                        {(() => {
                          if (cardInfo) {
                            return (
                              <>
                                <div className="font-medium">{cardInfo.brand}</div>
                                <div className="text-sm text-gray-600">{cardInfo.display}</div>
                                {method.card_exp_month && method.card_exp_year && (
                                  <div className="text-xs text-gray-500">
                                    Exp: {method.card_exp_month.toString().padStart(2, '0')}/{method.card_exp_year}
                                  </div>
                                )}
                              </>
                            );
                          } else if (method.paypal_email) {
                            return (
                              <>
                                <div className="font-medium">PayPal</div>
                                <div className="text-sm text-gray-600">{method.paypal_email}</div>
                              </>
                            );
                          } else {
                            return <div className="font-medium">Método de pago guardado</div>;
                          }
                        })()}
                        {method.nickname && (
                          <div className="text-xs text-gray-500">{method.nickname}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          Predeterminado
                        </Badge>
                      )}
                      {isSelected && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Opciones para agregar nuevos métodos */}
        <div className="space-y-3">
          {savedMethods.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-gray-700 mb-3">O agregar nuevo método de pago</h4>
            </div>
          )}
          
          {/* Nueva tarjeta */}
          <button
            type="button"
            className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:border-gray-300 w-full text-left ${
              selectedMethod === 'new-card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => handleMethodSelection('new-card', 'new')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMethodSelection('new-card', 'new');
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 border border-dashed border-gray-300 rounded flex items-center justify-center">
                  <Plus className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div className="font-medium">Agregar nueva tarjeta</div>
                  <div className="text-sm text-gray-600">
                    {savedMethods.length === 0 
                      ? "Continúa con Stripe para procesar tu pago"
                      : "Paga con una tarjeta diferente"
                    }
                  </div>
                </div>
              </div>
              {selectedMethod === 'new-card' && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </button>

          {/* Nuevo PayPal */}
          <button
            type="button"
            className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:border-gray-300 w-full text-left ${
              selectedMethod === 'new-paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => handleMethodSelection('new-paypal', 'new')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMethodSelection('new-paypal', 'new');
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">PP</span>
                </div>
                <div>
                  <div className="font-medium">PayPal</div>
                  <div className="text-sm text-gray-600">
                    Pagar con tu cuenta de PayPal
                  </div>
                </div>
              </div>
              {selectedMethod === 'new-paypal' && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Información de seguridad */}
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 border-t">
          <Lock className="w-4 h-4" />
          <span>
            <strong>Pago seguro:</strong> Todos los pagos están protegidos con encriptación SSL y procesados por Stripe.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
