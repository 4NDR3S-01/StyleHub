'use client';

import { Fragment } from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function CartSidebar() {
  const { state, closeCart, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-slate-900">Shopping Cart</h2>
            <button
              onClick={closeCart}
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
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <Link
                  href="/category/women"
                  onClick={closeCart}
                  className="inline-block mt-4 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {state.items.map((item) => (
                  <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex items-center space-x-4">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">
                        Size: {item.size} | Color: {item.color}
                      </p>
                      <p className="font-semibold text-lg">${item.product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
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
                Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}