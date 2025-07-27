'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import supabase from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, surname: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Restaurar sesión y escuchar cambios de autenticación
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const getSession = async () => {
      setIsLoading(true);
      let finished = false;
      let sessionTimeout = setTimeout(() => {
        if (!finished) {
          setIsLoading(false);
          setUser(null); // Forzar user a null si no se restauró
        }
      }, 5000); // 5 segundos
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const { data: userDataDb } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();
          setUser({
            id: data.user.id,
            email: data.user.email ?? '',
            name: data.user.user_metadata?.name ?? '',
            avatar: data.user.user_metadata?.avatar_url ?? '',
            role: userDataDb?.role ?? 'cliente',
          });
        } else {
          setUser(null);
        }
      } finally {
        finished = true;
        setIsLoading(false);
        if (sessionTimeout) clearTimeout(sessionTimeout);
      }
    };
    getSession();

    // Listener de cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (session?.user) {
        const { data: userDataDb } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.name ?? '',
          avatar: session.user.user_metadata?.avatar_url ?? '',
          role: userDataDb?.role ?? 'cliente',
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cierre de sesión por inactividad
    let inactivityTimeout: NodeJS.Timeout;
    const resetTimer = () => {
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        logout();
        alert('Sesión cerrada por inactividad.');
      }, 1000 * 60 * 60); // 1 hora de inactividad
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
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
        .select('role')
        .eq('id', data.user.id)
        .single();
      setUser({
        id: data.user.id,
        email: data.user.email ?? '',
        name: data.user.user_metadata?.name ?? '',
        avatar: data.user.user_metadata?.avatar_url ?? '',
        role: userDataDb?.role ?? 'cliente',
      });
    } catch (error: any) {
      throw new Error(error?.message || 'Inicio de sesión fallido');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, surname: string, role: string = 'cliente') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, surname, role } }
      });
      if (error || !data.user) throw new Error(error?.message || 'Registro fallido');
      // Insertar el usuario en la tabla users con el rol recibido
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name,
          surname,
          role,
        });
      if (dbError) throw new Error(dbError.message);
      setUser({
        id: data.user.id,
        email: data.user.email ?? '',
        name: name,
        avatar: '',
        role,
      });
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

  const contextValue = React.useMemo(() => ({ user, login, register, logout, isLoading, resetPassword, resendVerification }), [user, isLoading]);

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
