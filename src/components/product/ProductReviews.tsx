"use client"

import { useEffect, useState } from 'react'
import { getApprovedReviews } from '@/services/review.service'

interface Props {
  productId: string
}

export default function ProductReviews({ productId }: Props) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getApprovedReviews(productId)
        setReviews(data)
      } catch (err: any) {
        console.error(err)
        setError('No se pudieron cargar las reseñas')
      }
      setLoading(false)
    }
    load()
  }, [productId])

  if (loading) return <p>Cargando reseñas...</p>
  if (error) return <p>{error}</p>
  if (reviews.length === 0) return <p>Este producto aún no tiene reseñas.</p>
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