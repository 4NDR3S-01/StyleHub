'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCategories } from '@/services/product.service'

interface Category {
  id: string
  name: string
  slug: string
  image?: string
  description?: string
  parent_id?: string
}

// Categories.tsx
// This component displays a grid of product categories with images and links
export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCategories() {
      try {
        const categoriesData = await getCategories()
        // Filtrar solo las categorías principales (sin parent_id)
        const mainCategories = categoriesData.filter(cat => !cat.parent_id)
        setCategories(mainCategories)
      } catch (error) {
        console.error('Error loading categories:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg mb-4">
              Comprar por Categoría
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explora nuestras colecciones cuidadosamente seleccionadas diseñadas para cada estilo y ocasión
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg mb-4">
            Comprar por Categoría
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explora nuestras colecciones cuidadosamente seleccionadas diseñadas para cada estilo y ocasión
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No hay categorías disponibles en este momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group relative overflow-hidden rounded-2xl aspect-square"
              >
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 text-lg">Sin imagen</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-white text-2xl font-bold transform group-hover:scale-110 transition-transform duration-300">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}