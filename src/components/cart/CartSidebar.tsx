'use client';

import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';

export default function CartSidebar() {
  const { state, closeCart, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeCart}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            closeCart();
          }
        }}
        aria-label="Cerrar carrito"
      />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 backdrop-blur-xl shadow-2xl border-l border-white/20">
        <div className="flex h-full flex-col relative overflow-hidden">
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#ff6f61]/15 to-transparent rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-0 w-16 h-16 bg-gradient-to-tr from-[#d7263d]/15 to-transparent rounded-full blur-lg"></div>
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/30 bg-gradient-to-r from-[#ff6f61]/5 to-[#d7263d]/5 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff6f61] to-[#d7263d] rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Carrito de Compras
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:scale-110"
            >
              <X size={24} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 relative z-10">
            {state.items.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <ShoppingBag size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-6 font-medium">Tu carrito está vacío</p>
                <Link
                  href="/category/women"
                  onClick={closeCart}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6f61] to-[#d7263d] text-white px-8 py-4 rounded-2xl hover:from-[#d7263d] hover:to-[#ff6f61] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <span>Comenzar a Comprar</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={`${item.producto.id}-${item.size}-${item.color}`} className="flex items-center space-x-4">
                    <img
                      src={item.producto.images[0]}
                      alt={item.producto.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.producto.name}</h3>
                      <p className="text-sm text-gray-500">
                        Size: {item.size} | Color: {item.color}
                      </p>
                      <p className="font-semibold text-lg">${item.producto.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.producto.id, item.quantity - 1, item.size, item.color)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.producto.id, item.quantity + 1, item.size, item.color)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.producto.id, item.size, item.color)}
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
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold text-center block hover:bg-slate-800 transition-colors"
              >
                Finalizar Compra
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}