-- Tablas para el sistema de personalización de StyleHub

-- Verificar que existe la tabla users antes de crear las políticas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'La tabla users debe existir antes de crear las tablas de personalización';
    END IF;
END
$$;

-- Tabla para configuración de temas
CREATE TABLE public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  colors jsonb NOT NULL,
  is_active boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabla para configuración de branding/logos
CREATE TABLE public.branding_settings (
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
CREATE TABLE public.banners (
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
CREATE TABLE public.footer_settings (
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
CREATE TABLE public.footer_links (
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
CREATE TABLE public.social_media (
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
CREATE POLICY "Lectura pública de temas" ON public.theme_settings FOR SELECT USING (true);
CREATE POLICY "Lectura pública de branding" ON public.branding_settings FOR SELECT USING (true);
CREATE POLICY "Lectura pública de banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Lectura pública de footer" ON public.footer_settings FOR SELECT USING (true);
CREATE POLICY "Lectura pública de footer_links" ON public.footer_links FOR SELECT USING (true);
CREATE POLICY "Lectura pública de social_media" ON public.social_media FOR SELECT USING (true);

-- Políticas de administración
-- Theme settings
CREATE POLICY "Solo admin puede insertar temas" ON public.theme_settings FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede actualizar temas" ON public.theme_settings FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede eliminar temas" ON public.theme_settings FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Branding settings
CREATE POLICY "Solo admin puede insertar branding" ON public.branding_settings FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede actualizar branding" ON public.branding_settings FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede eliminar branding" ON public.branding_settings FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Banners
CREATE POLICY "Solo admin puede insertar banners" ON public.banners FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede actualizar banners" ON public.banners FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede eliminar banners" ON public.banners FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Footer settings
CREATE POLICY "Solo admin puede insertar footer" ON public.footer_settings FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede actualizar footer" ON public.footer_settings FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede eliminar footer" ON public.footer_settings FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Footer links
CREATE POLICY "Solo admin puede insertar footer_links" ON public.footer_links FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede actualizar footer_links" ON public.footer_links FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede eliminar footer_links" ON public.footer_links FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Social media
CREATE POLICY "Solo admin puede insertar social_media" ON public.social_media FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede actualizar social_media" ON public.social_media FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Solo admin puede eliminar social_media" ON public.social_media FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_theme_settings_updated_at BEFORE UPDATE ON public.theme_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_branding_settings_updated_at BEFORE UPDATE ON public.branding_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_footer_settings_updated_at BEFORE UPDATE ON public.footer_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Datos iniciales
INSERT INTO public.theme_settings (name, colors, is_active, is_default) VALUES 
('StyleHub Clásico', '{"primary": "#dc2626", "secondary": "#f59e0b", "accent": "#10b981", "neutral": "#6b7280", "background": "#ffffff", "text": "#111827"}', true, true);

INSERT INTO public.branding_settings (brand_name, tagline, description) VALUES 
('StyleHub', 'Tu estilo, nuestra pasión', 'Descubre las últimas tendencias en moda y estilo');

INSERT INTO public.footer_settings (company_name, description, copyright) VALUES 
('StyleHub', 'Tu destino para la moda y el estilo. Descubre las últimas tendencias y encuentra tu look perfecto.', '© 2025 Todos los derechos reservados.');

INSERT INTO public.footer_links (title, url, category, external, active, sort_order) VALUES 
('Sobre Nosotros', '/about', 'Empresa', false, true, 1),
('Contacto', '/contact', 'Empresa', false, true, 2),
('Términos y Condiciones', '/terms', 'Legal', false, true, 1),
('Política de Privacidad', '/privacy', 'Legal', false, true, 2),
('Envíos y Devoluciones', '/shipping', 'Ayuda', false, true, 1),
('FAQ', '/faq', 'Ayuda', false, true, 2);

INSERT INTO public.social_media (platform, url, active) VALUES 
('Facebook', 'https://facebook.com/stylehub', true),
('Instagram', 'https://instagram.com/stylehub', true),
('Twitter', 'https://twitter.com/stylehub', true),
('Youtube', 'https://youtube.com/stylehub', true);
