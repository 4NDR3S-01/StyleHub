'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import supabase from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    lastname: string,
    role?: string
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Iniciar en true para verificar sesión

  useEffect(() => {
    let inactivityTimeout: NodeJS.Timeout | null = null;

    const restoreSession = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const { data: userDataDb } = await supabase
            .from('users')
            .select('role, lastname')
            .eq('id', data.user.id)
            .single();
          setUser({
            id: data.user.id,
            email: data.user.email ?? '',
            name: data.user.user_metadata?.name ?? '',
            lastname: userDataDb?.lastname ?? '',
            avatar: data.user.user_metadata?.avatar_url ?? '',
            role: userDataDb?.role ?? 'cliente',
            user_metadata: {
              name: data.user.user_metadata?.name,
              avatar_url: data.user.user_metadata?.avatar_url,
            },
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error restaurando sesión:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Solo mostrar loading durante la transición inicial, no en cada cambio
      if (session?.user) {
        const { data: userDataDb } = await supabase
          .from('users')
          .select('role, lastname')
          .eq('id', session.user.id)
          .single();
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.name ?? '',
          lastname: userDataDb?.lastname ?? '',
          avatar: session.user.user_metadata?.avatar_url ?? '',
          role: userDataDb?.role ?? 'cliente',
          user_metadata: {
            name: session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url,
          },
        });
      } else {
        setUser(null);
      }
      // Solo marcar como loaded después de procesar la sesión
      setIsLoading(false);
    });

    const resetTimer = () => {
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(async () => {
        await logout();
        alert('Sesión cerrada por inactividad.');
      }, 1000 * 60 * 60);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      listener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Manejar específicamente el error de email no confirmado
        if (error.message === 'Email not confirmed') {
          throw new Error('Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
        }
        throw new Error(error.message);
      }
      
      if (!data.user) {
        throw new Error('Inicio de sesión fallido');
      }

      // Verificar si el usuario existe en la tabla users
      const { data: userDataDb, error: dbError } = await supabase
        .from('users')
        .select('role, lastname')
        .eq('id', data.user.id)
        .single();

      if (dbError && dbError.code === 'PGRST116') {
        // Usuario no existe en la tabla, crear entrada
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || '',
            lastname: data.user.user_metadata?.lastname || '',
            role: 'cliente',
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creando usuario en BD:', insertError);
        }
      }

      setUser({
        id: data.user.id,
        email: data.user.email ?? '',
        name: data.user.user_metadata?.name ?? '',
        lastname: userDataDb?.lastname ?? data.user.user_metadata?.lastname ?? '',
        avatar: data.user.user_metadata?.avatar_url ?? '',
        role: userDataDb?.role ?? 'cliente',
        user_metadata: {
          name: data.user.user_metadata?.name,
          avatar_url: data.user.user_metadata?.avatar_url,
        },
      });
    } catch (error: any) {
      throw new Error(error?.message || 'Inicio de sesión fallido');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    lastname: string,
    role: string = 'cliente'
  ) => {
    setIsLoading(true);
    try {
      if (!email || !password || !name || !lastname) {
        throw new Error('Todos los campos son obligatorios.');
      }
      
      // Registro con metadatos correctos
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`,
          data: {
            name,
            lastname,
            role: "cliente",
            display_name: `${name} ${lastname}`,
          },
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.user) {
        throw new Error('Error en el registro. Intenta nuevamente.');
      }

      // No iniciar sesión automáticamente hasta que se confirme el email
      console.log('Usuario registrado, esperando confirmación de email:', data.user.id);
      
    } catch (error: any) {
      throw new Error(error?.message || 'Registro fallido');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw new Error(error.message);
    } catch (error: any) {
      throw new Error(error?.message || 'No se pudo enviar el correo de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    setIsLoading(true);
    try {
      if (!user?.email) throw new Error('No hay correo electrónico para reenviar verificación');
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
      if (error) throw new Error(error.message);
    } catch (error: any) {
      throw new Error(error?.message || 'No se pudo reenviar el correo de verificación');
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue = React.useMemo(
    () => ({ user, login, register, logout, isLoading, resetPassword, resendVerification }),
    [user, isLoading]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}