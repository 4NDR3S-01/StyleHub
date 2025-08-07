"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useWishlist } from '@/context/WishlistContext'
import { useCart } from '@/context/CartContext'
import { useMemo, useState } from 'react'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPriceSimple } from '@/utils/currency'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { useIsClient } from '@/hooks/useIsClient'

interface ProductCardProps {
  readonly product: any
  readonly viewMode?: 'grid' | 'list'
}

/**
 * Muestra un producto en forma de tarjeta.  Incluye imagen principal, nombre,
 * precio y un botón de favorito para agregar o quitar de la wishlist.  Al
 * hacer clic en la tarjeta se navega a la página de detalle del producto.
 */
export default function ProductCard({ product, viewMode = 'grid' }: Readonly<ProductCardProps>) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { addItem } = useCart()
  const router = useRouter()
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const isClient = useIsClient()
  
  const inWishlist = useMemo(() => isClient ? isInWishlist(product.id) : false, [product.id, isInWishlist, isClient])
  const primaryImage = product.images?.[0] || product.product_variants?.[0]?.image || '/placeholder_light_gray_block.png'

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isClient) {
      toggleWishlist(product.id)
    }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isClient || isAddingToCart) return

    // Verificar si el producto tiene variantes
    const variants = product.product_variants || []
    
    if (variants.length === 0) {
      toast({
        title: 'Producto no disponible',
        description: 'Este producto no tiene variantes disponibles',
        variant: 'destructive'
      })
      return
    }

    // Si tiene múltiples variantes, redirigir a la página del producto
    if (variants.length > 1) {
      router.push(`/product/${product.id}`)
      return
    }

    // Si tiene solo una variante, agregar directamente al carrito
    const variant = variants[0]
    if (!variant || variant.stock <= 0) {
      toast({
        title: 'Sin stock',
        description: 'Este producto no está disponible en este momento',
        variant: 'destructive'
      })
      return
    }

    setIsAddingToCart(true)
    
    try {
      const cartItem = {
        id: `${product.id}-${variant.id}-${Date.now()}`,
        producto: {
          id: product.id,
          name: product.name,
          price: Number(product.price) + Number(variant.price_adjustment || 0),
          images: product.images,
          category_id: product.category_id
        },
        quantity: 1,
        variant: {
          id: variant.id,
          color: variant.color,
          size: variant.size,
          stock: variant.stock
        }
      }

      addItem(cartItem)
      
      toast({
        title: 'Producto agregado',
        description: `${product.name} se agregó al carrito`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: 'Error',
        description: 'No se pudo agregar el producto al carrito',
        variant: 'destructive'
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const discountPercentage = product.original_price && product.price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="flex">
          {/* Imagen */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <Link href={`/product/${product.id}`}>
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 192px, 192px"
              />
            </Link>
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.sale && discountPercentage && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  -{discountPercentage}%
                </span>
              )}
              {product.is_featured && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <Star size={10} fill="currentColor" />
                  Destacado
                </span>
              )}
            </div>

            {/* Wishlist button */}
            <button
              onClick={handleWishlistClick}
              className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110"
              aria-label={inWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Heart 
                size={16} 
                className={`transition-colors duration-300 ${
                  inWishlist ? 'text-red-500 fill-red-500' : 'text-gray-600 hover:text-red-500'
                }`}
              />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <Link href={`/product/${product.id}`} className="block">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                  {product.name}
                </h3>
              </Link>
              
              {product.brand && (
                <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
              )}

              {product.description && (
                <p className="text-gray-600 mt-2 line-clamp-2 text-sm">
                  {product.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3">
                {product.category && (
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {product.category.name}
                  </span>
                )}
                {product.gender && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full capitalize">
                    {product.gender}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPriceSimple(product.price)}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPriceSimple(product.original_price)}
                    </span>
                  )}
                </div>
                {discountPercentage && (
                  <span className="text-sm text-green-600 font-medium">
                    Ahorras {formatPriceSimple(product.original_price - product.price)}
                  </span>
                )}
              </div>

              <Button 
                className="flex items-center gap-2"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                <ShoppingCart size={16} />
                {isAddingToCart ? 'Agregando...' : 'Agregar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vista de grilla (por defecto)
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative aspect-square">
        <Link href={`/product/${product.id}`}>
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.sale && discountPercentage && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              -{discountPercentage}%
            </span>
          )}
          {product.is_featured && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Star size={10} fill="currentColor" />
              Destacado
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110"
          aria-label={inWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart 
            size={16} 
            className={`transition-colors duration-300 ${
              inWishlist ? 'text-red-500 fill-red-500' : 'text-gray-600 hover:text-red-500'
            }`}
          />
        </button>

        {/* Quick add to cart overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button 
            className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
          >
            <ShoppingCart size={16} className="mr-2" />
            {isAddingToCart ? 'Agregando...' : 'Agregar al carrito'}
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Link href={`/product/${product.id}`} className="block">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 text-sm">
            {product.name}
          </h3>
        </Link>
        
        {product.brand && (
          <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
        )}

        <div className="flex items-center gap-1 mt-2">
          {product.category && (
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              {product.category.name}
            </span>
          )}
          {product.gender && (
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full capitalize">
              {product.gender}
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPriceSimple(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPriceSimple(product.original_price)}
              </span>
            )}
          </div>
          {discountPercentage && (
            <span className="text-xs text-green-600 font-medium">
              Ahorras {formatPriceSimple(product.original_price - product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}