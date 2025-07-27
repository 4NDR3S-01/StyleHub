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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let sessionTimeout: NodeJS.Timeout | null = null;
    let inactivityTimeout: NodeJS.Timeout | null = null;

    const restoreSession = async () => {
      setIsLoading(true);
      sessionTimeout = setTimeout(() => {
        setUser(null);
        setIsLoading(false);
      }, 2500);
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
          });
        } else {
          setUser(null);
        }
      } finally {
        if (sessionTimeout) clearTimeout(sessionTimeout);
        setIsLoading(false);
      }
    };
    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoading(true);
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
        });
      } else {
        setUser(null);
      }
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
      if (sessionTimeout) clearTimeout(sessionTimeout);
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
      if (error || !data.user) throw new Error(error?.message || 'Inicio de sesión fallido');
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
            display_name: name,
          },
        },
      });
      if (error || !data.user) throw new Error(error?.message || 'Registro fallido');
      // No actualizar display_name manualmente ni iniciar sesión automáticamente
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