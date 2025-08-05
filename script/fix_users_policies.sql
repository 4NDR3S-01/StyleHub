-- =====================================================
-- SOLUCIÓN: POLÍTICAS RLS MEJORADAS PARA USERS
-- =====================================================

-- Deshabilitar RLS temporalmente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_auth" ON public.users;
DROP POLICY IF EXISTS "users_admin_select" ON public.users;
DROP POLICY IF EXISTS "users_admin_update" ON public.users;

-- NUEVA ESTRATEGIA: Crear función que verifica si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Verificar si el usuario actual es admin desde la tabla users
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear políticas mejoradas
-- 1. Los usuarios pueden ver y editar su propia información
CREATE POLICY "users_select_own" ON public.users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users 
FOR UPDATE USING (auth.uid() = id);

-- 2. Los administradores pueden ver TODOS los usuarios
CREATE POLICY "users_admin_select_all" ON public.users 
FOR SELECT USING (public.is_admin());

-- 3. Los administradores pueden actualizar TODOS los usuarios
CREATE POLICY "users_admin_update_all" ON public.users 
FOR UPDATE USING (public.is_admin());

-- 4. Permitir inserts para usuarios autenticados (registro)
CREATE POLICY "users_insert_auth" ON public.users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Re-habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verificar las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Probar la función is_admin()
SELECT 
  auth.uid() as current_user_id,
  public.is_admin() as is_admin_result,
  (SELECT role FROM public.users WHERE id = auth.uid()) as current_role;
