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
import { Eye, EyeOff, Mail, Lock, ArrowLeft, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import supabase from '@/lib/supabaseClient';

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
      router.push('/');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <LogIn className="h-8 w-8 text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h1>
          
          <p className="text-gray-600">
            Bienvenido de vuelta a StyleHub
          </p>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Acceder a tu cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="tu@email.com" 
                            className="pl-10"
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
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Tu contraseña"
                            className="pl-10 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* Botón de login */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </Form>

            {/* Sección de reenvío de verificación */}
            {emailForVerification && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  ¿No has recibido el email de verificación?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                >
                  Reenviar correo de verificación
                </Button>
              </div>
            )}

            {/* Enlaces */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                ¿No tienes una cuenta?{' '}
                <Link href="/register" className="text-blue-600 hover:underline font-medium">
                  Regístrate aquí
                </Link>
              </p>
              
              {/* Separador */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">O continúa con</span>
                </div>
              </div>

              {/* Botones sociales (placeholder) */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" disabled className="w-full">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button variant="outline" disabled className="w-full">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                Al iniciar sesión, aceptas nuestros{' '}
                <Link href="/terminos" className="text-blue-600 hover:underline">
                  Términos de Servicio
                </Link>{' '}
                y{' '}
                <Link href="/privacidad" className="text-blue-600 hover:underline">
                  Política de Privacidad
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
