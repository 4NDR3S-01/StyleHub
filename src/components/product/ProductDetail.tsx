"use client"

import { useState } from "react"
import { Product } from "@/services/product.service"
import { useCart } from "@/context/CartContext"
import { useWishlist } from "@/context/WishlistContext"

interface ProductDetailProps {
  readonly product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [mainImage, setMainImage] = useState(product.images?.[0] || "")

  const handleAddToCart = () => {
    const cartItem = {
      id: `${product.id}-${Date.now()}`,
      producto: {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        category_id: product.category_id
      },
      quantity: selectedQuantity
    }
    addItem(cartItem)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="space-y-4">
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto">
          {product.images?.map((img) => (
            <button
              key={img}
              className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg border-2 border-transparent hover:border-blue-500"
              onClick={() => setMainImage(img)}
            >
              <img
                src={img}
                alt={`${product.name}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold text-slate-900 mr-2 flex-1">{product.name}</h1>
          <button
            className="text-2xl text-red-500 hover:scale-110 transition-transform"
            onClick={() => toggleWishlist(product.id)}
            aria-label="Agregar a favoritos"
          >
            {isInWishlist(product.id) ? "♥" : "♡"}
          </button>
        </div>

        <div className="text-2xl font-semibold text-green-600">
          ${product.price.toFixed(2)}
        </div>

        {product.description && (
          <div className="text-gray-700">
            <h3 className="font-semibold mb-2">Descripción</h3>
            <p>{product.description}</p>
          </div>
        )}

        {product.category && (
          <div className="text-sm text-gray-600">
            Categoría: <span className="font-medium">{product.category.name}</span>
          </div>
        )}

        <div className="text-sm text-gray-600">
          Stock: <span className="font-medium">
            {product.product_variants && product.product_variants.length > 0 
              ? `${product.product_variants.reduce((total, variant) => total + variant.stock, 0)} disponibles`
              : "Consultar disponibilidad"
            }
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <label htmlFor="quantity" className="font-semibold">Cantidad:</label>
          <select
            id="quantity"
            value={selectedQuantity}
            onChange={(e) => setSelectedQuantity(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          >
            {Array.from({ length: Math.min(10, 
              product.product_variants && product.product_variants.length > 0 
                ? Math.max(...product.product_variants.map(v => v.stock))
                : 10
            ) }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleAddToCart}
            disabled={
              !product.product_variants || 
              product.product_variants.length === 0 || 
              product.product_variants.every(v => v.stock <= 0)
            }
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {product.product_variants?.some(v => v.stock > 0) 
              ? "Agregar al carrito" 
              : "Sin stock"
            }
          </button>
          
          <button
            onClick={() => toggleWishlist(product.id)}
            className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            {isInWishlist(product.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
          </button>
        </div>

        <div className="border-t pt-6 space-y-2 text-sm text-gray-600">
          <p>• Envío gratis en compras superiores a $50</p>
          <p>• Devoluciones gratuitas dentro de 30 días</p>
          <p>• Garantía de satisfacción</p>
        </div>
      </div>
    </div>
  )
}
