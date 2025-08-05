import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Validate environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

if (!process.env.NEXT_PUBLIC_BASE_URL) {
  throw new Error('NEXT_PUBLIC_BASE_URL is not configured');
}

export async function POST(req: NextRequest) {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Parse and validate request body
    const body = await req.json();
    const { cartItems, email } = body;

    // Validate required fields
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Validate cart items structure
    const line_items = cartItems.map((item: any, index: number) => {
      if (!item.producto || !item.producto.name || !item.producto.price) {
        throw new Error(`Invalid product data at index ${index}`);
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Invalid quantity at index ${index}`);
      }

      if (item.producto.price <= 0) {
        throw new Error(`Invalid price at index ${index}`);
      }

      return {
        price_data: {
          currency: 'cop',
          product_data: {
            name: item.producto.name,
            description: item.producto.description || '',
            images: item.producto.images || [],
          },
          unit_amount: Math.round(item.producto.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Calculate total for validation
    const total = cartItems.reduce((sum: number, item: any) => {
      return sum + (item.producto.price * item.quantity);
    }, 0);

    if (total <= 0) {
      return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      customer_email: email.trim().toLowerCase(),
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orden-confirmada?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?cancelled=true`,
      metadata: {
        email: email.trim().toLowerCase(),
        item_count: cartItems.length.toString(),
        total_amount: total.toString(),
      },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['CO'], // Colombia only for now
      },
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    return NextResponse.json({ 
      id: session.id, 
      url: session.url,
      session_id: session.id 
    });

  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json({ 
        error: 'Payment method was declined. Please try a different card.' 
      }, { status: 400 });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ 
        error: 'Invalid request. Please check your payment details.' 
      }, { status: 400 });
    }
    
    if (error.type === 'StripeAPIError') {
      return NextResponse.json({ 
        error: 'Payment service temporarily unavailable. Please try again later.' 
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 });
  }
}
