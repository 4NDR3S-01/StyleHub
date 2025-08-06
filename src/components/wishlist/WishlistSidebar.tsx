'use client';

import { X, Heart, Eye } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice } from '@/utils/currency';
import Link from 'next/link';

interface WishlistSidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function WishlistSidebar({ isOpen, onClose }: WishlistSidebarProps) {
  const { items, toggleWishlist } = useWishlist();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-label="Cerrar lista de deseos"
      />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Heart className="text-pink-500" size={24} />
              Lista de Deseos
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Heart className="text-gray-300 mb-4" size={64} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tu lista de deseos está vacía
                </h3>
                <p className="text-gray-500 mb-6">
                  Agrega productos que te gusten para verlos aquí
                </p>
                <Link
                  href="/category/women"
                  onClick={onClose}
                  className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Explorar Productos
                </Link>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.products?.main_image || '/placeholder-product.jpg'}
                        alt={item.products?.name || 'Producto'}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.products?.name || 'Producto sin nombre'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.products?.price || 0)}
                      </p>
                      {item.products?.discount_price && (
                        <p className="text-sm text-pink-600 font-semibold">
                          Oferta: {formatPrice(item.products.discount_price)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      <Link
                        href={`/product/${item.product_id}`}
                        onClick={onClose}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Ver producto"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => toggleWishlist(item.product_id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Quitar de lista de deseos"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-900">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>
              <Link
                href="/wishlist"
                onClick={onClose}
                className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
              >
                <Heart size={20} />
                Ver Lista Completa
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
