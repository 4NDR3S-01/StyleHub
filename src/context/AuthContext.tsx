'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new Error(error?.message || 'Login fallido');
      // Obtener el rol desde la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
      if (userError) throw new Error(userError.message);
      setUser({
        id: data.user.id,
        email: data.user.email ?? '',
        name: data.user.user_metadata?.name ?? '',
        avatar: data.user.user_metadata?.avatar_url ?? '',
        role: userData?.role ?? 'cliente',
      });
    } catch (error: any) {
      throw new Error(error?.message || 'Login fallido');
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