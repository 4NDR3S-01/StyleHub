'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { CreditCard, MapPin, User, Lock } from 'lucide-react';
import { CartItem, User as UserType } from '@/types';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { OrderService, PaymentService } from '@/services/order.service';

// Esquema de validación para el formulario
const checkoutSchema = z.object({
  // Información de envío
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  
  // Dirección
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().min(2, 'El estado/provincia es requerido'),
  zipCode: z.string().min(5, 'El código postal debe tener al menos 5 caracteres'),
  country: z.string().min(2, 'El país es requerido'),
  
  // Información de pago
  cardNumber: z.string()
    .min(16, 'El número de tarjeta debe tener 16 dígitos')
    .max(19, 'Número de tarjeta inválido')
    .regex(/^[0-9\s]+$/, 'Solo se permiten números'),
  cardHolder: z.string().min(2, 'El nombre del titular es requerido'),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Formato inválido (MM/YY)'),
  cvv: z.string()
    .min(3, 'CVV debe tener al menos 3 dígitos')
    .max(4, 'CVV debe tener máximo 4 dígitos')
    .regex(/^[0-9]+$/, 'Solo se permiten números'),
  
  // Opciones adicionales
  saveInfo: z.boolean().default(false),
  sameAsShipping: z.boolean().default(true),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  user: UserType | null;
  cartItems: CartItem[];
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export function CheckoutForm({ user, cartItems, isProcessing, setIsProcessing }: CheckoutFormProps) {
  const { clearCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState(1);

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
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      saveInfo: false,
      sameAsShipping: true,
    },
  });

  // Formatear número de tarjeta
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
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

  // Formatear fecha de expiración
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);
    
    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Calcular totales
      const totals = OrderService.calculateTotals(cartItems);

      // Procesar pago
      const paymentResult = await PaymentService.processPayment(totals.total, {
        cardNumber: data.cardNumber,
        cardHolder: data.cardHolder,
        expiryDate: data.expiryDate,
        cvv: data.cvv
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Error procesando el pago');
      }

      // Crear orden en la base de datos
      const orderData = {
        user_id: user.id,
        items: cartItems,
        shipping_info: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        payment_info: {
          method: 'credit_card',
          lastFour: data.cardNumber.slice(-4),
        },
        subtotal: totals.subtotal,
        shipping_cost: totals.shipping,
        tax: totals.tax,
        total: totals.total,
      };

      const order = await OrderService.createOrder(orderData);
      
      // Limpiar carrito y redirigir
      clearCart();
      toast.success('¡Pago procesado exitosamente!');
      router.push(`/orden-confirmada?orderId=${order.id}`);
      
    } catch (error) {
      console.error('Error procesando pago:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Validar información de envío
      const shippingFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
      form.trigger(shippingFields as any).then(isValid => {
        if (isValid) setStep(2);
      });
    } else if (step === 2) {
      setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
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
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu apellido" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="tu@email.com" type="email" {...field} />
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
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="3001234567" {...field} />
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
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Calle 123 #45-67" {...field} />
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
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Manta" {...field} />
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
                      <FormLabel>Estado/Provincia</FormLabel>
                      <FormControl>
                        <Input placeholder="Manabí" {...field} />
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
                      <FormLabel>Código Postal</FormLabel>
                      <FormControl>
                        <Input placeholder="110111" {...field} />
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
                    <FormLabel>País</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Colombia">Colombia</SelectItem>
                        <SelectItem value="Ecuador">Ecuador</SelectItem>
                        <SelectItem value="Venezuela">Venezuela</SelectItem>
                        <SelectItem value="Mexico">México</SelectItem>
                        <SelectItem value="Argentina">Argentina</SelectItem>
                        <SelectItem value="Chile">Chile</SelectItem>
                        <SelectItem value="Peru">Perú</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Paso 2: Información de Pago */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Información de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Tarjeta</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          field.onChange(formatted);
                        }}
                        maxLength={19}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cardHolder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Titular</FormLabel>
                    <FormControl>
                      <Input placeholder="Como aparece en la tarjeta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Expiración</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="MM/YY"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatExpiryDate(e.target.value);
                            field.onChange(formatted);
                          }}
                          maxLength={5}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cvv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVV</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123"
                          type="password"
                          maxLength={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="saveInfo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Guardar información para futuras compras
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Paso 3: Confirmación */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Confirmar Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Revisa tu información antes de continuar
                </h3>
                <p className="text-gray-600 mb-6">
                  Tu pago será procesado de forma segura
                </p>
                
                <div className="text-left bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Email:</strong> {form.getValues('email')}</p>
                  <p><strong>Envío a:</strong> {form.getValues('address')}, {form.getValues('city')}</p>
                  <p><strong>Tarjeta:</strong> **** **** **** {form.getValues('cardNumber').slice(-4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={prevStep}>
              Anterior
            </Button>
          )}
          
          {step < 3 ? (
            <Button type="button" onClick={nextStep} className="ml-auto">
              Siguiente
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isProcessing}
              className="ml-auto"
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
