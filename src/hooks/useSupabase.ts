import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SupabaseState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para consultas de Supabase con estado automático
 */
export function useSupabaseQuery<T>(
  tableName: string,
  query?: (queryBuilder: any) => any,
  dependencies: any[] = []
): SupabaseState<T[]> {
  const [state, setState] = useState<SupabaseState<T[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        let queryBuilder = supabase.from(tableName).select('*');
        
        if (query) {
          queryBuilder = query(queryBuilder);
        }
        
        const { data, error } = await queryBuilder;
        
        if (error) throw error;
        
        setState({
          data: data as T[],
          loading: false,
          error: null,
        });
      } catch (error: any) {
        setState({
          data: null,
          loading: false,
          error: error.message || 'Error al cargar datos',
        });
      }
    };

    fetchData();
  }, dependencies);

  return state;
}

/**
 * Hook para mutaciones de Supabase (insert, update, delete)
 */
export function useSupabaseMutation<T>() {
  const [state, setState] = useState<SupabaseState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = async (
    operation: 'insert' | 'update' | 'delete',
    tableName: string,
    data?: any,
    conditions?: Record<string, any>
  ) => {
    try {
      setState({ data: null, loading: true, error: null });
      
      let query: any;
      
      switch (operation) {
        case 'insert':
          query = supabase.from(tableName).insert(data).select();
          break;
        case 'update':
          query = supabase.from(tableName).update(data);
          if (conditions) {
            Object.entries(conditions).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          query = query.select();
          break;
        case 'delete':
          query = supabase.from(tableName).delete();
          if (conditions) {
            Object.entries(conditions).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          break;
        default:
          throw new Error('Operación no válida');
      }
      
      const { data: result, error } = await query;
      
      if (error) throw error;
      
      setState({
        data: result as T,
        loading: false,
        error: null,
      });
      
      return result;
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || 'Error en la operación',
      });
      throw error;
    }
  };

  return { ...state, mutate };
}

/**
 * Hook para autenticación de Supabase
 */
export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Obtener datos adicionales del usuario
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser(userData);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser(userData);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, isAuthenticated: !!user };
}

/**
 * Hook para suscripciones en tiempo real
 */
export function useSupabaseSubscription<T>(
  tableName: string,
  filter?: Record<string, any>,
  callback?: (payload: any) => void
) {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    let subscription = supabase
      .channel(`${tableName}-changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: tableName,
          ...(filter && { filter: Object.entries(filter).map(([key, value]) => `${key}=eq.${value}`).join(',') })
        }, 
        (payload) => {
          if (callback) {
            callback(payload);
          } else {
            // Manejo por defecto
            switch (payload.eventType) {
              case 'INSERT':
                setData(prev => [...prev, payload.new as T]);
                break;
              case 'UPDATE':
                setData(prev => prev.map(item => 
                  (item as any).id === payload.new.id ? payload.new as T : item
                ));
                break;
              case 'DELETE':
                setData(prev => prev.filter(item => 
                  (item as any).id !== payload.old.id
                ));
                break;
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tableName, JSON.stringify(filter), callback]);

  return data;
}

/**
 * Hook para manejo de archivos en Supabase Storage
 */
export function useSupabaseStorage(bucket: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, path: string, options?: { upsert?: boolean }) => {
    try {
      setUploading(true);
      setProgress(0);

      // Simular progreso (Supabase no proporciona progreso real)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, options);

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return { data, publicUrl };
    } catch (error: any) {
      throw new Error(error.message || 'Error al subir archivo');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const deleteFile = async (path: string) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Error al eliminar archivo');
    }
  };

  const getPublicUrl = (path: string) => {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  };

  return {
    uploadFile,
    deleteFile,
    getPublicUrl,
    uploading,
    progress,
  };
}

/**
 * Hook para paginación de datos
 */
export function useSupabasePagination<T>(
  tableName: string,
  pageSize: number = 10,
  orderBy?: { column: string; ascending?: boolean }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const loadPage = async (page: number) => {
    try {
      setLoading(true);
      
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(from, to);
      
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
      }
      
      const { data: result, error, count } = await query;
      
      if (error) throw error;
      
      setData(result as T[]);
      setTotal(count || 0);
      setCurrentPage(page);
      setHasMore((page + 1) * pageSize < (count || 0));
    } catch (error: any) {
      console.error('Error loading page:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (hasMore) {
      loadPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      loadPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    loadPage(page);
  };

  useEffect(() => {
    loadPage(0);
  }, [tableName, pageSize]);

  return {
    data,
    loading,
    currentPage,
    hasMore,
    total,
    totalPages: Math.ceil(total / pageSize),
    nextPage,
    prevPage,
    goToPage,
    refresh: () => loadPage(currentPage),
  };
}

export { supabase };
export default supabase;
