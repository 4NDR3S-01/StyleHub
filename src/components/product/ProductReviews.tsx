"use client"

import { useEffect, useState } from 'react'
import { getApprovedReviews } from '@/services/review.service'

interface Props {
  readonly productId: string
}

export default function ProductReviews({ productId }: Props) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getApprovedReviews(productId)
        setReviews(data)
      } catch (err: any) {
        console.error('Error loading reviews:', err?.message || 'Unknown error')
        setError('No se pudieron cargar las reseñas')
      }
      setLoading(false)
    }
    load()
  }, [productId])

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="border-b pb-4 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-200 rounded mr-1"></div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  )
  if (error) return (
    <div className="text-center py-8">
      <p className="text-red-600 mb-2">{error}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="text-blue-600 hover:underline"
      >
        Reintentar
      </button>
    </div>
  )
  if (reviews.length === 0) return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-600 mb-2">
        Sin reseñas aún
      </h3>
      <p className="text-gray-500">
        Sé el primero en compartir tu experiencia con este producto.
      </p>
    </div>
  )
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Muestra el nombre del usuario */}
              <span className="font-medium text-sm">{review.users?.name || 'Anónimo'}</span>
              <span className="text-gray-400 text-xs">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}>
                  ★
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{review.comment}</p>
        </div>
      ))}
    </div>
  )
}