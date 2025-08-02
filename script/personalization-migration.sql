-- Script de migración completo para el sistema de personalización de StyleHub
-- Ejecutar después de crear las tablas principales (bd.sql)

-- Verificar que existe la tabla users antes de crear las políticas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'La tabla users debe existir antes de crear las tablas de personalización';
    END IF;
END
$$;

-- Tabla para configuración de temas
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  colors jsonb NOT NULL,
  is_active boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla para configuración de branding/logos
CREATE TABLE IF NOT EXISTS public.branding_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  main_logo text,
  favicon text,
  footer_logo text,
  email_logo text,
  brand_name text DEFAULT 'StyleHub',
  tagline text DEFAULT 'Tu estilo, nuestra pasión',
  description text DEFAULT 'Descubre las últimas tendencias en moda y estilo',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla para banners promocionales
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  image text NOT NULL,
  link text,
  button_text text,
  position text NOT NULL CHECK (position IN ('hero', 'top', 'middle', 'bottom')),
  active boolean DEFAULT true,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla para configuración del footer
CREATE TABLE IF NOT EXISTS public.footer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text DEFAULT 'StyleHub',
  description text DEFAULT 'Tu destino para la moda y el estilo',
  address text,
  phone text,
  email text,
  copyright text DEFAULT '© 2025 Todos los derechos reservados.',
  show_newsletter boolean DEFAULT true,
  newsletter_title text DEFAULT 'Suscríbete a nuestro newsletter',
  newsletter_description text DEFAULT 'Recibe las últimas noticias y ofertas especiales',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla para enlaces del footer
CREATE TABLE IF NOT EXISTS public.footer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  category text NOT NULL,
  external boolean DEFAULT false,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabla para redes sociales
CREATE TABLE IF NOT EXISTS public.social_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
DROP POLICY IF EXISTS "Lectura pública de temas" ON public.theme_settings;
CREATE POLICY "Lectura pública de temas" ON public.theme_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública de branding" ON public.branding_settings;
CREATE POLICY "Lectura pública de branding" ON public.branding_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública de banners" ON public.banners;
CREATE POLICY "Lectura pública de banners" ON public.banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública de footer" ON public.footer_settings;
CREATE POLICY "Lectura pública de footer" ON public.footer_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública de footer_links" ON public.footer_links;
CREATE POLICY "Lectura pública de footer_links" ON public.footer_links FOR SELECT USING (true);

DROP POLICY IF EXISTS "Lectura pública de social_media" ON public.social_media;
CREATE POLICY "Lectura pública de social_media" ON public.social_media FOR SELECT USING (true);

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de administración usando la función
-- Theme settings
DROP POLICY IF EXISTS "Solo admin puede insertar temas" ON public.theme_settings;
CREATE POLICY "Solo admin puede insertar temas" ON public.theme_settings 
FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede actualizar temas" ON public.theme_settings;
CREATE POLICY "Solo admin puede actualizar temas" ON public.theme_settings 
FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede eliminar temas" ON public.theme_settings;
CREATE POLICY "Solo admin puede eliminar temas" ON public.theme_settings 
FOR DELETE USING (public.is_admin());

-- Branding settings
DROP POLICY IF EXISTS "Solo admin puede insertar branding" ON public.branding_settings;
CREATE POLICY "Solo admin puede insertar branding" ON public.branding_settings 
FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede actualizar branding" ON public.branding_settings;
CREATE POLICY "Solo admin puede actualizar branding" ON public.branding_settings 
FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede eliminar branding" ON public.branding_settings;
CREATE POLICY "Solo admin puede eliminar branding" ON public.branding_settings 
FOR DELETE USING (public.is_admin());

-- Banners
DROP POLICY IF EXISTS "Solo admin puede insertar banners" ON public.banners;
CREATE POLICY "Solo admin puede insertar banners" ON public.banners 
FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede actualizar banners" ON public.banners;
CREATE POLICY "Solo admin puede actualizar banners" ON public.banners 
FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede eliminar banners" ON public.banners;
CREATE POLICY "Solo admin puede eliminar banners" ON public.banners 
FOR DELETE USING (public.is_admin());

-- Footer settings
DROP POLICY IF EXISTS "Solo admin puede insertar footer" ON public.footer_settings;
CREATE POLICY "Solo admin puede insertar footer" ON public.footer_settings 
FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede actualizar footer" ON public.footer_settings;
CREATE POLICY "Solo admin puede actualizar footer" ON public.footer_settings 
FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede eliminar footer" ON public.footer_settings;
CREATE POLICY "Solo admin puede eliminar footer" ON public.footer_settings 
FOR DELETE USING (public.is_admin());

-- Footer links
DROP POLICY IF EXISTS "Solo admin puede insertar footer_links" ON public.footer_links;
CREATE POLICY "Solo admin puede insertar footer_links" ON public.footer_links 
FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede actualizar footer_links" ON public.footer_links;
CREATE POLICY "Solo admin puede actualizar footer_links" ON public.footer_links 
FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede eliminar footer_links" ON public.footer_links;
CREATE POLICY "Solo admin puede eliminar footer_links" ON public.footer_links 
FOR DELETE USING (public.is_admin());

