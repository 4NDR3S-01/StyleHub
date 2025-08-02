-- Script para poblar la base de datos con datos de ejemplo

-- Primero, insertamos las categorías principales
INSERT INTO public.categories (name, slug, description, image) VALUES
('Mujeres', 'women', 'Ropa y accesorios para mujeres', 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'),
('Hombres', 'men', 'Ropa y accesorios para hombres', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'),
('Accesorios', 'accessories', 'Accesorios de moda', 'https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'),
('Zapatos', 'shoes', 'Calzado para todos', 'https://images.pexels.com/photos/2048548/pexels-photo-2048548.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1');

-- Obtener IDs de categorías para usar en productos
-- (Esto se hace automáticamente por UUID, pero necesitamos referencias)

-- Productos para hombres
INSERT INTO public.products (name, description, price, original_price, images, category_id, brand, gender, material, tags, featured, sale)
SELECT 
  'Camisa Casual de Algodón',
  'Camisa cómoda y elegante de algodón 100%, perfecta para uso diario',
  59.99,
  79.99,
  ARRAY['https://images.pexels.com/photos/1707828/pexels-photo-1707828.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
  c.id,
  'StyleHub',
  'masculino',
  'Algodón',
  ARRAY['camisa', 'casual', 'algodón'],
  true,
  true
FROM public.categories c WHERE c.slug = 'men';

INSERT INTO public.products (name, description, price, images, category_id, brand, gender, material, tags, featured, sale)
SELECT 
  'Jeans Clásicos',
  'Jeans de corte clásico con ajuste cómodo y diseño atemporal',
  89.99,
  ARRAY['https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
  c.id,
  'StyleHub',
  'masculino',
  'Mezclilla',
  ARRAY['jeans', 'casual', 'mezclilla'],
  true,
  false
FROM public.categories c WHERE c.slug = 'men';

INSERT INTO public.products (name, description, price, images, category_id, brand, gender, material, tags, featured, sale)
SELECT 
  'Buzo de Cuero Premium',
  'Buzo de cuero genuino con forro interno y diseño moderno',
  299.99,
  ARRAY['https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
  c.id,
  'StyleHub',
  'masculino',
  'Cuero',
  ARRAY['buzo', 'cuero', 'premium'],
  true,
  false
FROM public.categories c WHERE c.slug = 'men';

-- Productos para mujeres
INSERT INTO public.products (name, description, price, original_price, images, category_id, brand, gender, material, tags, featured, sale)
SELECT 
  'Vestido Elegante de Verano',
  'Vestido ligero y elegante, perfecto para ocasiones especiales',
  129.99,
  159.99,
  ARRAY['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
  c.id,
  'StyleHub',
  'femenino',
  'Algodón',
  ARRAY['vestido', 'elegante', 'verano'],
  true,
  true
FROM public.categories c WHERE c.slug = 'women';

INSERT INTO public.products (name, description, price, images, category_id, brand, gender, material, tags, featured, sale)
SELECT 
  'Chaqueta de Mezclilla',
  'Chaqueta de mezclilla vintage con ajuste moderno',
  149.99,
  ARRAY['https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
  c.id,
  'StyleHub',
  'femenino',
  'Mezclilla',
  ARRAY['chaqueta', 'mezclilla', 'vintage'],
  true,
  false
FROM public.categories c WHERE c.slug = 'women';

INSERT INTO public.products (name, description, price, images, category_id, brand, gender, material, tags, featured, sale)
SELECT 
  'Suéter de Cachemira',
  'Suéter ultra suave de cachemira con ajuste relajado',
  249.99,
  ARRAY['https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
  c.id,
  'StyleHub',
  'femenino',
  'Cachemira',
  ARRAY['suéter', 'cachemira', 'lujo'],
  true,
  false
FROM public.categories c WHERE c.slug = 'women';

-- Accesorios
INSERT INTO public.products (name, description, price, original_price, images, category_id, brand, material, tags, featured, sale)
SELECT 
  'Reloj Elegante Plateado',
  'Reloj de pulsera elegante con acabado plateado y correa de cuero',
  199.99,
  259.99,
  ARRAY['https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
  c.id,
  'StyleHub',
  'Acero inoxidable',
  ARRAY['reloj', 'elegante', 'plateado'],
  true,
  true
FROM public.categories c WHERE c.slug = 'accessories';

INSERT INTO public.products (name, description, price, images, category_id, brand, material, tags, featured, sale)
SELECT 
  'Gafas de Sol Premium',
  'Gafas de sol con protección UV400 y marcos de alta calidad',
  89.99,
  ARRAY['https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
  c.id,
  'StyleHub',
  'Policarbonato',
  ARRAY['gafas', 'sol', 'premium'],
  true,
  false
FROM public.categories c WHERE c.slug = 'accessories';

-- Zapatos
INSERT INTO public.products (name, description, price, images, category_id, brand, gender, material, tags, featured, sale)
SELECT 
  'Sneakers Deportivos',
  'Zapatillas deportivas cómodas y estilosas para uso diario',
  129.99,
  ARRAY['https://images.pexels.com/photos/2048548/pexels-photo-2048548.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
  c.id,
  'StyleHub',
  'unisex',
  'Sintético',
  ARRAY['sneakers', 'deportivo', 'cómodo'],
  true,
  false
FROM public.categories c WHERE c.slug = 'shoes';

-- Ahora insertamos las variantes de productos
-- Para esto necesitamos los IDs de los productos, así que usamos subconsultas

-- Variantes para la camisa casual de algodón
INSERT INTO public.product_variants (product_id, color, size, stock, image)
SELECT 
  p.id,
  'Blanco',
  'S',
  15,
  'https://images.pexels.com/photos/1707828/pexels-photo-1707828.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'
FROM public.products p WHERE p.name = 'Camisa Casual de Algodón';

INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Blanco', 'M', 20 FROM public.products p WHERE p.name = 'Camisa Casual de Algodón';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Blanco', 'L', 18 FROM public.products p WHERE p.name = 'Camisa Casual de Algodón';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Blanco', 'XL', 12 FROM public.products p WHERE p.name = 'Camisa Casual de Algodón';

INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul', 'S', 10 FROM public.products p WHERE p.name = 'Camisa Casual de Algodón';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul', 'M', 15 FROM public.products p WHERE p.name = 'Camisa Casual de Algodón';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul', 'L', 12 FROM public.products p WHERE p.name = 'Camisa Casual de Algodón';

-- Variantes para jeans clásicos
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Oscuro', '30', 8 FROM public.products p WHERE p.name = 'Jeans Clásicos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Oscuro', '32', 12 FROM public.products p WHERE p.name = 'Jeans Clásicos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Oscuro', '34', 10 FROM public.products p WHERE p.name = 'Jeans Clásicos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Oscuro', '36', 6 FROM public.products p WHERE p.name = 'Jeans Clásicos';

INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', '30', 5 FROM public.products p WHERE p.name = 'Jeans Clásicos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', '32', 8 FROM public.products p WHERE p.name = 'Jeans Clásicos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', '34', 7 FROM public.products p WHERE p.name = 'Jeans Clásicos';

-- Variantes para buzo de cuero
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', 'M', 5 FROM public.products p WHERE p.name = 'Buzo de Cuero Premium';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', 'L', 3 FROM public.products p WHERE p.name = 'Buzo de Cuero Premium';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', 'XL', 2 FROM public.products p WHERE p.name = 'Buzo de Cuero Premium';

INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Marrón', 'M', 4 FROM public.products p WHERE p.name = 'Buzo de Cuero Premium';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Marrón', 'L', 2 FROM public.products p WHERE p.name = 'Buzo de Cuero Premium';

-- Variantes para vestido elegante
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Rosa', 'XS', 8 FROM public.products p WHERE p.name = 'Vestido Elegante de Verano';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Rosa', 'S', 12 FROM public.products p WHERE p.name = 'Vestido Elegante de Verano';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Rosa', 'M', 15 FROM public.products p WHERE p.name = 'Vestido Elegante de Verano';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Rosa', 'L', 10 FROM public.products p WHERE p.name = 'Vestido Elegante de Verano';

INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Claro', 'S', 6 FROM public.products p WHERE p.name = 'Vestido Elegante de Verano';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Claro', 'M', 8 FROM public.products p WHERE p.name = 'Vestido Elegante de Verano';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Claro', 'L', 5 FROM public.products p WHERE p.name = 'Vestido Elegante de Verano';

-- Variantes para chaqueta de mezclilla
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Claro', 'S', 10 FROM public.products p WHERE p.name = 'Chaqueta de Mezclilla';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Claro', 'M', 12 FROM public.products p WHERE p.name = 'Chaqueta de Mezclilla';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Claro', 'L', 8 FROM public.products p WHERE p.name = 'Chaqueta de Mezclilla';

INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Oscuro', 'S', 6 FROM public.products p WHERE p.name = 'Chaqueta de Mezclilla';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Azul Oscuro', 'M', 8 FROM public.products p WHERE p.name = 'Chaqueta de Mezclilla';

-- Variantes para suéter de cachemira
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Beige', 'S', 6 FROM public.products p WHERE p.name = 'Suéter de Cachemira';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Beige', 'M', 8 FROM public.products p WHERE p.name = 'Suéter de Cachemira';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Beige', 'L', 5 FROM public.products p WHERE p.name = 'Suéter de Cachemira';

INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Gris', 'S', 4 FROM public.products p WHERE p.name = 'Suéter de Cachemira';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Gris', 'M', 6 FROM public.products p WHERE p.name = 'Suéter de Cachemira';

-- Variantes para reloj elegante
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Plateado', 'Único', 15 FROM public.products p WHERE p.name = 'Reloj Elegante Plateado';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Dorado', 'Único', 8 FROM public.products p WHERE p.name = 'Reloj Elegante Plateado';

-- Variantes para gafas de sol
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', 'Único', 20 FROM public.products p WHERE p.name = 'Gafas de Sol Premium';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Marrón', 'Único', 15 FROM public.products p WHERE p.name = 'Gafas de Sol Premium';

-- Variantes para sneakers
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Blanco', '38', 8 FROM public.products p WHERE p.name = 'Sneakers Deportivos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Blanco', '39', 10 FROM public.products p WHERE p.name = 'Sneakers Deportivos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Blanco', '40', 12 FROM public.products p WHERE p.name = 'Sneakers Deportivos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Blanco', '41', 15 FROM public.products p WHERE p.name = 'Sneakers Deportivos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Blanco', '42', 12 FROM public.products p WHERE p.name = 'Sneakers Deportivos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Blanco', '43', 8 FROM public.products p WHERE p.name = 'Sneakers Deportivos';

INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', '38', 6 FROM public.products p WHERE p.name = 'Sneakers Deportivos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', '39', 8 FROM public.products p WHERE p.name = 'Sneakers Deportivos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', '40', 10 FROM public.products p WHERE p.name = 'Sneakers Deportivos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', '41', 12 FROM public.products p WHERE p.name = 'Sneakers Deportivos';
INSERT INTO public.product_variants (product_id, color, size, stock)
SELECT p.id, 'Negro', '42', 8 FROM public.products p WHERE p.name = 'Sneakers Deportivos';
