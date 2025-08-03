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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (session?.user) {
          const { data: userDataDb, error: userError } = await supabase
            .from('users')
            .select('role, lastname')
            .eq('id', session.user.id)
            .single();
            
          if (userError) {
            console.error('Error fetching user data:', userError);
            return;
          }
          
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
      } catch (error) {
        console.error('Session restoration error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      try {
        if (session?.user) {
          const { data: userDataDb, error: userError } = await supabase
            .from('users')
            .select('role, lastname')
            .eq('id', session.user.id)
            .single();
            
          if (userError) {
            console.error('Error fetching user data on auth change:', userError);
            return;
          }
          
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
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        throw new Error(error.message || 'Inicio de sesión fallido');
      }
      
      if (!data.user) {
        throw new Error('No se pudo autenticar al usuario');
      }
      
      // User data will be set by the auth state change listener
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
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Formato de email inválido.');
      }
      
      // Validate password strength
      if (password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres.');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`,
          data: {
            name: name.trim(),
            lastname: lastname.trim(),
            role: "cliente",
            display_name: name.trim(),
          },
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Registro fallido');
      }
      
      if (!data.user) {
        throw new Error('No se pudo crear el usuario');
      }
      
    } catch (error: any) {
      throw new Error(error?.message || 'Registro fallido');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      if (!email.trim()) {
        throw new Error('El email es requerido.');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(error?.message || 'No se pudo enviar el correo de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    setIsLoading(true);
    try {
      if (!user?.email) {
        throw new Error('No hay correo electrónico para reenviar verificación');
      }
      
      const { error } = await supabase.auth.resend({ 
        type: 'signup', 
        email: user.email 
      });
      
      if (error) {
        throw new Error(error.message);
      }
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