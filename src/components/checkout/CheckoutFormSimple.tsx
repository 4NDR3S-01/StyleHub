'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, MapPin, Lock, CheckCircle } from 'lucide-react';
import { CartItem, User as UserType } from '@/types';
import { useCheckout } from '@/hooks/useCheckout';
import { checkCartStock } from '@/services/inventory.service';
import { toast } from 'sonner';

interface CheckoutFormSimpleProps {
  user: UserType | null;
  cartItems: CartItem[];
}

export function CheckoutFormSimple({ user, cartItems }: CheckoutFormSimpleProps) {
  const {
    form,
    step,
    isProcessing,
    onSubmit,
    nextStep,
    prevStep,
    formatCardNumber,
    formatExpiryDate,
    detectCardType
  } = useCheckout({ user, cartItems });

  // Validación mejorada para nextStep
  const handleNextStep = async () => {
    if (step === 1) {
      // Validar información de envío
      const shippingFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
      const values = form.getValues();
      const errors = shippingFields.filter(field => !values[field as keyof typeof values]);
      
      if (errors.length > 0) {
        toast.error(`Por favor completa todos los campos requeridos: ${errors.join(', ')}`);
        return;
      }
      
      // Validar formato de email
      const email = values.email;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error('Por favor ingresa un email válido');
        return;
      }
      
      // Verificar stock antes de continuar
      const stockChecks = await checkCartStock(cartItems);
      const stockIssues = stockChecks.filter(check => !check.isAvailable);
      
      if (stockIssues.length > 0) {
        toast.error('Algunos productos no tienen stock suficiente. Por favor revisa tu carrito.');
        return;
      }
      
      nextStep();
    } else if (step === 2) {
      // Validar datos de pago si es necesario
      const cardNumber = form.getValues('cardNumber');
      if (cardNumber && !validateCardNumber(cardNumber)) {
        toast.error('Número de tarjeta inválido');
        return;
      }
      
      nextStep();
    }
  };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        form.setError('email', { message: 'Email inválido' });
        return;
      }
      
      // Validar teléfono
      const phone = values.phone;
      if (!/^\+?[\d\s-()]{10,}$/.test(phone)) {
        form.setError('phone', { message: 'Teléfono inválido' });
        return;
      }
    }
    
    nextStep();
  };

  // Indicador de progreso
  const ProgressIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > stepNumber ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <span className={`ml-2 text-sm ${
                step >= stepNumber ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <FormLabel>Apellido *</FormLabel>
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
                      <FormLabel>Email *</FormLabel>
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
                      <FormLabel>Teléfono *</FormLabel>
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
                    <FormLabel>Dirección *</FormLabel>
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
                      <FormLabel>Ciudad *</FormLabel>
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
                      <FormLabel>Estado/Provincia *</FormLabel>
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
                      <FormLabel>Código Postal *</FormLabel>
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
                        <SelectItem value="Ecuador">Ecuador</SelectItem>
                        <SelectItem value="Venezuela">Venezuela</SelectItem>
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
                    <FormLabel className="flex items-center justify-between">
                      <span>Número de Tarjeta *</span>
                      {field.value && (
                        <Badge variant="outline" className="text-xs">
                          {detectCardType(field.value).toUpperCase()}
                        </Badge>
                      )}
                    </FormLabel>
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
                    <FormLabel>Nombre del Titular *</FormLabel>
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
                      <FormLabel>Fecha de Expiración *</FormLabel>
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
                      <FormLabel>CVV *</FormLabel>
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

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  🔒 Tu información de pago está protegida con encriptación SSL de 256 bits
                </p>
              </div>
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
              <div className="text-center py-4">
                <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Revisa tu información antes de continuar
                </h3>
                <p className="text-gray-600 mb-6">
                  Tu pago será procesado de forma segura
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
                  </div>
                  <div>
                    <p className="text-gray-600">Pago con Stripe</p>
                    <p className="font-medium">
                      {form.getValues('cardNumber') ? 
                        `**** **** **** ${form.getValues('cardNumber')?.slice(-4)}` : 
                        'Tarjeta de crédito/débito'
                      }
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
              type="submit"
              disabled={isProcessing}
              className="ml-auto"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Procesando...
                </div>
              ) : (
                'Confirmar Pago'
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
