"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { submitReview } from '@/services/review.service'

interface Props {
  readonly productId: string
  readonly onSubmitted?: () => void
}

export default function ReviewForm({ productId, onSubmitted }: Props) {
  const { user } = useAuth()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Limpiar mensaje después de 5 segundos
  useEffect(() => {
    if (message && !submitting) {
      const timer = setTimeout(() => {
        setMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message, submitting])

  if (!user) {
    return (
      <div className="text-center py-6 bg-blue-50 rounded-lg">
        <p className="text-blue-800 mb-3">Debes iniciar sesión para dejar una reseña.</p>
        <button 
          onClick={() => {
            // Disparar evento para abrir el modal de login
            window.dispatchEvent(new CustomEvent('openAuthModal'))
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Iniciar Sesión
        </button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      setMessage('Escribe un comentario.')
      return
    }
    
    setSubmitting(true)
    setMessage('') // Limpiar mensajes anteriores
    
    try {
      console.log('Enviando reseña...', { productId, userId: user.id, rating, comment: comment.trim() })
      const result = await submitReview(productId, user.id, rating, comment.trim())
      console.log('Resultado del envío:', result)
      
      setComment('')
      setRating(5) // Reset rating to default
      setMessage('¡Gracias por tu reseña! Será revisada por un administrador.')
      onSubmitted?.()
    } catch (error) {
      console.error('Error al enviar reseña:', error)
      
      // Mostrar un mensaje de error más específico
      if (error instanceof Error) {
        setMessage(`Error al enviar la reseña: ${error.message}`)
      } else {
        setMessage('Hubo un error inesperado al enviar la reseña. Por favor, inténtalo de nuevo.')
      }
    } finally {
      setSubmitting(false)
    }
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
      {message && (
        <div className={`p-3 rounded-md ${
          message.includes('Gracias') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="bg-slate-800 text-white px-6 py-3 rounded-md hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {submitting && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        )}
        {submitting ? 'Enviando...' : 'Enviar reseña'}
      </button>
    </form>
  )
}