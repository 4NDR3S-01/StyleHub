import ProductCard from '../product/ProductCard';
import { products } from '../../data/products';

// FeaturedProducts.tsx
// This component displays a grid of featured products with images and links
export default function FeaturedProducts() {
  const featuredProducts = products.filter(product => product.featured);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Productos Destacados
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Descubre nuestros artículos más populares, seleccionados por su calidad excepcional y estilo
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}