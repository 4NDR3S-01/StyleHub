"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { ShoppingCart, User, ArrowLeft } from 'lucide-react'

interface Props {
  readonly children: React.ReactNode
}

/**
 * Componente de protección específico para el checkout.
 * Verifica que el usuario esté autenticado antes de permitir
 * el acceso al proceso de checkout.
 */
export default function CheckoutProtectedRoute({ children }: Props) {
  const { user, isLoading } = useAuth()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setShowLoginPrompt(true)
      } else {
        setShowLoginPrompt(false)
      }
    }
  }, [user, isLoading])

  const handleOpenAuthModal = () => {
    // Guardar la URL actual para redirigir después del login/registro
    sessionStorage.setItem('redirectAfterLogin', '/checkout')
    // Disparar evento para abrir el modal de autenticación
    window.dispatchEvent(new CustomEvent('openAuthModal'))
  }

  const handleGoBack = () => {
    window.history.back()
  }

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Mostrar prompt de login si no está autenticado
  if (showLoginPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            {/* Icono */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-blue-600" />
            </div>

            {/* Título y descripción */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Inicia sesión para continuar
            </h1>
            <p className="text-gray-600 mb-8">
              Para proceder con tu compra, necesitas tener una cuenta en StyleHub. 
              Esto nos permite procesar tu pedido y mantener un registro de tus compras.
            </p>

            {/* Beneficios */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">¿Por qué necesitas una cuenta?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Historial de pedidos y seguimiento</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Gestión de direcciones de envío</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Lista de favoritos personalizada</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Ofertas y descuentos exclusivos</span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleOpenAuthModal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  <User className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
                <Button 
                  onClick={handleOpenAuthModal}
                  variant="outline"
                  className="flex-1 py-3"
                >
                  Crear Cuenta Nueva
                </Button>
              </div>
              
              <Button 
                onClick={handleGoBack}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a la tienda
              </Button>
            </div>

            {/* Nota de seguridad */}
            <div className="mt-8 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <ShoppingCart className="w-4 h-4" />
                <span className="text-sm font-medium">Tu carrito se mantendrá guardado</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                No te preocupes, todos los productos en tu carrito se conservarán después del login
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si está autenticado, mostrar el contenido del checkout
  return <>{children}</>
}
