'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  Wallet,
  Shield,
  Lock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Tipos actualizados según nuestro schema
interface SavedPaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'paypal';
  provider: 'stripe' | 'paypal';
  external_id: string;
  card_last_four?: string;
  card_brand?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  paypal_email?: string;
  is_default: boolean;
  active: boolean;
  nickname?: string;
  created_at: string;
  updated_at: string;
}

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<SavedPaymentMethod | null>(null);
  const [newMethodType, setNewMethodType] = useState<'card' | 'paypal'>('card');

  useEffect(() => {
    if (user?.id) {
      loadPaymentMethods();
    }
  }, [user?.id]);

  const loadPaymentMethods = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/payments/methods?user_id=${user.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error loading payment methods');
      }
      
      setPaymentMethods(data.payment_methods || []);
    } catch (error: any) {
      console.error('Error loading payment methods:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los métodos de pago',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/payments/methods', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: methodId,
          user_id: user.id,
          is_default: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating payment method');
      }

      await loadPaymentMethods();
      toast({
        title: 'Éxito',
        description: 'Método de pago predeterminado actualizado',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el método de pago',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/payments/methods?payment_method_id=${methodId}&user_id=${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting payment method');
      }

      await loadPaymentMethods();
      toast({
        title: 'Éxito',
        description: 'Método de pago eliminado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el método de pago',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateNickname = async (methodId: string, nickname: string) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/payments/methods', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: methodId,
          user_id: user.id,
          nickname
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating nickname');
      }

      await loadPaymentMethods();
      setEditingMethod(null);
      toast({
        title: 'Éxito',
        description: 'Apodo actualizado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el apodo',
        variant: 'destructive',
      });
    }
  };

  const formatCardDisplay = (method: SavedPaymentMethod) => {
    if (method.type === 'card') {
      const brandIcons: Record<string, string> = {
        'visa': '💳',
        'mastercard': '💳',
        'amex': '💳',
        'discover': '💳',
        'diners': '💳',
        'jcb': '💳'
      };
      const icon = brandIcons[method.card_brand?.toLowerCase() || ''] || '💳';
      return `${icon} •••• •••• •••• ${method.card_last_four}`;
    } else {
      return `📧 ${method.paypal_email}`;
    }
  };

  const formatExpiration = (method: SavedPaymentMethod) => {
    if (method.type === 'card' && method.card_exp_month && method.card_exp_year) {
      return `${method.card_exp_month.toString().padStart(2, '0')}/${method.card_exp_year}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Métodos de Pago</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus métodos de pago guardados de forma segura
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Método
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No tienes métodos de pago guardados
            </h3>
            <p className="text-gray-500 text-center mb-6">
              Agrega un método de pago para hacer compras más rápidas y seguras
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar tu primer método
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className={method.is_default ? 'ring-2 ring-blue-500' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      {method.type === 'card' ? (
                        <CreditCard className="h-6 w-6 text-gray-600" />
                      ) : (
                        <Wallet className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {method.nickname || (method.type === 'card' ? 'Tarjeta' : 'PayPal')}
                        </h3>
                        {method.is_default && (
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            <Star className="h-3 w-3 mr-1" />
                            Predeterminado
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm">
                        {formatCardDisplay(method)}
                      </p>
                      
                      {method.type === 'card' && formatExpiration(method) && (
                        <p className="text-gray-500 text-xs mt-1">
                          Expira: {formatExpiration(method)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-1 mt-2">
                        <Shield className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600">Verificado y seguro</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        className="flex items-center gap-1"
                      >
                        <StarOff className="h-3 w-3" />
                        Hacer predeterminado
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingMethod(method)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMethod(method.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para agregar nuevo método */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Método de Pago</DialogTitle>
            <DialogDescription>
              Para agregar un nuevo método de pago, serás redirigido al checkout donde podrás configurarlo de forma segura.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Tipo de método de pago</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <button
                  onClick={() => setNewMethodType('card')}
                  className={`p-4 border rounded-lg text-center ${
                    newMethodType === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <CreditCard className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Tarjeta</span>
                </button>
                
                <button
                  onClick={() => setNewMethodType('paypal')}
                  className={`p-4 border rounded-lg text-center ${
                    newMethodType === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <Wallet className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">PayPal</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Lock className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                Tu información de pago está protegida con encriptación de nivel bancario
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // Redirigir a una página de checkout especial para agregar métodos
                  window.location.href = `/checkout/add-payment-method?type=${newMethodType}`;
                }}
                className="flex-1"
              >
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar apodo */}
      <Dialog open={!!editingMethod} onOpenChange={() => setEditingMethod(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Método de Pago</DialogTitle>
            <DialogDescription>
              Personaliza el nombre de tu método de pago
            </DialogDescription>
          </DialogHeader>
          
          {editingMethod && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="nickname">Apodo del método</Label>
                <Input
                  id="nickname"
                  defaultValue={editingMethod.nickname || ''}
                  placeholder="Ej: Mi tarjeta principal, PayPal personal..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      handleUpdateNickname(editingMethod.id, target.value);
                    }
                  }}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingMethod(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const input = document.getElementById('nickname') as HTMLInputElement;
                    handleUpdateNickname(editingMethod.id, input.value);
                  }}
                  className="flex-1"
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
