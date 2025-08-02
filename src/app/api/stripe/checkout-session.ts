import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { cartItems, email } = await req.json();
    const line_items = cartItems.map((item: any) => ({
      price_data: {
        currency: 'cop',
        product_data: {
          name: item.producto.name,
        },
        unit_amount: Math.round(item.producto.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orden-confirmada?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?cancelled=true`,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
