import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400 }
      );
    }

    // Capturar el pago en PayPal
    const response = await fetch(`${process.env.PAYPAL_API_URL}/v2/checkout/orders/${order_id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getPayPalAccessToken()}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error capturing PayPal payment');
    }

    const capture = data.purchase_units[0].payments.captures[0];

    return NextResponse.json({
      capture_id: capture.id,
      status: capture.status,
      amount: capture.amount.value,
      currency: capture.amount.currency_code,
      transaction_id: capture.id,
    });

  } catch (error: any) {
    console.error('Error capturing PayPal payment:', error);
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
