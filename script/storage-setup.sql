-- Configuración de Storage Buckets para StyleHub
-- Ejecutar estos comandos en Supabase SQL Editor

-- 1. Crear bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- 2. Crear bucket para imágenes de categorías
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- 3. Crear bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  1048576, -- 1MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- 4. Políticas de Storage para imágenes de productos
-- Permitir lectura pública
CREATE POLICY "Lectura pública de imágenes de productos" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Permitir subida solo a usuarios autenticados (admins)
CREATE POLICY "Solo admins pueden subir imágenes de productos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid()::text IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Permitir actualización solo a usuarios autenticados (admins)
CREATE POLICY "Solo admins pueden actualizar imágenes de productos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Permitir eliminación solo a usuarios autenticados (admins)
CREATE POLICY "Solo admins pueden eliminar imágenes de productos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- 5. Políticas de Storage para imágenes de categorías
-- Permitir lectura pública
CREATE POLICY "Lectura pública de imágenes de categorías" ON storage.objects
FOR SELECT USING (bucket_id = 'category-images');

-- Permitir subida solo a admins
CREATE POLICY "Solo admins pueden subir imágenes de categorías" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'category-images' 
  AND auth.uid()::text IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Permitir actualización solo a admins
CREATE POLICY "Solo admins pueden actualizar imágenes de categorías" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'category-images' 
  AND auth.uid()::text IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Permitir eliminación solo a admins
CREATE POLICY "Solo admins pueden eliminar imágenes de categorías" ON storage.objects
FOR DELETE USING (
  bucket_id = 'category-images' 
  AND auth.uid()::text IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- 6. Políticas de Storage para avatares
-- Permitir lectura pública
CREATE POLICY "Lectura pública de avatares" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Permitir que los usuarios suban su propio avatar
CREATE POLICY "Los usuarios pueden subir su propio avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que los usuarios actualicen su propio avatar
CREATE POLICY "Los usuarios pueden actualizar su propio avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que los usuarios eliminen su propio avatar
CREATE POLICY "Los usuarios pueden eliminar su propio avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. Función para limpiar archivos huérfanos
CREATE OR REPLACE FUNCTION clean_orphaned_images()
RETURNS void AS $$
BEGIN
  -- Eliminar imágenes de productos que no tienen productos asociados
  DELETE FROM storage.objects 
  WHERE bucket_id = 'product-images' 
  AND name NOT IN (
    SELECT UNNEST(images) 
    FROM products 
    WHERE images IS NOT NULL
  );

  -- Eliminar imágenes de categorías que no tienen categorías asociadas
  DELETE FROM storage.objects 
  WHERE bucket_id = 'category-images' 
  AND name NOT IN (
    SELECT image 
    FROM categories 
    WHERE image IS NOT NULL
  );

  -- Eliminar avatares de usuarios que no existen
  DELETE FROM storage.objects 
  WHERE bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] NOT IN (
    SELECT id 
    FROM users
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para optimizar almacenamiento
CREATE OR REPLACE FUNCTION storage_stats()
RETURNS TABLE (
  bucket_name TEXT,
  file_count BIGINT,
  total_size BIGINT,
  avg_size NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bucket_id as bucket_name,
    COUNT(*) as file_count,
    SUM(COALESCE(metadata->>'size', '0')::BIGINT) as total_size,
    AVG(COALESCE(metadata->>'size', '0')::BIGINT) as avg_size
  FROM storage.objects
  GROUP BY bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Triggers para mantener sincronización
-- Trigger para eliminar imágenes cuando se elimina un producto
CREATE OR REPLACE FUNCTION delete_product_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar todas las imágenes asociadas al producto
  IF OLD.images IS NOT NULL THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'product-images' 
    AND name = ANY(OLD.images);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_delete_product_images
  AFTER DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION delete_product_images();

-- Trigger para eliminar imagen cuando se elimina una categoría
CREATE OR REPLACE FUNCTION delete_category_image()
RETURNS TRIGGER AS $$
BEGIN
  -- Eliminar imagen asociada a la categoría
  IF OLD.image IS NOT NULL THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'category-images' 
    AND name = OLD.image;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_delete_category_image
  AFTER DELETE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION delete_category_image();

-- 10. Habilitar RLS en storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Comentarios de documentación
COMMENT ON FUNCTION clean_orphaned_images() IS 'Elimina archivos de storage que no tienen referencias en la base de datos';
COMMENT ON FUNCTION storage_stats() IS 'Proporciona estadísticas de uso de storage por bucket';
COMMENT ON FUNCTION delete_product_images() IS 'Elimina automáticamente las imágenes cuando se elimina un producto';
COMMENT ON FUNCTION delete_category_image() IS 'Elimina automáticamente la imagen cuando se elimina una categoría';
