"use client"

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

interface Props {
  readonly children: React.ReactNode
  readonly requiredRole?: string
}

/**
 * Protege rutas restringidas verificando que el usuario tenga el rol
 * adecuado.  Si el usuario no está autenticado o no cumple el rol,
 * se redirige a la página principal.
 */
export default function ProtectedRoute({ children, requiredRole = 'admin' }: Props) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user || (requiredRole && user.role !== requiredRole)) {
      router.push('/')
    }
  }, [user, requiredRole, router])

  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null
  }
  return <>{children}</>
}