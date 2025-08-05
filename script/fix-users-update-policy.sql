-- =====================================================
-- VERIFICAR Y CORREGIR POLÍTICAS RLS PARA UPDATES EN USERS
-- =====================================================

-- Ver las políticas actuales para la tabla users
SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Ver si hay algún problema con la política de UPDATE
-- Vamos a recrear la política de UPDATE de forma más explícita

-- Eliminar la política actual de UPDATE
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Crear una nueva política de UPDATE más explícita
CREATE POLICY "users_can_update_own_data" ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verificar que la política se creó correctamente
SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public' 
AND cmd = 'UPDATE';

-- Test de la política con un query de ejemplo (reemplaza 'tu-user-id' con tu ID real)
-- SELECT auth.uid(); -- Para ver tu user ID actual

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
