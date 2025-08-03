import ProductGrid from '@/components/product/ProductGrid';

export default function ShoesCategoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Zapatos
          </h1>
          <p className="text-gray-600">
            Encuentra el calzado perfecto para cualquier ocasión. Desde zapatos elegantes hasta zapatillas deportivas.
          </p>
        </div>
        
        <ProductGrid categorySlug="shoes" />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Zapatos - StyleHub',
  description: 'Encuentra el calzado perfecto para cualquier ocasión. Desde zapatos elegantes hasta zapatillas deportivas.',
};
