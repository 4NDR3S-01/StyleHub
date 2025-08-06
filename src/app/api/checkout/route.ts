import { NextRequest, NextResponse } from 'next/server';
import { checkoutService } from '@/services/checkout.service';

export async function POST(request: NextRequest) {
  try {
    const checkoutData = await request.json();

    // Validar que el usuario esté autenticado (podrías agregar JWT validation aquí)
    if (!checkoutData.userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Procesar el checkout usando el servicio
    const result = await checkoutService.processCheckout(checkoutData);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in checkout API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
