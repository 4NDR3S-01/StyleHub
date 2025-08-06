-- Eliminar políticas existentes de reviews que pueden estar causando conflictos
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
DROP POLICY IF EXISTS "Users can read own reviews" ON public.reviews;

-- Crear nueva política clara para lectura pública de reseñas aprobadas
CREATE POLICY "Public can read approved reviews" ON public.reviews 
FOR SELECT 
USING (approved = true);

-- Crear política para que usuarios autenticados puedan leer sus propias reseñas (aunque no estén aprobadas)
CREATE POLICY "Users can read own reviews" ON public.reviews 
FOR SELECT 
USING (auth.uid() = user_id);
