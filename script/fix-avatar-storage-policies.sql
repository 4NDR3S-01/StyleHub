-- =====================================================
-- VERIFICAR Y CONFIGURAR STORAGE POLICIES PARA AVATAR
-- =====================================================

-- Verificar que el bucket 'avatar' existe
SELECT id, name, public FROM storage.buckets WHERE id = 'avatar';

-- Si no existe, crearlo
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatar', 'avatar', true)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes para empezar limpio
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;

-- Política SIMPLE para acceso público de lectura
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatar');

-- Política SIMPLE para que usuarios autenticados puedan hacer todo con avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR ALL USING (bucket_id = 'avatar' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'avatar' AND auth.role() = 'authenticated');

-- Verificar que las políticas se crearon correctamente
SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND qual LIKE '%avatar%' OR with_check LIKE '%avatar%';
