"use client"

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { OrderService } from '@/services/order.service'

interface AddressForm {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

/**
 * Página de checkout.  Muestra un resumen del carrito y un formulario simple
 * para la dirección de envío.  Al enviar el formulario se crea la orden
 * en Supabase y se limpia el carrito.
 */
export default function CheckoutPage() {
  const { state, clearCart } = useCart()
  const { user } = useAuth()
  const [address, setAddress] = useState<AddressForm>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card')
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Debes iniciar sesión para realizar una compra.')
      return
    }
    setLoading(true)
    try {
      const order = await OrderService.createOrder(user.id, state.items, address, paymentMethod)
      setOrderId(order.id)
      clearCart()
    } catch (err: any) {
      alert(err?.message || 'Error al crear la orden')
    } finally {
      setLoading(false)
    }
  }

  const total = state.items.reduce(
    (sum, item) => sum + item.producto.price * item.quantity,
    0,
  )

  if (orderId) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">¡Gracias por tu compra!</h1>
        <p className="mb-6">Tu número de pedido es <strong>{orderId}</strong>. Pronto recibirás un correo con los detalles.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Resumen del carrito */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Resumen</h2>
          {state.items.length === 0 ? (
            <p className="text-gray-600">Tu carrito está vacío.</p>
          ) : (
            <ul className="space-y-2">
              {state.items.map((item, idx) => (
                <li key={idx} className="flex justify-between border-b pb-2">
                  <span>
                    {item.producto.name} ({item.size}/{item.color}) × {item.quantity}
                  </span>
                  <span>${(item.producto.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
              <li className="flex justify-between font-bold pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </li>
            </ul>
          )}
        </div>
        {/* Formulario de dirección y método de pago */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-semibold">Datos de envío</h2>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="street">
              Calle y número
            </label>
            <input
              id="street"
              name="street"
              value={address.street}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="city">
                Ciudad
              </label>
              <input
                id="city"
                name="city"
                value={address.city}
                onChange={handleInputChange}
                required
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="state">
                Provincia/Estado
              </label>
              <input
                id="state"
                name="state"
                value={address.state}
                onChange={handleInputChange}
                required
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="zip">
                Código Postal
              </label>
              <input
                id="zip"
                name="zip"
                value={address.zip}
                onChange={handleInputChange}
                required
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="country">
                País
              </label>
              <input
                id="country"
                name="country"
                value={address.country}
                onChange={handleInputChange}
                required
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>
          {/* Selección de método de pago */}
          <div className="pt-4">
            <span className="block text-sm font-medium mb-2">Método de pago</span>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              Tarjeta
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentMethod"
                value="paypal"
                checked={paymentMethod === 'paypal'}
                onChange={() => setPaymentMethod('paypal')}
              />
              PayPal
            </label>
          </div>
          <button
            type="submit"
            disabled={state.items.length === 0 || loading}
            className="w-full mt-4 bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            {loading ? 'Procesando...' : 'Realizar pedido'}
          </button>
        </form>
      </div>
    </div>
  )
}