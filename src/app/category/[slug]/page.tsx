import { notFound } from 'next/navigation'
import { getCategoryBySlug, getProductsByCategory } from '@/services/product.service'
import ProductCard from '@/components/product/ProductCard'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Página de listado de productos por categoría.  Recupera la categoría por
 * su slug y luego los productos asociados.  Si la categoría no existe
 * se muestra un error 404.
 */
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()
  const products = await getProductsByCategory(slug)
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">
        {category.name}
      </h1>
      {products.length === 0 ? (
        <p className="text-gray-600">No hay productos en esta categoría.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((prod: any) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}
    </section>
  )
}