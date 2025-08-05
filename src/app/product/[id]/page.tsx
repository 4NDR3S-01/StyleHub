import { notFound } from 'next/navigation'
import { getProductById } from '@/services/product.service'
import ProductDetail from '@/components/product/ProductDetail'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

/**
 * Página de detalle de producto.
 * Esta página es un componente de servidor (server component) que obtiene
 * el producto por ID desde Supabase y delega la renderización de la
 * interfaz a `ProductDetail` como componente cliente.  Si el producto no
 * existe se envía un 404 utilizando `notFound()`.
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) notFound()
  return <ProductDetail product={product} />
}