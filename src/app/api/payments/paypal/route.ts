import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'USD', order_id } = body;

    // Crear la orden en PayPal
    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order_id,
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orden-confirmada`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
      },
    };

    const response = await fetch(`${process.env.PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getPayPalAccessToken()}`,
        'PayPal-Request-Id': order_id, // Para idempotencia
      },
      body: JSON.stringify(paypalOrder),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error creating PayPal order');
    }

    return NextResponse.json({
      order_id: data.id,
      approval_url: data.links.find((link: any) => link.rel === 'approve')?.href,
    });

  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const order_id = searchParams.get('order_id');

  if (!order_id) {
    return NextResponse.json(
      { error: 'order_id is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${process.env.PAYPAL_API_URL}/v2/checkout/orders/${order_id}`, {
      headers: {
        'Authorization': `Bearer ${await getPayPalAccessToken()}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error retrieving PayPal order');
    }

    return NextResponse.json({
      status: data.status,
      amount: data.purchase_units[0].amount.value,
      currency: data.purchase_units[0].amount.currency_code,
      payer: data.payer,
    });

  } catch (error: any) {
    console.error('Error retrieving PayPal order:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// Función para obtener el token de acceso de PayPal
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${process.env.PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || 'Error getting PayPal access token');
  }

  return data.access_token;
}
