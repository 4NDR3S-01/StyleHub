import supabase from '@/lib/supabaseClient';
import type { User } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  lastname: string;
  phone?: string;
  role?: 'cliente' | 'admin';
}

export interface UpdateProfileData {
  name?: string;
  lastname?: string;
  phone?: string;
  avatar?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export class AuthService {
  /**
   * Iniciar sesión con email y contraseña
   */
  static async login({ email, password }: LoginCredentials) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Obtener datos adicionales del usuario
      if (data.user) {
        const userData = await this.getUserData(data.user.id);
        return {
          session: data.session,
          user: userData,
        };
      }

      return { session: data.session, user: null };
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  }

  /**
   * Registrar nuevo usuario
   */
  static async register(userData: RegisterData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            lastname: userData.lastname,
            phone: userData.phone || '',
            role: userData.role || 'cliente',
          },
        },
      });

      if (error) throw error;

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Error al registrar usuario');
    }
  }

  /**
   * Cerrar sesión
   */
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al cerrar sesión');
    }
  }

  /**
   * Obtener sesión actual
   */
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener sesión');
    }
  }

  /**
   * Obtener usuario actual
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return await this.getUserData(user.id);
    } catch (error: any) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Obtener datos del usuario desde la base de datos
   */
  static async getUserData(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as User;
    } catch (error: any) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Actualizar perfil de usuario
   */
  static async updateProfile(userId: string, updates: UpdateProfileData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as User;
    } catch (error: any) {
      throw new Error(error.message || 'Error al actualizar perfil');
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al cambiar contraseña');
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al enviar email de recuperación');
    }
  }

  /**
   * Verificar si el usuario actual es admin
   */
  static async isAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.role === 'admin';
    } catch {
      return false;
    }
  }

  /**
   * Escuchar cambios en la autenticación
   */
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userData = await this.getUserData(session.user.id);
        callback(userData);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Subir avatar de usuario
   */
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;
      const filePath = `users/${fileName}`;

      // Subir archivo (usando bucket correcto 'avatar')
      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatar')
        .getPublicUrl(filePath);

      // Actualizar usuario con nueva URL
      await this.updateProfile(userId, { avatar: publicUrl });

      return publicUrl;
    } catch (error: any) {
      throw new Error(error.message || 'Error al subir avatar');
    }
  }

  /**
   * Verificar email
   */
  static async verifyEmail(token: string) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al verificar email');
    }
  }

  /**
   * Reenviar verificación de email
   */
  static async resendVerification() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No hay usuario autenticado');

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al reenviar verificación');
    }
  }
}

export default AuthService;
