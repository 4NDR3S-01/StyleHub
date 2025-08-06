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
  refreshUser: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper para obtener datos del usuario desde public.users
  const fetchUserFromDB = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log(`[AuthContext] Fetch user ${userId}:`, { data, error });
      return { data, error };
    } catch (error) {
      console.error('[AuthContext] Error fetching user:', error);
      return { data: null, error: error as Error };
    }
  };

  // Helper para crear usuario en public.users
  const createUserInDB = async (authUser: any) => {
    try {
      const isEmailVerified = !!authUser.email_confirmed_at;
      const userData = {
        id: authUser.id,
        email: authUser.email ?? '',
        name: authUser.user_metadata?.name ?? '',
        lastname: authUser.user_metadata?.lastname ?? '',
        avatar: authUser.user_metadata?.avatar_url ?? '',
        role: 'cliente' as const,
        email_verified: isEmailVerified,
        phone: '',
        last_login: new Date().toISOString(),
        login_count: 1,
        account_status: 'active' as const,
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log(`[AuthContext] Creating new user:`, { id: authUser.id, email: authUser.email });

      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      // No logeamos errores de insert porque el trigger de la DB maneja la creación automáticamente
      // Los errores aquí son esperados cuando el usuario ya existe
      if (!error && data) {
        console.log(`[AuthContext] User created successfully:`, { id: data?.id, email: data?.email });
      }

      return { error, data };
    } catch (error) {
      console.error('[AuthContext] Unexpected error creating user:', error);
      return { error: error as Error, data: null };
    }
  };

  // Helper para construir el objeto User a partir de los datos
  const buildUserObject = (dbData: any, authData: any): User => {
    const authEmailVerified = !!authData.email_confirmed_at;
    
    return {
      id: dbData?.id ?? authData.id,
      email: dbData?.email ?? authData.email ?? '',
      name: dbData?.name ?? authData.user_metadata?.name ?? '',
      lastname: dbData?.lastname ?? authData.user_metadata?.lastname ?? '',
      avatar: dbData?.avatar ?? authData.user_metadata?.avatar_url ?? '',
      role: (dbData?.role ?? 'cliente') as 'admin' | 'cliente',
      phone: dbData?.phone ?? '',
      email_verified: authEmailVerified,
      last_login: dbData?.last_login ?? '',
      login_count: dbData?.login_count ?? 0,
      account_status: (dbData?.account_status ?? 'active') as 'active' | 'suspended' | 'deactivated',
      preferences: dbData?.preferences ?? {},
      created_at: dbData?.created_at ?? '',
      updated_at: dbData?.updated_at ?? '',
      user_metadata: {
        name: authData.user_metadata?.name,
        lastname: authData.user_metadata?.lastname,
        avatar_url: authData.user_metadata?.avatar_url,
        role: authData.user_metadata?.role,
      },
    };
  };

  // Helper para sincronizar email_verified
  const syncEmailVerified = async (userId: string, authEmailVerified: boolean) => {
    try {
      await supabase
        .from('users')
        .update({ 
          email_verified: authEmailVerified,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      console.log(`[AuthContext] Synced email_verified for ${userId}:`, authEmailVerified);
    } catch (error) {
      console.error('[AuthContext] Error syncing email_verified:', error);
    }
  };

  // Helper principal para cargar y configurar el usuario
  const loadUser = async (authUser: any) => {
    try {
      setIsLoading(true);
      
      console.log(`[AuthContext] Loading user:`, authUser.id);
      
      // 1. Obtener datos de public.users
      let { data: dbData, error: dbError } = await fetchUserFromDB(authUser.id);
      
      console.log(`[AuthContext] Initial DB fetch result:`, {
        hasData: !!dbData,
        hasError: !!dbError,
        errorMessage: dbError?.message
      });
      
      // 2. Si no existe en public.users, verificar y crear el registro solo si es necesario
      if (dbError || !dbData) {
        console.log(`[AuthContext] User not found in DB, checking if user needs to be created for ${authUser.id}`);
        
        // Verificar una vez más si el usuario existe (podría haber sido creado por trigger)
        const { data: existingUser, error: recheckError } = await fetchUserFromDB(authUser.id);
        
        if (!recheckError && existingUser) {
          console.log(`[AuthContext] User found on recheck, using existing data`);
          dbData = existingUser;
        } else {
          // Solo crear si realmente no existe
          console.log(`[AuthContext] User confirmed not exists, creating new user`);
          const { error: createError } = await createUserInDB(authUser);
          
          // Solo logear errores reales con mensaje
          if (createError?.message && createError.message.trim() !== '') {
            console.log(`[AuthContext] Create error:`, createError);
          }
          
          // Obtener datos después de crear
          const { data: newData } = await fetchUserFromDB(authUser.id);
          dbData = newData || null;
        }
        
        if (!dbData) {
          console.log('[AuthContext] No DB data available, using auth data only');
        }
      }
      
      // 3. Sincronizar email_verified si es necesario
      const authEmailVerified = !!authUser.email_confirmed_at;
      if (dbData && dbData.email_verified !== authEmailVerified) {
        await syncEmailVerified(authUser.id, authEmailVerified);
        dbData.email_verified = authEmailVerified;
      }
      
      // 4. Construir y establecer el objeto usuario
      const userObject = buildUserObject(dbData, authUser);
      setUser(userObject);
      
      console.log('[AuthContext] User loaded successfully:', userObject);
      
    } catch (error) {
      console.error('[AuthContext] Error loading user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Restaurar sesión al cargar
    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Session error:', error);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          await loadUser(session.user);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[AuthContext] Session restoration error:', error);
        setUser(null);
        setIsLoading(false);
      }
    };

    restoreSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Auth state changed: ${event}`);
      
      if (session?.user) {
        await loadUser(session.user);
      } else {
        setUser(null);
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
        if (error.message?.toLowerCase().includes('email not confirmed') || 
            error.message?.toLowerCase().includes('email no confirmado')) {
          throw new Error('Email no confirmado');
        }
        throw new Error(error.message || 'Inicio de sesión fallido');
      }
      
      if (!data.user) {
        throw new Error('No se pudo autenticar al usuario');
      }
      
      // Actualizar estadísticas de login en background
      try {
        const currentTime = new Date().toISOString();
        const { data: currentUser } = await supabase
          .from('users')
          .select('login_count')
          .eq('id', data.user.id)
          .single();
        
        const newLoginCount = (currentUser?.login_count || 0) + 1;
        
        await supabase
          .from('users')
          .update({ 
            last_login: currentTime,
            login_count: newLoginCount,
            updated_at: currentTime
          })
          .eq('id', data.user.id);
      } catch (updateError) {
        console.error('[AuthContext] Error updating login stats:', updateError);
      }

      // Manejar redirección después del login exitoso
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        // Usar setTimeout para asegurar que el contexto de autenticación se actualice primero
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
      
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error?.message || 'Inicio de sesión fallido');
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
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Formato de email inválido.');
      }
      
      // Validar fortaleza de contraseña
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
      setIsLoading(false);
      throw new Error(error?.message || 'Registro fallido');
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] Logout error:', error);
      }
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
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
      setIsLoading(false);
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
      setIsLoading(false);
      throw new Error(error?.message || 'No se pudo reenviar el correo de verificación');
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (newPassword: string) => {
    setIsLoading(true);
    try {
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }
      
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('[AuthContext] Password changed successfully');
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error?.message || 'No se pudo cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Obtener datos actualizados de la BD
      const { data: dbData, error } = await fetchUserFromDB(user.id);
      
      if (!error && dbData) {
        // Obtener el estado actual de autenticación para email_verified
        const { data: { session } } = await supabase.auth.getSession();
        const authEmailVerified = !!session?.user?.email_confirmed_at;
        
        // Actualizar email_verified si es necesario
        if (dbData.email_verified !== authEmailVerified) {
          await syncEmailVerified(user.id, authEmailVerified);
          dbData.email_verified = authEmailVerified;
        }
        
        // Construir y establecer el objeto usuario actualizado
        const updatedUser = buildUserObject(dbData, session?.user);
        setUser(updatedUser);
        
        console.log('[AuthContext] User refreshed successfully:', updatedUser);
      }
    } catch (error) {
      console.error('[AuthContext] Error refreshing user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue = React.useMemo(
    () => ({ user, login, register, logout, isLoading, resetPassword, resendVerification, refreshUser, changePassword }),
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
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}