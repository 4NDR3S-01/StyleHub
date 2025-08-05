import ProductGrid from '@/components/product/ProductGrid';

export default function WomenCategoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Ropa para Mujeres
          </h1>
          <p className="text-gray-600">
            Descubre nuestra colección de ropa femenina con las últimas tendencias y estilos únicos.
          </p>
        </div>
        
        <ProductGrid categorySlug="women" />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Ropa para Mujeres - StyleHub',
  description: 'Descubre nuestra colección de ropa femenina con las últimas tendencias y estilos únicos.',
};
