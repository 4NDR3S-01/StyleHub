'use client';

import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';

// Tipo unificado para productos (compatible con ambos formatos)
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  originalPrice?: number; // Para compatibilidad con datos legacy
  images: string[];
  category?: string;
  category_id?: string;
  sizes?: string[];
  colors?: string[];
  stock?: number;
  rating?: number;
  reviews?: number;
  featured?: boolean;
  sale?: boolean;
  brand?: string;
  gender?: string;
  material?: string;
  season?: string;
  tags?: string[];
  product_variants?: Array<{
    id: string;
    color: string;
    size: string;
    stock: number;
    image?: string;
  }>;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  // Extraer colores y tallas de variantes si están disponibles
  const colors = product.product_variants 
    ? Array.from(new Set(product.product_variants.map(v => v.color)))
    : product.colors || [];
  
  const sizes = product.product_variants
    ? Array.from(new Set(product.product_variants.map(v => v.size)))
    : product.sizes || [];

  // Usar original_price o originalPrice para compatibilidad
  const originalPrice = product.original_price || product.originalPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Convertir a formato compatible con el carrito
    // Map gender and season to their allowed union types
    const allowedGenders = ['hombre', 'mujer', 'unisex', 'niño'] as const;
    const allowedSeasons = ['verano', 'invierno', 'otoño', 'primavera'] as const;

    const gender = allowedGenders.includes(product.gender as any)
      ? (product.gender as 'hombre' | 'mujer' | 'unisex' | 'niño')
      : undefined;

    const season = allowedSeasons.includes(product.season as any)
      ? (product.season as 'verano' | 'invierno' | 'otoño' | 'primavera')
      : undefined;

    const cartProduct = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      originalPrice: originalPrice,
      images: product.images,
      category: product.category || 'general',
      sizes: sizes,
      colors: colors,
      stock: product.stock || 0,
      rating: product.rating || 0,
      reviews: product.reviews || 0,
      featured: product.featured,
      sale: product.sale,
      brand: product.brand,
      gender: gender,
      material: product.material,
      season: season,
      tags: product.tags,
      variants: product.product_variants
    };

    addToCart(cartProduct, sizes[0], colors[0]);
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <Link href={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {product.sale && (
            <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold drop-shadow-lg border border-yellow-300 shadow-lg animate-pulse">
              Oferta
            </div>
          )}
          <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-50">
            <Heart size={20} className="text-gray-600" />
          </button>
        </div>
      </Link>

      <div className="p-6">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-lg text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {product.rating && product.reviews && (
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i < Math.floor(product.rating!)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-2">({product.reviews})</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-slate-900">
              ${product.price.toFixed(2)}
            </span>
            {originalPrice && originalPrice > product.price && (
              <span className="text-lg text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={sizes.length === 0 || colors.length === 0}
          className={`w-full py-3 rounded-xl font-semibold transition-colors duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
            ${product.sale
              ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 border border-yellow-300'
              : 'bg-[#ff6f61] hover:bg-[#d7263d] text-white border border-[#ff6f61]'}
          `}
        >
          {sizes.length === 0 || colors.length === 0 ? 'Sin variantes' : 'Agregar al Carrito'}
        </button>
      </div>
    </div>
  );
}