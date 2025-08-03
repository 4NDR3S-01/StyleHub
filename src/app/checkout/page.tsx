"use client"

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { createOrder } from '@/services/order.service'
import { validateCoupon } from '@/services/coupon.service'
import { loadStripe } from '@stripe/stripe-js'
import dynamic from 'next/dynamic'

// Carga dinámica del componente de PayPal solo en cliente
const PayPalPayment = dynamic(() => import('@/components/payments/PayPalPayment'), { ssr: false })

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
  const [pendingPaypal, setPendingPaypal] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState<number>(0)
  const [couponError, setCouponError] = useState<string>('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAddress((prev) => ({ ...prev, [name]: value }))
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Introduce un código de cupón')
      return
    }
    try {
      const coupon = await validateCoupon(couponCode)
      if (!coupon) {
        setCouponError('Cupón no válido o expirado')
        setCouponDiscount(0)
      } else {
        setCouponError('')
        setCouponDiscount(coupon.discount_percent)
      }
    } catch (error) {
      console.error(error)
      setCouponError('Error al validar cupón')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Debes iniciar sesión para realizar una compra.')
      return
    }
    setLoading(true)
    try {
      // Calcular totales
      const subtotal = state.items.reduce(
        (sum, item) => sum + item.producto.price * item.quantity,
        0,
      )
      const discountAmount = couponDiscount ? subtotal * (couponDiscount / 100) : 0
      const total = subtotal - discountAmount
      // Crear la orden en Supabase
      const order = await createOrder(user.id, state.items, address, paymentMethod)
      // Aquí puedes integrar el pago con Stripe o PayPal según el método
      if (paymentMethod === 'card') {
        // Crear sesión de pago en backend y redirigir
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
        )
        const res = await fetch('/api/create-stripe-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, total }),
        })
        const { sessionId } = await res.json()
        if (stripe && sessionId) {
          await stripe.redirectToCheckout({ sessionId })
        }
        setOrderId(order.id)
        clearCart()
      } else if (paymentMethod === 'paypal') {
        // No limpiamos el carrito todavía; mostramos botón PayPal
        setOrderId(order.id)
        setPendingPaypal(true)
      }
    } catch (err: any) {
      alert(err?.message || 'Error al crear la orden')
    } finally {
      setLoading(false)
    }
  }

  // Cálculo de subtotal y descuento
  const subtotal = state.items.reduce(
    (sum, item) => sum + item.producto.price * item.quantity,
    0,
  )
  const discountAmount = couponDiscount ? subtotal * (couponDiscount / 100) : 0
  const total = subtotal - discountAmount

  if (orderId && !pendingPaypal) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">¡Gracias por tu compra!</h1>
        <p className="mb-6">
          Tu número de pedido es <strong>{orderId}</strong>. Pronto recibirás un correo con los detalles.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      {/* Si se seleccionó PayPal y ya se creó la orden, mostrar botón de PayPal */}
      {pendingPaypal && orderId ? (
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Paga con PayPal</h2>
          <p className="mb-4">
            Completa tu pago a través de PayPal para finalizar tu pedido #{orderId}.
          </p>
          <PayPalPayment orderId={orderId} total={total} />
        </div>
      ) : (
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
                      {item.producto.name} {item.variant && `(${item.variant.color}/${item.variant.size})`} × {item.quantity}
                    </span>
                    <span>${(item.producto.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
                <li className="flex justify-between pt-2">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </li>
                {couponDiscount > 0 && (
                  <li className="flex justify-between text-green-600">
                    <span>Descuento ({couponDiscount}%):</span>
                    <span>−${discountAmount.toFixed(2)}</span>
                  </li>
                )}
                <li className="flex justify-between font-bold pt-1 border-t mt-1">
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
            {/* Código de cupón */}
            <div className="pt-4">
              <label className="block text-sm font-medium mb-1" htmlFor="coupon">
                Cupón de descuento
              </label>
              <div className="flex gap-2">
                <input
                  id="coupon"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Ingresa tu cupón"
                  className="flex-grow border rounded-lg p-2"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md"
                >
                  Aplicar
                </button>
              </div>
              {couponError && <p className="text-sm text-red-500 mt-1">{couponError}</p>}
              {couponDiscount > 0 && !couponError && (
                <p className="text-sm text-green-600 mt-1">
                  Cupón aplicado: {couponDiscount}% de descuento
                </p>
              )}
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
      )}
    </div>
  )
}
