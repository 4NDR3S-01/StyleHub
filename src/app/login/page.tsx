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
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import supabase from '@/lib/supabaseClient';
import AuthHeader from '@/components/auth/AuthHeader';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState('');

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleResendVerification = async () => {
    if (!emailForVerification) {
      toast.error('Ingresa tu email para reenviar la verificación');
      return;
    }

    try {
      const { error } = await supabase.auth.resend({ 
        type: 'signup', 
        email: emailForVerification,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Correo de verificación reenviado. Revisa tu bandeja de entrada.');
    } catch (error: any) {
      console.error('Error reenviando verificación:', error);
      toast.error('Error al reenviar verificación: ' + error.message);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success('¡Bienvenido de vuelta!');
      
      // Esperar un momento para que el contexto se actualice con el usuario
      setTimeout(async () => {
        try {
          // Realizar consulta a la base de datos para obtener el rol
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('email', data.email)
            .single();
          
          if (userData?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/');
          }
        } catch (error) {
          // Si hay error obteniendo el rol, redirigir al inicio por defecto
          router.push('/');
        }
      }, 500);
    } catch (error: any) {
      console.error('Error iniciando sesión:', error);
      
      // Guardar email para posible reenvío de verificación
      setEmailForVerification(data.email);
      
      // Manejar diferentes tipos de errores
      if (error.message.includes('confirmar tu email')) {
        toast.error('Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else {
        toast.error(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      }
    }
  };

  return (
    <>
      <AuthHeader 
        title="Iniciar Sesión" 
        subtitle="Bienvenido de vuelta a StyleHub"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Formulario */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Accede a tu cuenta
              </CardTitle>
              <p className="text-gray-600">
                Ingresa tus credenciales para continuar
              </p>
            </CardHeader>
            <CardContent className="pt-0 px-8 pb-8">
              <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            className="pl-12 h-12 border-gray-200 bg-white/50 focus:border-[#d7263d] focus:ring-[#d7263d] transition-all duration-200"
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
                            className="pl-12 pr-12 h-12 border-gray-200 bg-white/50 focus:border-[#d7263d] focus:ring-[#d7263d] transition-all duration-200"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-[#d7263d] transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Enlace de recuperación de contraseña */}
                <div className="text-right">
                  <Link 
                    href="/reset-password" 
                    className="text-sm text-[#d7263d] hover:text-[#ff6f61] font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* Botón de login */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] hover:from-[#ff5a4d] hover:via-[#c01e2a] hover:to-[#1a1a1a] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </Form>

            {/* Sección de reenvío de verificación */}
            {emailForVerification && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 mb-3">
                  ¿No has recibido el email de verificación?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  className="w-full text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-all duration-200"
                >
                  Reenviar correo de verificación
                </Button>
              </div>
            )}

            {/* Enlaces */}
            <div className="mt-6 text-center space-y-4">
              <p className="text-sm text-gray-600">
                ¿No tienes una cuenta?{' '}
                <Link href="/register" className="text-[#d7263d] hover:text-[#ff6f61] font-semibold transition-colors">
                  Regístrate aquí
                </Link>
              </p>
              

              
              <p className="text-xs text-gray-500 mt-6">
                Al iniciar sesión, aceptas nuestros{' '}
                <Link href="/terminos" className="text-[#d7263d] hover:text-[#ff6f61] transition-colors">
                  Términos de Servicio
                </Link>{' '}
                y{' '}
                <Link href="/privacidad" className="text-[#d7263d] hover:text-[#ff6f61] transition-colors">
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
