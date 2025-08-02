-- ============================================
-- POLÍTICAS DE SEGURIDAD COMPLETAS PARA STYLEHUB
-- =====-- Solo admins pueden crear usuarios
CREATE POLICY "Admins pueden crear usuarios"
ON public.users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Solo admins pueden actualizar otros usuarios
CREATE POLICY "Admins pueden actualizar usuarios"
ON public.users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Solo admins pueden eliminar usuarios
CREATE POLICY "Admins pueden eliminar usuarios"
ON public.users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
