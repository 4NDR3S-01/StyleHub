-- ============================================
-- POLÍTICAS DE SEGURIDAD COMPLETAS PARA STYLEHUB
-- ============================================

-- Primero, agregar algunas tablas y campos faltantes
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address JSONB;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Crear tabla para carrito persistente
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  color TEXT,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para wishlist/favoritos
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Crear tabla para reseñas
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Crear tabla para cupones
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  minimum_amount NUMERIC DEFAULT 0,
  maximum_discount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para uso de cupones
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, order_id)
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE SEGURIDAD DETALLADAS
-- ============================================

-- POLÍTICAS PARA USUARIOS
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.users;

-- Los usuarios pueden ver y actualizar su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Solo admins pueden ver todos los usuarios
CREATE POLICY "Admins pueden ver todos los usuarios"
ON public.users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Solo admins pueden insertar nuevos usuarios
CREATE POLICY "Admins pueden crear usuarios"
ON public.users FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- POLÍTICAS PARA PRODUCTOS Y CATEGORÍAS (lectura pública, escritura solo admin)
CREATE POLICY "Todos pueden ver productos"
ON public.products FOR SELECT
TO PUBLIC USING (true);

CREATE POLICY "Solo admins pueden gestionar productos"
ON public.products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Todos pueden ver categorías"
ON public.categories FOR SELECT
TO PUBLIC USING (true);

CREATE POLICY "Solo admins pueden gestionar categorías"
ON public.categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Todos pueden ver variantes"
ON public.product_variants FOR SELECT
TO PUBLIC USING (true);

CREATE POLICY "Solo admins pueden gestionar variantes"
ON public.product_variants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- POLÍTICAS PARA ÓRDENES
CREATE POLICY "Usuarios pueden ver sus propias órdenes"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear órdenes"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins pueden ver todas las órdenes"
ON public.orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins pueden actualizar órdenes"
ON public.orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- POLÍTICAS PARA ITEMS DE ÓRDENES
CREATE POLICY "Usuarios pueden ver items de sus órdenes"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Usuarios pueden crear items de orden"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins pueden ver todos los items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- POLÍTICAS PARA CARRITO
CREATE POLICY "Usuarios pueden gestionar su carrito"
ON public.cart_items FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS PARA WISHLIST
CREATE POLICY "Usuarios pueden gestionar su wishlist"
ON public.wishlists FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS PARA RESEÑAS
CREATE POLICY "Todos pueden ver reseñas"
ON public.reviews FOR SELECT
TO PUBLIC USING (true);

CREATE POLICY "Usuarios pueden crear reseñas"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus reseñas"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus reseñas"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins pueden gestionar todas las reseñas"
ON public.reviews FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- POLÍTICAS PARA CUPONES
CREATE POLICY "Todos pueden ver cupones activos"
ON public.coupons FOR SELECT
TO PUBLIC USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Solo admins pueden gestionar cupones"
ON public.coupons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- POLÍTICAS PARA USO DE CUPONES
CREATE POLICY "Usuarios pueden ver su uso de cupones"
ON public.coupon_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden registrar uso de cupones"
ON public.coupon_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins pueden ver todo el uso de cupones"
ON public.coupon_usage FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar el stock después de una compra
CREATE OR REPLACE FUNCTION update_stock_after_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Reducir stock de las variantes
    UPDATE public.product_variants pv
    SET stock = pv.stock - oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id 
    AND oi.variant_id = pv.id
    AND pv.stock >= oi.quantity;
    
    -- Verificar si hay stock suficiente
    IF EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.product_variants pv ON oi.variant_id = pv.id
      WHERE oi.order_id = NEW.id AND pv.stock < 0
    ) THEN
      RAISE EXCEPTION 'Stock insuficiente para algunos productos';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock
DROP TRIGGER IF EXISTS update_stock_trigger ON public.orders;
CREATE TRIGGER update_stock_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_after_order();

-- Función para sincronizar usuario con auth.users
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, lastname, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'lastname', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear usuario en public.users cuando se registra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_sale ON public.products(sale) WHERE sale = true;
CREATE INDEX IF NOT EXISTS idx_products_name_search ON public.products USING gin(to_tsvector('spanish', name));
CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_stock ON public.product_variants(stock) WHERE stock > 0;

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista para productos con información de categoría
CREATE OR REPLACE VIEW products_with_category AS
SELECT 
  p.*,
  c.name as category_name,
  c.slug as category_slug,
  COALESCE(
    (SELECT AVG(rating) FROM public.reviews WHERE product_id = p.id), 
    0
  ) as average_rating,
  (SELECT COUNT(*) FROM public.reviews WHERE product_id = p.id) as review_count,
  (SELECT SUM(stock) FROM public.product_variants WHERE product_id = p.id) as total_stock
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id;

-- Vista para órdenes con información de usuario
CREATE OR REPLACE VIEW orders_with_user AS
SELECT 
  o.*,
  u.name as user_name,
  u.email as user_email,
  (SELECT COUNT(*) FROM public.order_items WHERE order_id = o.id) as item_count
FROM public.orders o
JOIN public.users u ON o.user_id = u.id;

-- Comentarios para documentación
COMMENT ON TABLE public.users IS 'Tabla de usuarios del sistema';
COMMENT ON TABLE public.products IS 'Tabla de productos de la tienda';
COMMENT ON TABLE public.categories IS 'Tabla de categorías de productos';
COMMENT ON TABLE public.orders IS 'Tabla de órdenes/pedidos';
COMMENT ON TABLE public.cart_items IS 'Tabla del carrito de compras persistente';
COMMENT ON TABLE public.wishlists IS 'Tabla de lista de deseos';
COMMENT ON TABLE public.reviews IS 'Tabla de reseñas de productos';
COMMENT ON TABLE public.coupons IS 'Tabla de cupones de descuento';

-- Otorgar permisos necesarios
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Permisos específicos para usuarios anónimos (solo lectura de productos/categorías)
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON products_with_category TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
