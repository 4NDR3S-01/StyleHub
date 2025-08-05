"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useWishlist } from '@/context/WishlistContext'
import { useMemo } from 'react'

interface ProductCardProps {
  product: any
}

/**
 * Muestra un producto en forma de tarjeta.  Incluye imagen principal, nombre,
 * precio y un botón de favorito para agregar o quitar de la wishlist.  Al
 * hacer clic en la tarjeta se navega a la página de detalle del producto.
 */
export default function ProductCard({ product }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const inWishlist = useMemo(() => isInWishlist(product.id), [product.id, isInWishlist])
  const primaryImage = product.product_variants?.[0]?.image || product.image || '/placeholder_light_gray_block.png'

  return (
    <div className="border rounded-md overflow-hidden relative group">
      <Link href={`/product/${product.id}`} className="block">
        <div className="aspect-w-1 aspect-h-1 bg-gray-100">
          <Image
            src={primaryImage}
            alt={product.name}
            width={400}
            height={400}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="p-2">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
          <p className="text-sm text-gray-500">$ {product.price.toFixed(2)}</p>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleWishlist(product.id)
        }}
        className="absolute top-2 right-2 text-red-500 p-1 rounded-full bg-white bg-opacity-75 hover:bg-opacity-100 transition"
        aria-label="Favorito"
      >
        {inWishlist ? '♥' : '♡'}
      </button>
    </div>
  )
}