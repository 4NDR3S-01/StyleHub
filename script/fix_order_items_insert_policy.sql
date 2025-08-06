-- Fix order_items INSERT policy for RLS
-- Permitir insertar order_items para usuarios autenticados

-- Crear política temporal más permisiva para INSERT en order_items
CREATE POLICY "Authenticated users can insert order items" 
  ON public.order_items 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Verificar las políticas actuales
SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'order_items' AND schemaname = 'public';
