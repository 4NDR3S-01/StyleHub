"use client"

import { useState } from 'react'
import { productos, ProductVariant } from '@/types'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import ProductReviews from '@/components/product/ProductReviews'
import ReviewForm from '@/components/product/ReviewForm'

interface ProductDetailProps {
  /** Producto devuelto desde Supabase, contiene la propiedad
   *  `product_variants` con el stock por color/talla si existe */
  product: productos & {
    product_variants?: ProductVariant[]
  }
}

/**
 * Muestra el detalle de un producto permitiendo seleccionar color y talla
 * y añadirlo al carrito.  Soporta variantes almacenadas en la tabla
 * `product_variants`; si no hay variantes usa los arrays `sizes` y `colors`
 * definidos en la interfaz de producto.
 */
export default function ProductDetail({ product }: ProductDetailProps) {
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  // Combinar variantes si existen, en caso contrario generar combinaciones
  const variants: ProductVariant[] =
    product.product_variants && product.product_variants.length > 0
      ? product.product_variants
      : []
  // Determinar la lista de colores y tallas a mostrar
  const uniqueColors = variants.length
    ? Array.from(new Set(variants.map((v) => v.color)))
    : product.colors
  const uniqueSizes = variants.length
    ? Array.from(new Set(variants.map((v) => v.size)))
    : product.sizes
  // Estado para color y talla seleccionados
  const [selectedColor, setSelectedColor] = useState(uniqueColors[0])
  const [selectedSize, setSelectedSize] = useState(uniqueSizes[0])
  const selectedVariant = variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize,
  )

  const handleAddToCart = () => {
    // Utiliza `addToCart` del contexto de carrito.  Si se encuentra una
    // variante específica, se pasa su id para referenciarla posteriormente.
    addToCart(product, selectedSize, selectedColor)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
      {/* Galería de imágenes */}
      <div className="space-y-4">
        <div className="w-full h-[500px] overflow-hidden rounded-xl shadow-lg">
          <img
            src={product.images?.[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Miniaturas */}
        <div className="flex gap-2">
          {product.images?.slice(1).map((img, idx) => (
            <div key={idx} className="w-20 h-20 overflow-hidden rounded-lg cursor-pointer">
              <img
                src={img}
                alt={product.name}
                className="w-full h-full object-cover"
                onClick={() => {
                  // Al hacer click en miniatura, se mueve al primer lugar para mostrarse
                  const newImages = [img, ...product.images!.filter((i) => i !== img)]
                  product.images = newImages
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Información del producto */}
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-bold text-slate-900 mr-2 flex-1">{product.name}</h1>
          {/* Botón de favorito */}
          <button
            onClick={() => toggleWishlist(product.id)}
            className="text-red-500 text-2xl focus:outline-none"
            aria-label="Agregar a favoritos"
          >
            {isInWishlist(product.id) ? '♥' : '♡'}
          </button>
        </div>
        {product.originalPrice && product.originalPrice > product.price ? (
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-slate-900">
              ${product.price.toFixed(2)}
            </span>
            <span className="line-through text-gray-400 text-xl">
              ${product.originalPrice.toFixed(2)}
            </span>
          </div>
        ) : (
          <span className="text-4xl font-extrabold text-slate-900">
            ${product.price.toFixed(2)}
          </span>
        )}
        <p className="text-gray-700 leading-relaxed">{product.description}</p>
        {/* Selección de color */}
        <div className="space-y-2">
          <span className="font-medium">Color:</span>
          <div className="flex gap-2">
            {uniqueColors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={
                  'px-3 py-1 rounded-full border text-sm transition-colors ' +
                  (selectedColor === color
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100')
                }
              >
                {color}
              </button>
            ))}
          </div>
        </div>
        {/* Selección de talla */}
        <div className="space-y-2">
          <span className="font-medium">Talla:</span>
          <div className="flex gap-2">
            {uniqueSizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={
                  'px-3 py-1 rounded-full border text-sm transition-colors ' +
                  (selectedSize === size
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100')
                }
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        {/* Stock disponible */}
        {selectedVariant && (
          <p className="text-sm text-gray-500">
            Stock disponible: {selectedVariant.stock}
          </p>
        )}
        {/* Botón de añadir al carrito */}
        <button
          onClick={handleAddToCart}
          className="w-full mt-4 bg-[#ff6f61] hover:bg-[#d7263d] text-white font-semibold py-3 px-5 rounded-xl shadow-lg transition-transform transform hover:scale-105"
        >
          Añadir al carrito
        </button>
        {/* Sección de reseñas */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Reseñas</h2>
          <ProductReviews productId={product.id} />
          <ReviewForm productId={product.id} onSubmitted={() => {}} />
        </div>
      </div>
    </div>
  )
}