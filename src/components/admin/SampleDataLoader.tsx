'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Database, Loader2 } from 'lucide-react';

export default function SampleDataLoader() {
  const [loading, setLoading] = useState(false);

  const loadSampleData = async () => {
    setLoading(true);
    try {
      // Primero verificar si ya hay datos
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .limit(1);

      const { data: existingProducts } = await supabase
        .from('products')
        .select('id')
        .limit(1);

      if (existingCategories && existingCategories.length > 0 || existingProducts && existingProducts.length > 0) {
        const confirm = window.confirm(
          '¿Ya existen datos en la base de datos. ¿Estás seguro de que quieres agregar datos de ejemplo? Esto podría crear duplicados.'
        );
        if (!confirm) {
          setLoading(false);
          return;
        }
      }

      // Insertar categorías
      const categoriesData = [
        {
          name: 'Mujeres',
          slug: 'women',
          description: 'Ropa y accesorios para mujeres',
          image: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'
        },
        {
          name: 'Hombres',
          slug: 'men',
          description: 'Ropa y accesorios para hombres',
          image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'
        },
        {
          name: 'Accesorios',
          slug: 'accessories',
          description: 'Accesorios de moda',
          image: 'https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'
        },
        {
          name: 'Zapatos',
          slug: 'shoes',
          description: 'Calzado para todos',
          image: 'https://images.pexels.com/photos/2048548/pexels-photo-2048548.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'
        }
      ];

      const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .insert(categoriesData)
        .select();

      if (categoryError) throw categoryError;

      // Encontrar los IDs de las categorías creadas
      const menCategoryId = categories?.find((c: any) => c.slug === 'men')?.id;
      const womenCategoryId = categories?.find((c: any) => c.slug === 'women')?.id;
      const accessoriesCategoryId = categories?.find((c: any) => c.slug === 'accessories')?.id;
      const shoesCategoryId = categories?.find((c: any) => c.slug === 'shoes')?.id;

      // Insertar productos
      const productsData = [
        // Productos para hombres
        {
          name: 'Camisa Casual de Algodón',
          description: 'Camisa cómoda y elegante de algodón 100%, perfecta para uso diario',
          price: 59.99,
          original_price: 79.99,
          images: ['https://images.pexels.com/photos/1707828/pexels-photo-1707828.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
          category_id: menCategoryId,
          brand: 'StyleHub',
          gender: 'masculino',
          material: 'Algodón',
          tags: ['camisa', 'casual', 'algodón'],
          featured: true,
          sale: true
        },
        {
          name: 'Jeans Clásicos',
          description: 'Jeans de corte clásico con ajuste cómodo y diseño atemporal',
          price: 89.99,
          images: ['https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
          category_id: menCategoryId,
          brand: 'StyleHub',
          gender: 'masculino',
          material: 'Mezclilla',
          tags: ['jeans', 'casual', 'mezclilla'],
          featured: true,
          sale: false
        },
        {
          name: 'Buzo de Cuero Premium',
          description: 'Buzo de cuero genuino con forro interno y diseño moderno',
          price: 299.99,
          images: ['https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
          category_id: menCategoryId,
          brand: 'StyleHub',
          gender: 'masculino',
          material: 'Cuero',
          tags: ['buzo', 'cuero', 'premium'],
          featured: true,
          sale: false
        },
        // Productos para mujeres
        {
          name: 'Vestido Elegante de Verano',
          description: 'Vestido ligero y elegante, perfecto para ocasiones especiales',
          price: 129.99,
          original_price: 159.99,
          images: ['https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
          category_id: womenCategoryId,
          brand: 'StyleHub',
          gender: 'femenino',
          material: 'Algodón',
          tags: ['vestido', 'elegante', 'verano'],
          featured: true,
          sale: true
        },
        {
          name: 'Chaqueta de Mezclilla',
          description: 'Chaqueta de mezclilla vintage con ajuste moderno',
          price: 149.99,
          images: ['https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
          category_id: womenCategoryId,
          brand: 'StyleHub',
          gender: 'femenino',
          material: 'Mezclilla',
          tags: ['chaqueta', 'mezclilla', 'vintage'],
          featured: true,
          sale: false
        },
        {
          name: 'Suéter de Cachemira',
          description: 'Suéter ultra suave de cachemira con ajuste relajado',
          price: 249.99,
          images: ['https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
          category_id: womenCategoryId,
          brand: 'StyleHub',
          gender: 'femenino',
          material: 'Cachemira',
          tags: ['suéter', 'cachemira', 'lujo'],
          featured: true,
          sale: false
        },
        // Accesorios
        {
          name: 'Reloj Elegante Plateado',
          description: 'Reloj de pulsera elegante con acabado plateado y correa de cuero',
          price: 199.99,
          original_price: 259.99,
          images: ['https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
          category_id: accessoriesCategoryId,
          brand: 'StyleHub',
          material: 'Acero inoxidable',
          tags: ['reloj', 'elegante', 'plateado'],
          featured: true,
          sale: true
        },
        {
          name: 'Gafas de Sol Premium',
          description: 'Gafas de sol con protección UV400 y marcos de alta calidad',
          price: 89.99,
          images: ['https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
          category_id: accessoriesCategoryId,
          brand: 'StyleHub',
          material: 'Policarbonato',
          tags: ['gafas', 'sol', 'premium'],
          featured: true,
          sale: false
        },
        // Zapatos
        {
          name: 'Sneakers Deportivos',
          description: 'Zapatillas deportivas cómodas y estilosas para uso diario',
          price: 129.99,
          images: ['https://images.pexels.com/photos/2048548/pexels-photo-2048548.jpeg?auto=compress&cs=tinysrgb&w=500&h=600&dpr=1'],
          category_id: shoesCategoryId,
          brand: 'StyleHub',
          gender: 'unisex',
          material: 'Sintético',
          tags: ['sneakers', 'deportivo', 'cómodo'],
          featured: true,
          sale: false
        }
      ];

      const { data: products, error: productError } = await supabase
        .from('products')
        .insert(productsData)
        .select();

      if (productError) throw productError;

      // Insertar algunas variantes de ejemplo
      const variants = [];
      
      // Variantes para la camisa
      const shirtProduct = products?.find((p: any) => p.name === 'Camisa Casual de Algodón');
      if (shirtProduct) {
        variants.push(
          { product_id: shirtProduct.id, color: 'Blanco', size: 'S', stock: 15 },
          { product_id: shirtProduct.id, color: 'Blanco', size: 'M', stock: 20 },
          { product_id: shirtProduct.id, color: 'Blanco', size: 'L', stock: 18 },
          { product_id: shirtProduct.id, color: 'Azul', size: 'S', stock: 10 },
          { product_id: shirtProduct.id, color: 'Azul', size: 'M', stock: 15 }
        );
      }

      // Variantes para jeans
      const jeansProduct = products?.find((p: any) => p.name === 'Jeans Clásicos');
      if (jeansProduct) {
        variants.push(
          { product_id: jeansProduct.id, color: 'Azul Oscuro', size: '30', stock: 8 },
          { product_id: jeansProduct.id, color: 'Azul Oscuro', size: '32', stock: 12 },
          { product_id: jeansProduct.id, color: 'Azul Oscuro', size: '34', stock: 10 },
          { product_id: jeansProduct.id, color: 'Negro', size: '30', stock: 5 },
          { product_id: jeansProduct.id, color: 'Negro', size: '32', stock: 8 }
        );
      }

      // Variantes para vestido
      const dressProduct = products?.find((p: any) => p.name === 'Vestido Elegante de Verano');
      if (dressProduct) {
        variants.push(
          { product_id: dressProduct.id, color: 'Rosa', size: 'S', stock: 12 },
          { product_id: dressProduct.id, color: 'Rosa', size: 'M', stock: 15 },
          { product_id: dressProduct.id, color: 'Rosa', size: 'L', stock: 10 },
          { product_id: dressProduct.id, color: 'Azul Claro', size: 'S', stock: 6 },
          { product_id: dressProduct.id, color: 'Azul Claro', size: 'M', stock: 8 }
        );
      }

      // Variantes para sneakers
      const sneakersProduct = products?.find((p: any) => p.name === 'Sneakers Deportivos');
      if (sneakersProduct) {
        variants.push(
          { product_id: sneakersProduct.id, color: 'Blanco', size: '38', stock: 8 },
          { product_id: sneakersProduct.id, color: 'Blanco', size: '40', stock: 12 },
          { product_id: sneakersProduct.id, color: 'Blanco', size: '42', stock: 10 },
          { product_id: sneakersProduct.id, color: 'Negro', size: '38', stock: 6 },
          { product_id: sneakersProduct.id, color: 'Negro', size: '40', stock: 8 }
        );
      }

      if (variants.length > 0) {
        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variants);

        if (variantError) throw variantError;
      }

      toast({
        title: "¡Éxito!",
        description: `Se han cargado ${categories?.length} categorías, ${products?.length} productos y ${variants.length} variantes de ejemplo.`,
      });

    } catch (error: any) {
      console.error('Error loading sample data:', error);
      toast({
        title: "Error",
        description: `Error al cargar datos de ejemplo: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Datos de Ejemplo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Carga datos de ejemplo para probar el sistema. Incluye categorías, productos y variantes.
        </p>
        <Button 
          onClick={loadSampleData} 
          disabled={loading} 
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Cargando...' : 'Cargar Datos de Ejemplo'}
        </Button>
      </CardContent>
    </Card>
  );
}
