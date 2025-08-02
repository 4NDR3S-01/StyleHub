"use client"

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { submitReview } from '@/services/review.service'

interface Props {
  productId: string
  onSubmitted?: () => void
}

export default function ReviewForm({ productId, onSubmitted }: Props) {
  const { user } = useAuth()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  if (!user) {
    return <p>Debes iniciar sesión para dejar una reseña.</p>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      setMessage('Escribe un comentario.')
      return
    }
    setSubmitting(true)
    try {
      await submitReview(productId, user.id, rating, comment.trim())
      setComment('')
      setMessage('¡Gracias por tu reseña! Será revisada por un administrador.')
      onSubmitted?.()
    } catch (error) {
      console.error(error)
      setMessage('Hubo un error al enviar la reseña.')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <span className="font-medium">Tu puntuación:</span>
        {Array.from({ length: 5 }, (_, i) => {
          const value = i + 1
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={value <= rating ? 'text-yellow-500 text-xl' : 'text-gray-300 text-xl'}
            >
              ★
            </button>
          )
        })}
      </div>
      <textarea
        className="w-full border rounded-md p-2"
        rows={4}
        placeholder="Escribe tu experiencia con este producto..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      ></textarea>
      {message && <p className="text-sm text-green-600">{message}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition"
      >
        Enviar reseña
      </button>
    </form>
  )
}