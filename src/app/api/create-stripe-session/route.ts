import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(req: Request) {
  try {
    const { orderId, total } = await req.json()
    // Crea la sesión de Checkout de Stripe. Usa una sola línea con el total.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Pedido #${orderId}`,
            },
            unit_amount: Math.round(total * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout/cancel`,
      metadata: { orderId },
    })
    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: 'Error creando sesión de Stripe' }, { status: 500 })
  }
}