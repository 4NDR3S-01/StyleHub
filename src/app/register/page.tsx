'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import AuthHeader from '@/components/auth/AuthHeader';

const registerSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (password: string) => {
    setPasswordStrength(calculatePasswordStrength(password));
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return { text: 'Muy débil', color: 'text-red-500' };
      case 2:
        return { text: 'Débil', color: 'text-orange-500' };
      case 3:
        return { text: 'Media', color: 'text-yellow-500' };
      case 4:
        return { text: 'Fuerte', color: 'text-blue-500' };
      case 5:
        return { text: 'Muy fuerte', color: 'text-green-500' };
      default:
        return { text: '', color: '' };
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data.email, data.password, data.firstName, data.lastName);
      toast.success('¡Cuenta creada exitosamente! Revisa tu correo para confirmar tu cuenta.');
      // No redirigir inmediatamente, mostrar instrucciones
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Error registrando usuario:', error);
      
      // Manejar diferentes tipos de errores
      if (error.message.includes('already been registered')) {
        toast.error('Este email ya está registrado. Intenta iniciar sesión.');
      } else if (error.message.includes('Password should be at least')) {
        toast.error('La contraseña debe tener al menos 6 caracteres.');
      } else {
        toast.error(error.message || 'Error al crear la cuenta. Intenta nuevamente.');
      }
    }
  };

  return (
    <>
      <AuthHeader 
        title="Crear Cuenta" 
        subtitle="Únete a StyleHub y descubre moda increíble"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Formulario */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Crea tu cuenta
              </CardTitle>
              <p className="text-gray-600">
                Completa tus datos para comenzar
              </p>
            </CardHeader>
            <CardContent className="pt-0 px-8 pb-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Nombre y Apellido */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Nombre</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Tu nombre" 
                              className="h-12 border-gray-200 bg-white/50 focus:border-red-400 focus:ring-red-400 transition-all duration-200"
                              {...field} 
                            />
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
                          <FormLabel className="text-gray-700 font-medium">Apellido</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Tu apellido" 
                              className="h-12 border-gray-200 bg-white/50 focus:border-red-400 focus:ring-red-400 transition-all duration-200"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input 
                              placeholder="tu@email.com" 
                              className="pl-12 h-12 border-gray-200 bg-white/50 focus:border-red-400 focus:ring-red-400 transition-all duration-200"
                              type="email"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contraseña */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Tu contraseña"
                              className="pl-12 pr-12 h-12 border-gray-200 bg-white/50 focus:border-red-400 focus:ring-red-400 transition-all duration-200"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handlePasswordChange(e.target.value);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-red-400 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        
                        {/* Indicador de fuerza de contraseña */}
                        {field.value && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Fuerza de la contraseña</span>
                              <span className={getPasswordStrengthText().color}>
                                {getPasswordStrengthText().text}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  passwordStrength <= 1 ? 'bg-red-500' :
                                  passwordStrength === 2 ? 'bg-orange-500' :
                                  passwordStrength === 3 ? 'bg-yellow-500' :
                                  passwordStrength === 4 ? 'bg-blue-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirmar Contraseña */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Confirmar Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirma tu contraseña"
                              className="pl-12 pr-12 h-12 border-gray-200 bg-white/50 focus:border-red-400 focus:ring-red-400 transition-all duration-200"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-red-400 transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Botón de registro */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </Form>

              {/* Enlaces */}
              <div className="mt-6 text-center space-y-4">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes una cuenta?{' '}
                  <Link href="/login" className="text-red-400 hover:text-red-600 font-semibold transition-colors">
                    Inicia sesión aquí
                  </Link>
                </p>
                
                <p className="text-xs text-gray-500">
                  Al registrarte, aceptas nuestros{' '}
                  <Link href="/terminos" className="text-red-400 hover:text-red-600 transition-colors">
                    Términos de Servicio
                  </Link>{' '}
                  y{' '}
                  <Link href="/privacidad" className="text-red-400 hover:text-red-600 transition-colors">
                    Política de Privacidad
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
