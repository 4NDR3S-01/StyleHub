'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import UnifiedCheckout from '@/components/checkout/UnifiedCheckout';
import CheckoutProtectedRoute from '@/components/checkout/CheckoutProtectedRoute';

export default function TestCheckoutPage() {
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleOrderComplete = (orderId: string) => {
    console.log('Order completed:', orderId);
    clearCart();
    router.push(`/orden-confirmada?orderId=${orderId}`);
  };

  if (state.items.length === 0) {
    return (
      <CheckoutProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <div className="text-gray-400 text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h1>
            <p className="text-gray-600 mb-6">Agrega algunos productos antes de proceder al checkout</p>
            <a
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continuar comprando
            </a>
          </div>
        </div>
      </CheckoutProtectedRoute>
    );
  }

  return (
    <CheckoutProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Finalizar Compra</h1>
            <p className="mt-2 text-gray-600">
              Completa tu información para procesar tu pedido de forma segura
            </p>
          </div>
          
          <UnifiedCheckout 
            user={user}
            cartItems={state.items}
            onOrderComplete={handleOrderComplete}
          />
        </div>
      </div>
    </CheckoutProtectedRoute>
  );
}
