'use client';

import { X, Plus, Minus, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '@/utils/currency';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartSidebar() {
  const { state, toggleCart, updateQuantity, removeItem, subtotal } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleCheckoutClick = () => {
    if (!user) {
      // Guardar la URL de checkout para redirigir después del login
      sessionStorage.setItem('redirectAfterLogin', '/checkout');
      toggleCart(); // Cerrar el carrito
      // Disparar evento para abrir el modal de autenticación
      window.dispatchEvent(new CustomEvent('openAuthModal'));
    } else {
      // Usuario autenticado, ir directo al checkout
      toggleCart(); // Cerrar el carrito
      router.push('/checkout');
    }
  };

  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={toggleCart}
        aria-label="Cerrar carrito"
        type="button"
      />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-slate-900">Carrito de Compras</h2>
            <button
              onClick={toggleCart}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {state.items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Tu carrito está vacío</p>
                <Link
                  href="/category/all"
                  onClick={toggleCart}
                  className="inline-block mt-4 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Comenzar a Comprar
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {state.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img
                      src={item.producto.images?.[0] || '/placeholder.jpg'}
                      alt={item.producto.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.producto.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.variant?.size && `Size: ${item.variant.size}`}
                        {item.variant?.color && ` | Color: ${item.variant.color}`}
                      </p>
                      <p className="font-semibold text-lg">{formatPrice(item.producto.price)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {state.items.length > 0 && (
            <div className="border-t p-6 space-y-4">
              <div className="flex items-center justify-between text-xl font-semibold">
                <span>Total de Productos:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              {!user ? (
                <div className="space-y-3">
                  <button
                    onClick={handleCheckoutClick}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold text-center hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <User size={20} />
                    Iniciar Sesión para Comprar
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Necesitas una cuenta para proceder con tu compra
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleCheckoutClick}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold text-center hover:bg-slate-800 transition-colors"
                >
                  Finalizar Compra
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}