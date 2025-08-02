"use client"

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

interface Props {
  orderId: string
  total: number
}

/**
 * Componente que renderiza el botón de PayPal para procesar un pago.
 * Recibe el `orderId` generado en Supabase y el total a pagar.  Se encarga
 * de crear la orden de PayPal y de capturar el pago cuando el usuario
 * autoriza la transacción.  Después de capturar, puedes redirigir o
 * actualizar el estado de la orden en Supabase.
 */
export default function PayPalPayment({ orderId, total }: Props) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!
  return (
    <PayPalScriptProvider options={{ clientId: clientId, currency: 'USD' }}>
      <PayPalButtons
        style={{ layout: 'vertical', color: 'silver' }}
        createOrder={(data, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [
              {
                description: `Pedido #${orderId}`,
                amount: {
                  value: total.toFixed(2),
                  currency_code: 'USD',
                },
              },
            ],
          })
        }}
        onApprove={async (data, actions) => {
          if (!actions.order) return
          const details = await actions.order.capture()
          console.log('Pago capturado', details)
          // Aquí puedes actualizar la orden en Supabase a 'pagado'
          window.location.href = `/checkout/success?orderId=${orderId}`
        }}
        onError={(err) => {
          console.error(err)
          alert('Error al procesar el pago con PayPal')
        }}
      />
    </PayPalScriptProvider>
  )
}