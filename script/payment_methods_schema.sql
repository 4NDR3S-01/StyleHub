-- Tabla para métodos de pago guardados por usuarios
CREATE TABLE public.user_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'paypal')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  external_id TEXT NOT NULL, -- ID del método en Stripe o PayPal
  
  -- Información de tarjetas (solo para Stripe)
  card_last_four TEXT NULL,
  card_brand TEXT NULL,
  card_exp_month INTEGER NULL,
  card_exp_year INTEGER NULL,
  
  -- Información de PayPal
  paypal_email TEXT NULL,
  
  -- Configuración
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  nickname TEXT NULL, -- Nombre personalizado del usuario
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT user_payment_methods_external_id_unique UNIQUE (external_id),
  CONSTRAINT user_payment_methods_one_default_per_user UNIQUE (user_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_user_payment_methods_user_id ON public.user_payment_methods(user_id);
CREATE INDEX idx_user_payment_methods_active ON public.user_payment_methods(active) WHERE active = true;
CREATE INDEX idx_user_payment_methods_default ON public.user_payment_methods(user_id, is_default) WHERE is_default = true;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_payment_methods_updated_at 
  BEFORE UPDATE ON public.user_payment_methods 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver sus propios métodos de pago
CREATE POLICY "Users can view their own payment methods" 
  ON public.user_payment_methods 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden insertar sus propios métodos de pago
CREATE POLICY "Users can insert their own payment methods" 
  ON public.user_payment_methods 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar sus propios métodos de pago
CREATE POLICY "Users can update their own payment methods" 
  ON public.user_payment_methods 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden eliminar sus propios métodos de pago
CREATE POLICY "Users can delete their own payment methods" 
  ON public.user_payment_methods 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Insertar los métodos de pago disponibles en la tabla existente
INSERT INTO public.payment_methods (name, type, description, active, settings, sort_order) VALUES
('Stripe', 'stripe', 'Pago con tarjeta de crédito/débito a través de Stripe', true, '{"currencies": ["USD"], "payment_methods": ["card"]}', 1),
('PayPal', 'paypal', 'Pago rápido y seguro con PayPal', true, '{"currencies": ["USD"], "payment_methods": ["paypal"]}', 2)
ON CONFLICT DO NOTHING;
