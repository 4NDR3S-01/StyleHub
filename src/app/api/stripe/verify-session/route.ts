import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-07-30.basil',
    });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID requerido' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent', 'customer'],
    });

    return NextResponse.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email,
      payment_intent: session.payment_intent,
      line_items: session.line_items,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error('Error verificando sesión:', error);
    return NextResponse.json(
      { error: 'Error al verificar sesión' },
      { status: 500 }
    );
  }
}
