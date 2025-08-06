'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, ShoppingBag, CreditCard, Check } from 'lucide-react';
import { toast } from 'sonner';
import { CartItem } from '@/context/CartContext';
import { User } from '@/types';
import { checkCartStock } from '@/services/inventory.service';
import { PaymentService, CheckoutSessionData } from '@/services/payment.service';
import PaymentMethodSelection from './PaymentMethodSelection';
import { OrderSummary } from './OrderSummary';

// Schema de validación
const checkoutSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres'),
  state: z.string().min(2, 'El estado debe tener al menos 2 caracteres'),
  zipCode: z.string().min(4, 'El código postal debe tener al menos 4 caracteres'),
  country: z.string().min(2, 'El país debe tener al menos 2 caracteres'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface UnifiedCheckoutProps {
  user: User | null;
  cartItems: CartItem[];
  onOrderComplete?: (orderId: string) => void;
}

export default function UnifiedCheckout({ user, cartItems, onOrderComplete }: UnifiedCheckoutProps) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paypal' | null>(null);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: user?.name || '',
      lastName: user?.lastname || '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Colombia',
    },
  });

  // Validar stock antes de proceder
  const validateStock = async (): Promise<boolean> => {
    try {
      const stockChecks = await checkCartStock(cartItems);
      const stockIssues = stockChecks.filter(check => !check.isAvailable);
      
      if (stockIssues.length > 0) {
        toast.error('Algunos productos no tienen stock suficiente. Por favor revisa tu carrito.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error validating stock:', error);
      toast.error('Error al validar disponibilidad de productos');
      return false;
    }
  };

  // Navegar al siguiente paso
  const nextStep = async () => {
    if (step === 1) {
      // Validar información de envío
      const isValid = await form.trigger(['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country']);
      if (!isValid) {
        toast.error('Por favor completa todos los campos requeridos correctamente');
        return;
      }
      
      // Validar stock
      const stockValid = await validateStock();
      if (!stockValid) return;
      
      setStep(2);
    } else if (step === 2) {
      if (!selectedPaymentMethod) {
        toast.error('Por favor selecciona un método de pago');
        return;
      }
      setStep(3);
    }
  };

  // Navegar al paso anterior
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Procesar el pago final
  const processFinalPayment = async (data: CheckoutFormData) => {
    if (!selectedPaymentMethod) {
      toast.error('Por favor selecciona un método de pago');
      return;
    }

    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    setIsProcessing(true);

    try {
      // Validar stock una vez más antes del pago
      const stockValid = await validateStock();
      if (!stockValid) {
        setIsProcessing(false);
        return;
      }

      // Preparar datos para el checkout usando Factory Pattern
      const checkoutData: CheckoutSessionData = {
        cartItems: cartItems,
        email: data.email,
        userId: user.id,
        customerData: {
          name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
          address: {
            line1: data.address,
            city: data.city,
            state: data.state,
            postal_code: data.zipCode,
            country: data.country || 'CO',
          },
        },
        metadata: {
          firstName: data.firstName,
          lastName: data.lastName,
          step: 'unified_checkout',
        },
      };

      // Usar el servicio de pago con Factory Method Pattern
      const result = await PaymentService.processPayment(checkoutData, selectedPaymentMethod);

      if (result.success) {
        toast.success('Redirigiendo al procesador de pagos...');
        // El PaymentService ya maneja la redirección
        if (onOrderComplete && result.sessionId) {
          onOrderComplete(result.sessionId);
        }
      } else {
        throw new Error(result.error || 'Error al procesar el pago');
      }

    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast.error(error.message || 'Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Indicador de progreso
  const ProgressIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {[1, 2, 3].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {step > stepNumber ? <Check size={20} /> : stepNumber}
            </div>
            <div className={`text-sm mt-2 ${
              step >= stepNumber ? 'text-blue-600 font-medium' : 'text-gray-400'
            }`}>
              <span>
                {stepNumber === 1 && 'Envío'}
                {stepNumber === 2 && 'Pago'}
                {stepNumber === 3 && 'Confirmar'}
              </span>
            </div>
            {stepNumber < 3 && (
              <div className={`flex-1 mx-4 h-0.5 ${
                step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Form {...form}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario principal */}
          <div className="lg:col-span-2 space-y-6">
            <ProgressIndicator />

            {/* Paso 1: Información de Envío */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Información de Envío
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Dirección completa" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado/Departamento *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Postal *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un país" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Colombia">Colombia</SelectItem>
                            <SelectItem value="Mexico">México</SelectItem>
                            <SelectItem value="Peru">Perú</SelectItem>
                            <SelectItem value="Chile">Chile</SelectItem>
                            <SelectItem value="Argentina">Argentina</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Paso 2: Selección de Método de Pago */}
            {step === 2 && (
              <PaymentMethodSelection
                onPaymentMethodSelect={setSelectedPaymentMethod}
                selectedMethod={selectedPaymentMethod || undefined}
                isProcessing={isProcessing}
              />
            )}

            {/* Paso 3: Confirmación */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Confirmar Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6">
                    <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Revisa tu información antes de continuar
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Tu pago será procesado de forma segura con {selectedPaymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Envío a:</p>
                        <p className="font-medium">
                          {form.getValues('firstName')} {form.getValues('lastName')}
                        </p>
                        <p>{form.getValues('address')}</p>
                        <p>{form.getValues('city')}, {form.getValues('state')}</p>
                        <p>{form.getValues('zipCode')}, {form.getValues('country')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Método de pago:</p>
                        <p className="font-medium">
                          {selectedPaymentMethod === 'stripe' ? 'Tarjeta de Crédito/Débito' : 'PayPal'}
                        </p>
                        <p className="text-gray-600">Email de confirmación:</p>
                        <p className="font-medium">{form.getValues('email')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botones de navegación */}
            <div className="flex justify-between">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} disabled={isProcessing}>
                  Anterior
                </Button>
              )}
              
              {step < 3 ? (
                <Button type="button" onClick={nextStep} className="ml-auto">
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={form.handleSubmit(processFinalPayment)}
                  disabled={isProcessing}
                  className="ml-auto"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Procesando...
                    </div>
                  ) : (
                    'Confirmar y Pagar'
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <OrderSummary items={cartItems} isProcessing={isProcessing} />
          </div>
        </div>
      </Form>
    </div>
  );
}