-- Social media
DROP POLICY IF EXISTS "Solo admin puede insertar social_media" ON public.social_media;
CREATE POLICY "Solo admin puede insertar social_media" ON public.social_media 
FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede actualizar social_media" ON public.social_media;
CREATE POLICY "Solo admin puede actualizar social_media" ON public.social_media 
FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede eliminar social_media" ON public.social_media;
CREATE POLICY "Solo admin puede eliminar social_media" ON public.social_media 
FOR DELETE USING (public.is_admin());

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_theme_settings_updated_at ON public.theme_settings;
CREATE TRIGGER update_theme_settings_updated_at 
BEFORE UPDATE ON public.theme_settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_branding_settings_updated_at ON public.branding_settings;
CREATE TRIGGER update_branding_settings_updated_at 
BEFORE UPDATE ON public.branding_settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at 
BEFORE UPDATE ON public.banners 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_footer_settings_updated_at ON public.footer_settings;
CREATE TRIGGER update_footer_settings_updated_at 
BEFORE UPDATE ON public.footer_settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos iniciales solo si no existen
INSERT INTO public.theme_settings (name, colors, is_active, is_default) 
SELECT 'StyleHub Clásico', 
       '{"primary": "#dc2626", "secondary": "#f59e0b", "accent": "#10b981", "neutral": "#6b7280", "background": "#ffffff", "text": "#111827"}'::jsonb, 
       true, 
       true
WHERE NOT EXISTS (SELECT 1 FROM public.theme_settings WHERE is_default = true);

INSERT INTO public.branding_settings (brand_name, tagline, description) 
SELECT 'StyleHub', 'Tu estilo, nuestra pasión', 'Descubre las últimas tendencias en moda y estilo'
WHERE NOT EXISTS (SELECT 1 FROM public.branding_settings);

INSERT INTO public.footer_settings (company_name, description, copyright) 
SELECT 'StyleHub', 'Tu destino para la moda y el estilo. Descubre las últimas tendencias y encuentra tu look perfecto.', '© 2025 Todos los derechos reservados.'
WHERE NOT EXISTS (SELECT 1 FROM public.footer_settings);

-- Insertar enlaces del footer solo si no existen
INSERT INTO public.footer_links (title, url, category, external, active, sort_order) 
SELECT 'Sobre Nosotros', '/about', 'Empresa', false, true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.footer_links WHERE url = '/about');

INSERT INTO public.footer_links (title, url, category, external, active, sort_order) 
SELECT 'Contacto', '/contact', 'Empresa', false, true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.footer_links WHERE url = '/contact');

INSERT INTO public.footer_links (title, url, category, external, active, sort_order) 
SELECT 'Términos y Condiciones', '/terms', 'Legal', false, true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.footer_links WHERE url = '/terms');

INSERT INTO public.footer_links (title, url, category, external, active, sort_order) 
SELECT 'Política de Privacidad', '/privacy', 'Legal', false, true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.footer_links WHERE url = '/privacy');

INSERT INTO public.footer_links (title, url, category, external, active, sort_order) 
SELECT 'Envíos y Devoluciones', '/shipping', 'Ayuda', false, true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.footer_links WHERE url = '/shipping');

INSERT INTO public.footer_links (title, url, category, external, active, sort_order) 
SELECT 'FAQ', '/faq', 'Ayuda', false, true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.footer_links WHERE url = '/faq');

-- Insertar redes sociales solo si no existen
INSERT INTO public.social_media (platform, url, active) 
SELECT 'Facebook', 'https://facebook.com/stylehub', true
WHERE NOT EXISTS (SELECT 1 FROM public.social_media WHERE platform = 'Facebook');

INSERT INTO public.social_media (platform, url, active) 
SELECT 'Instagram', 'https://instagram.com/stylehub', true
WHERE NOT EXISTS (SELECT 1 FROM public.social_media WHERE platform = 'Instagram');

INSERT INTO public.social_media (platform, url, active) 
SELECT 'Twitter', 'https://twitter.com/stylehub', true
WHERE NOT EXISTS (SELECT 1 FROM public.social_media WHERE platform = 'Twitter');

INSERT INTO public.social_media (platform, url, active) 
SELECT 'Youtube', 'https://youtube.com/stylehub', true
WHERE NOT EXISTS (SELECT 1 FROM public.social_media WHERE platform = 'Youtube');

-- Confirmación
DO $$
BEGIN
    RAISE NOTICE 'Sistema de personalización instalado correctamente';
    RAISE NOTICE 'Tablas creadas: theme_settings, branding_settings, banners, footer_settings, footer_links, social_media';
    RAISE NOTICE 'Políticas de seguridad configuradas';
    RAISE NOTICE 'Datos iniciales insertados';
END
$$;
