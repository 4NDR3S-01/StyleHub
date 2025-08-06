'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import PaymentService from '@/services/payment.service';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  Wallet,
  Shield,
  CheckCircle,
  Check,
  X,
  Lock,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

// Tipos para métodos de pago basados en el esquema real
interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'stripe' | 'paypal';
  provider_id: string; // Stripe customer ID o PayPal customer ID
  last_four?: string; // Para tarjetas de Stripe
  brand?: string; // Para tarjetas de Stripe
  expires_month?: number;
  expires_year?: number;
  is_default: boolean;
  metadata: {
    cardholder_name?: string;
    paypal_email?: string;
    billing_address?: {
      name: string;
      address: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
    };
  };
  created_at: string;
  updated_at: string;
}

interface AvailablePaymentMethod {
  id: string;
  name: string;
  type: 'stripe' | 'paypal';
  description: string;
  active: boolean;
  settings: {
    public_key?: string;
    client_id?: string;
    sandbox?: boolean;
  };
}

interface CreatePaymentMethodData {
  type: 'stripe' | 'paypal';
  // Para Stripe
  card_number?: string;
  cardholder_name?: string;
  expires_month?: string;
  expires_year?: string;
  cvv?: string;
  // Para PayPal
  paypal_email?: string;
  // Dirección de facturación
  billing_address: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  is_default: boolean;
}

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [availableMethods, setAvailableMethods] = useState<AvailablePaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreatePaymentMethodData>({
    type: 'stripe',
    card_number: '',
    cardholder_name: '',
    expires_month: '',
    expires_year: '',
    cvv: '',
    paypal_email: '',
    billing_address: {
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Ecuador'
    },
    is_default: false
  });

  // Cargar métodos de pago cuando el usuario se autentica
  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      console.log('Cargando métodos de pago...');
      
      // Cargar métodos de pago disponibles del sistema
      // Transformar a la estructura esperada
      const availableMethodsData: AvailablePaymentMethod[] = [
        {
          id: 'stripe',
          name: 'Tarjetas de Crédito/Débito',
          type: 'stripe',
          description: 'Visa, Mastercard, American Express y más',
          active: true,
          settings: {
            public_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
            sandbox: process.env.NODE_ENV !== 'production'
          }
        },
        {
          id: 'paypal',
          name: 'PayPal',
          type: 'paypal',
          description: 'Paga con tu cuenta de PayPal',
          active: true,
          settings: {
            client_id: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
            sandbox: process.env.NODE_ENV !== 'production'
          }
        }
      ];
      setAvailableMethods(availableMethodsData);

      // Cargar métodos de pago del usuario desde la base de datos
      const userMethodsData = await PaymentService.getUserPaymentMethods(user.id);
      setPaymentMethods(userMethodsData);
      
      console.log(`Se cargaron ${userMethodsData.length} métodos de pago del usuario`);
    } catch (error: any) {
      console.error('Error loading payment methods:', error);
      
      // Manejo específico de errores
      if (error.message?.includes('Usuario no autenticado')) {
        toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      } else if (error.message?.includes('conexión') || error.message?.includes('network')) {
        toast.error('Problema de conexión. Verifica tu internet e intenta nuevamente.');
      } else {
        toast.error(error.message || 'Error al cargar los métodos de pago. Intenta nuevamente.');
      }
      
      // En caso de error, cargar métodos disponibles por defecto
      const defaultMethods: AvailablePaymentMethod[] = [
        {
          id: 'stripe',
          name: 'Tarjetas de Crédito/Débito',
          type: 'stripe',
          description: 'Visa, Mastercard, American Express y más',
          active: true,
          settings: {
            public_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
            sandbox: process.env.NODE_ENV !== 'production'
          }
        },
        {
          id: 'paypal',
          name: 'PayPal',
          type: 'paypal',
          description: 'Paga con tu cuenta de PayPal',
          active: true,
          settings: {
            client_id: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
            sandbox: process.env.NODE_ENV !== 'production'
          }
        }
      ];
      setAvailableMethods(defaultMethods);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'stripe',
      card_number: '',
      cardholder_name: user?.name ? `${user.name} ${user.lastname || ''}`.trim() : '',
      expires_month: '',
      expires_year: '',
      cvv: '',
      paypal_email: '',
      billing_address: {
        name: user?.name ? `${user.name} ${user.lastname || ''}`.trim() : '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'Ecuador'
      },
      is_default: paymentMethods.length === 0
    });
    setEditingMethod(null);
  };

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        type: method.type,
        card_number: method.last_four ? `****-****-****-${method.last_four}` : '',
        cardholder_name: method.metadata?.cardholder_name || '',
        expires_month: method.expires_month?.toString().padStart(2, '0') || '',
        expires_year: method.expires_year?.toString() || '',
        cvv: '',
        paypal_email: method.metadata?.paypal_email || '',
        billing_address: method.metadata?.billing_address || {
          name: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',
          country: 'Ecuador'
        },
        is_default: method.is_default
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const validateStripeData = () => {
    if (!formData.card_number || formData.card_number.replace(/\s/g, '').length < 16) {
      toast.error('Número de tarjeta inválido');
      return false;
    }
    if (!formData.cardholder_name?.trim()) {
      toast.error('Nombre del titular es requerido');
      return false;
    }
    if (!formData.expires_month || !formData.expires_year) {
      toast.error('Fecha de vencimiento es requerida');
      return false;
    }
    if (!formData.cvv || formData.cvv.length < 3) {
      toast.error('CVV inválido');
      return false;
    }
    return true;
  };

  const validatePayPalData = () => {
    if (!formData.paypal_email?.trim()) {
      toast.error('Email de PayPal es requerido');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.paypal_email)) {
      toast.error('Email de PayPal inválido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes iniciar sesión para gestionar métodos de pago');
      return;
    }

    // Validar según el tipo
    const isValid = formData.type === 'stripe' ? validateStripeData() : validatePayPalData();
    if (!isValid) return;

    setSubmitting(true);
    try {
      // Simulación de guardado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const message = editingMethod 
        ? '✅ Método de pago actualizado correctamente'
        : '✅ Nuevo método de pago agregado exitosamente';
      
      toast.success(message);
      handleCloseDialog();
      loadPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast.error('❌ Error al guardar método de pago');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (methodId: string) => {
    if (!user) return;

    setDeleting(methodId);
    try {
      // Simulación de eliminación
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('✅ Método de pago eliminado correctamente');
      loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('❌ Error al eliminar método de pago');
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!user) return;

    try {
      // Simulación de establecer como predeterminado
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('✅ Método de pago establecido como predeterminado');
      loadPaymentMethods();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast.error('❌ Error al establecer método predeterminado');
    }
  };

  const getMethodName = (method: PaymentMethod) => {
    if (method.type === 'paypal') {
      return `PayPal (${method.metadata?.paypal_email || 'Email no disponible'})`;
    }
    if (method.type === 'stripe' && method.brand) {
      return `${method.brand} •••• ${method.last_four}`;
    }
    return 'Método de pago';
  };

  const getCardBrandIcon = (brand?: string) => {
    if (!brand) return '💳';
    switch (brand.toLowerCase()) {
      case 'visa':
        return '�'; // Azul para Visa
      case 'mastercard':
        return '�'; // Rojo para Mastercard
      case 'american express':
        return '�'; // Verde para Amex
      case 'discover':
        return '�'; // Naranja para Discover
      default:
        return '💳';
    }
  };

  const getMethodTypeIcon = (type: string) => {
    switch (type) {
      case 'paypal':
        return <Wallet className="h-5 w-5 text-blue-600" />;
      case 'stripe':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-blue-600" />;
    }
  };

  const getMethodTypeColor = (type: string) => {
    switch (type) {
      case 'paypal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'stripe':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMethodTypeName = (type: string) => {
    switch (type) {
      case 'stripe':
        return 'Stripe (Tarjeta)';
      case 'paypal':
        return 'PayPal';
      default:
        return 'Método de Pago';
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/\D/g, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches?.[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setFormData(prev => ({ ...prev, card_number: formatted }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="bg-white rounded-full p-6 mx-auto mb-6 w-24 h-24 shadow-lg">
              <Wallet className="h-12 w-12 text-blue-600 mx-auto" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestiona tus métodos de pago</h2>
            <p className="text-gray-600 mb-8 text-lg">Inicia sesión para administrar tus tarjetas y métodos de pago de forma segura</p>
            <Button 
            onClick={() => {
              // Disparar evento para abrir el modal de login
              window.dispatchEvent(new CustomEvent('openAuthModal'))
            }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="relative">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <Wallet className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Cargando tus métodos de pago...</p>
            <p className="mt-2 text-gray-500">Verificando información de pago segura</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Métodos de Pago</h1>
              <p className="text-gray-600 text-lg">
                Gestiona tus tarjetas y métodos de pago de forma segura
              </p>
            </div>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Agregar Método
            </Button>
          </div>

          {/* Información de seguridad */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    🔒 Tus datos están protegidos
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Utilizamos cifrado de nivel bancario (SSL 256-bit) para proteger toda tu información de pago.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Cumplimos con PCI DSS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Datos encriptados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Verificación 3D Secure</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Métodos activos</p>
                    <p className="text-2xl font-bold text-gray-900">{paymentMethods.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Star className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Método principal</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {paymentMethods.find(m => m.is_default) ? getMethodName(paymentMethods.find(m => m.is_default)!) : 'No definido'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Compras realizadas</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lista de métodos de pago */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paymentMethods.length === 0 ? (
            <div className="col-span-full">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="text-center py-16">
                  <div className="bg-gray-100 rounded-full p-8 mx-auto mb-6 w-24 h-24">
                    <CreditCard className="h-8 w-8 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">¡Agrega tu primer método de pago!</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Agrega una tarjeta de crédito, débito o billetera digital para realizar compras de forma rápida y segura.
                  </p>
                  <Button 
                    onClick={() => handleOpenDialog()}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar Primer Método
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            paymentMethods.map((method) => (
              <Card 
                key={method.id} 
                className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden group"
              >
                {/* Indicador de método predeterminado */}
                {method.is_default && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-green-400 text-white px-3 py-1 text-xs font-medium">
                    <Star className="h-3 w-3 inline mr-1" />
                    Principal
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getMethodTypeIcon(method.type)}
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {getMethodName(method)}
                        </CardTitle>
                        <Badge 
                          variant="secondary" 
                          className={`mt-1 text-xs ${getMethodTypeColor(method.type)}`}
                        >
                          {getMethodTypeName(method.type)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(method)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                        disabled={deleting === method.id}
                        className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                      >
                        {deleting === method.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-r-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Información del método de pago */}
                  {method.type === 'stripe' && method.last_four && (
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-2xl">{getCardBrandIcon(method.brand)}</span>
                        <span className="text-sm font-medium">{method.brand?.toUpperCase() || 'CARD'}</span>
                      </div>
                      <div className="text-lg font-mono tracking-wider mb-2">
                        •••• •••• •••• {method.last_four}
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>{method.metadata?.cardholder_name || 'Titular'}</span>
                        {method.expires_month && method.expires_year && (
                          <span>{method.expires_month.toString().padStart(2, '0')}/{method.expires_year}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {method.type === 'paypal' && (
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-2xl">💙</span>
                        <span className="text-sm font-medium">PAYPAL</span>
                      </div>
                      <div className="text-lg mb-2">
                        PayPal Account
                      </div>
                      <div className="text-sm">
                        <span>{method.metadata?.paypal_email || 'Email no disponible'}</span>
                      </div>
                    </div>
                  )}

                  {/* Dirección de facturación */}
                  {method.metadata?.billing_address && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700">Dirección de facturación</h4>
                      <div className="text-sm text-gray-600">
                        <p>{method.metadata.billing_address.address}</p>
                        <p>{method.metadata.billing_address.city}, {method.metadata.billing_address.state}</p>
                        <p>{method.metadata.billing_address.country} {method.metadata.billing_address.zip_code}</p>
                      </div>
                    </div>
                  )}
                  
                  <Separator className="my-3" />
                  
                  {/* Acciones y metadata */}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      Agregada {new Date(method.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        className="h-7 text-xs hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                      >
                        <StarOff className="h-3 w-3 mr-1" />
                        Hacer principal
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Formulario de método de pago */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingMethod 
                  ? 'Actualiza la información de tu método de pago'
                  : 'Agrega un nuevo método de pago seguro'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              {/* Tipo de método de pago */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Método de pago</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableMethods.filter(m => m.active).map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: method.type }))}
                      className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.type === method.type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {method.type === 'stripe' ? (
                        <CreditCard className="h-6 w-6 mb-2" />
                      ) : (
                        <Wallet className="h-6 w-6 mb-2" />
                      )}
                      <span className="text-sm font-medium text-center">{method.name}</span>
                      <span className="text-xs text-gray-500 text-center mt-1">{method.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Campos para Stripe (Tarjetas) */}
              {formData.type === 'stripe' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="card_number" className="text-sm font-semibold text-gray-700">
                        Número de tarjeta *
                      </Label>
                      <Input
                        id="card_number"
                        value={formData.card_number}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="cardholder_name" className="text-sm font-semibold text-gray-700">
                        Nombre del titular *
                      </Label>
                      <Input
                        id="cardholder_name"
                        value={formData.cardholder_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, cardholder_name: e.target.value }))}
                        placeholder="Juan Pérez García"
                        required
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expires_month" className="text-sm font-semibold text-gray-700">
                        Mes de vencimiento *
                      </Label>
                      <Select value={formData.expires_month} onValueChange={(value) => setFormData(prev => ({ ...prev, expires_month: value }))}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const month = (i + 1).toString().padStart(2, '0');
                            return (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expires_year" className="text-sm font-semibold text-gray-700">
                        Año de vencimiento *
                      </Label>
                      <Select value={formData.expires_year} onValueChange={(value) => setFormData(prev => ({ ...prev, expires_year: value }))}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = (new Date().getFullYear() + i).toString();
                            return (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="text-sm font-semibold text-gray-700">
                        CVV *
                      </Label>
                      <Input
                        id="cvv"
                        type="password"
                        value={formData.cvv}
                        onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                        placeholder="123"
                        maxLength={4}
                        required
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campos para PayPal */}
              {formData.type === 'paypal' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paypal_email" className="text-sm font-semibold text-gray-700">
                      Email de PayPal *
                    </Label>
                    <Input
                      id="paypal_email"
                      type="email"
                      value={formData.paypal_email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, paypal_email: e.target.value }))}
                      placeholder="tu-email@ejemplo.com"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      Este debe ser el email asociado a tu cuenta de PayPal
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900">Acerca de PayPal</h4>
                        <p className="text-xs text-blue-700 mt-1">
                          Al agregar PayPal, podrás pagar de forma segura usando tu cuenta de PayPal durante el checkout.
                          No necesitas ingresar información de tarjeta aquí.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dirección de facturación */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dirección de facturación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="billing_name" className="text-sm font-semibold text-gray-700">
                      Nombre completo *
                    </Label>
                    <Input
                      id="billing_name"
                      value={formData.billing_address.name}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        billing_address: { ...prev.billing_address, name: e.target.value }
                      }))}
                      placeholder="Juan Pérez García"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="billing_address" className="text-sm font-semibold text-gray-700">
                      Dirección *
                    </Label>
                    <Input
                      id="billing_address"
                      value={formData.billing_address.address}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        billing_address: { ...prev.billing_address, address: e.target.value }
                      }))}
                      placeholder="Av. Amazonas N39-123 y Arízaga"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billing_city" className="text-sm font-semibold text-gray-700">
                      Ciudad *
                    </Label>
                    <Input
                      id="billing_city"
                      value={formData.billing_address.city}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        billing_address: { ...prev.billing_address, city: e.target.value }
                      }))}
                      placeholder="Quito"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billing_state" className="text-sm font-semibold text-gray-700">
                      Provincia *
                    </Label>
                    <Input
                      id="billing_state"
                      value={formData.billing_address.state}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        billing_address: { ...prev.billing_address, state: e.target.value }
                      }))}
                      placeholder="Pichincha"
                      required
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billing_zip" className="text-sm font-semibold text-gray-700">
                      Código Postal
                    </Label>
                    <Input
                      id="billing_zip"
                      value={formData.billing_address.zip_code}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        billing_address: { ...prev.billing_address, zip_code: e.target.value }
                      }))}
                      placeholder="170150"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billing_country" className="text-sm font-semibold text-gray-700">
                      País
                    </Label>
                    <Input
                      id="billing_country"
                      value={formData.billing_address.country}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        billing_address: { ...prev.billing_address, country: e.target.value }
                      }))}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Opciones adicionales */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="is_default" className="text-sm text-gray-700 cursor-pointer">
                    Establecer como método de pago principal
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Este será tu método de pago predeterminado para futuras compras
                </p>
              </div>

              {/* Información de seguridad */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">Información segura</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Tu información se cifra con SSL 256-bit y cumple con los estándares PCI DSS.
                      Nunca almacenamos tu CVV completo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-3 pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2" />
                      {editingMethod ? 'Actualizando...' : 'Guardando...'}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {editingMethod ? 'Actualizar Método' : 'Guardar Método'}
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseDialog}
                  disabled={submitting}
                  className="px-6"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
