'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, User, Menu, X, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import CartSidebar from '../cart/CartSidebar';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { itemsCount, toggleCart } = useCart();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Mujeres', href: '/category/women' },
    { name: 'Hombres', href: '/category/men' },
    { name: 'Accesorios', href: '/category/accessories' },
    { name: 'Zapatos', href: '/category/shoes' },
    { name: 'Ofertas', href: '/sale' },
  ];

  return (
    <>
      <nav className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 overflow-hidden shadow-lg sticky top-0 z-50">
        {/* Animated background patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="w-full h-full bg-repeat animate-pulse" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }}></div>
        </div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-1 right-1/4 w-6 h-6 bg-white/10 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-1 left-1/3 w-4 h-4 bg-gradient-to-br from-[#ff6f61]/20 to-[#d7263d]/20 rounded-full animate-bounce delay-500"></div>
        <div className="absolute top-2 left-1/2 w-3 h-3 bg-[#d7263d]/30 rounded-full animate-pulse delay-700"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg group-hover:scale-105 transition-all duration-300 transform">
                  StyleHub
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-white/90 hover:text-white hover:bg-white/20 px-3 py-2 rounded-lg backdrop-blur-md border border-white/10 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-3">
              <button className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                <Search size={20} />
              </button>
              <button className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                <Heart size={20} />
              </button>
              {user ? (
                <div className="relative group">
                  <button className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                    <User size={20} />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl py-2 z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/20">
                    <Link href="/perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                      Perfil
                    </Link>
                    <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                      Pedidos
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <User size={20} />
                </Link>
              )}
              <button
                onClick={toggleCart}
                className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative"
              >
                <ShoppingBag size={20} />
                {itemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                    {itemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-md border-t border-white/20">
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block py-2 px-3 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg transition-all duration-300 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      <CartSidebar />
    </>
  );
}