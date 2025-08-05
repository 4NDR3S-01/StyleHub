'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, User, Menu, X, Heart, MapPin, CreditCard, Settings, LogOut } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import CartSidebar from '../cart/CartSidebar';
import WishlistSidebar from '../wishlist/WishlistSidebar';
import AuthModal from '../auth/AuthModal';
import UserAvatar from '../ui/UserAvatar';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const { itemsCount, toggleCart } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { user, logout } = useAuth();
  
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const wishlistButtonRef = useRef<HTMLButtonElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);

  const navigation = [
    { name: 'Mujeres', href: '/category/women' },
    { name: 'Hombres', href: '/category/men' },
    { name: 'Accesorios', href: '/category/accessories' },
    { name: 'Zapatos', href: '/category/shoes' },
    { name: 'Ofertas', href: '/sale' },
  ];

  // Handle escape key to close menus
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
        setIsWishlistOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Handle click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsUserMenuOpen(false);
  };

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsMenuOpen(false);
  };

  const handleWishlistToggle = () => {
    setIsWishlistOpen(!isWishlistOpen);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <>
      <nav 
        className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 shadow-xl border-b border-slate-600/30 sticky top-0 z-50 backdrop-blur-md"
        role="navigation"
        aria-label="Navegación principal"
      >
        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E\")"
          }}></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                ref={menuButtonRef}
                onClick={handleMenuToggle}
                className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Logo mejorado */}
            <Link 
              href="/" 
              className="flex items-center group focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
              aria-label="Ir a la página principal"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ff6f61] via-[#e84855] to-[#d7263d] rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg group-hover:scale-105 transition-all duration-300">
                  StyleHub
                </span>
              </div>
            </Link>

            {/* Desktop Navigation mejorado */}
            <nav className="hidden md:flex items-center space-x-2" role="navigation" aria-label="Navegación de categorías">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 hover:bg-white/10 group overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label={`Ir a ${item.name}`}
                >
                  <span className="relative z-10">{item.name}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </Link>
              ))}
            </nav>

            {/* Right side icons mejorados */}
            <div className="flex items-center space-x-3">
              <button 
                ref={searchButtonRef}
                className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Buscar productos"
              >
                <Search size={20} className="group-hover:scale-110 transition-transform duration-200" />
              </button>
              
              <button 
                ref={wishlistButtonRef}
                onClick={handleWishlistToggle}
                className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-white/50 relative"
                aria-label="Ver lista de deseos"
              >
                <Heart size={20} className="group-hover:scale-110 transition-transform duration-200" />
                {wishlistItems.length > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse shadow-lg ring-2 ring-white/30"
                    aria-label={`${wishlistItems.length} items en lista de deseos`}
                  >
                    {wishlistItems.length}
                  </span>
                )}
              </button>
              
              {/* Botón de usuario mejorado */}
              {user ? (
                <div className="relative group" ref={userMenuRef}>
                  <button 
                    onClick={handleUserMenuToggle}
                    className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                    aria-label="Menú de usuario"
                  >
                    <User size={20} className="group-hover:scale-110 transition-transform duration-200" />
                  </button>
                  <div 
                    className={`absolute right-0 mt-2 w-64 bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-50 transition-all duration-300 border border-white/20 ${
                      isUserMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    {/* Header del usuario */}
                    <div className="px-4 py-3 border-b border-gray-200/50">
                      <div className="flex items-center space-x-3">
                        <UserAvatar 
                          src={user.avatar} 
                          name={user.name || 'Usuario'} 
                          size="md" 
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{user.name || 'Usuario'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Opciones del menú */}
                    <div className="py-2">
                      {/* Opción de panel de administración solo para admin */}
                      {user.role === 'admin' && (
                        <Link 
                          href="/admin" 
                          className="flex items-center px-4 py-3 text-sm text-purple-700 hover:bg-gradient-to-r hover:from-purple-100/80 hover:to-transparent transition-all duration-200 group focus:outline-none focus:bg-purple-100/80"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                            <Settings size={16} className="text-purple-600" />
                          </div>
                          <span className="font-medium">Panel Administrador</span>
                        </Link>
                      )}
                      {/* Editar direcciones del usuario */}
                      <Link 
                        href="/perfil/addresses" 
                        className="flex items-center px-4 py-3 text-sm text-blue-700 hover:bg-gradient-to-r hover:from-blue-100/80 hover:to-transparent transition-all duration-200 group focus:outline-none focus:bg-blue-100/80"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                          <MapPin size={16} className="text-blue-600" />
                        </div>
                        <span className="font-medium">Mis Direcciones</span>
                      </Link>
                      
                      {/* Métodos de pago del usuario */}
                      <Link 
                        href="/perfil/payment-methods" 
                        className="flex items-center px-4 py-3 text-sm text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-100/80 hover:to-transparent transition-all duration-200 group focus:outline-none focus:bg-emerald-100/80"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-emerald-200 transition-colors">
                          <CreditCard size={16} className="text-emerald-600" />
                        </div>
                        <span className="font-medium">Métodos de Pago</span>
                      </Link>
                      {/* Mi perfil */}
                      <Link 
                        href="/perfil" 
                        className="flex items-center px-4 py-3 text-sm text-blue-700 hover:bg-gradient-to-r hover:from-blue-100/80 hover:to-transparent transition-all duration-200 group focus:outline-none focus:bg-blue-100/80"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <span className="font-medium">Mi Perfil</span>
                      </Link>
                      
                      <Link 
                        href="/perfil/orders" 
                        className="flex items-center px-4 py-3 text-sm text-green-700 hover:bg-gradient-to-r hover:from-green-100/80 hover:to-transparent transition-all duration-200 group focus:outline-none focus:bg-green-100/80"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                          <ShoppingBag size={16} className="text-green-600" />
                        </div>
                        <span className="font-medium">Mis Pedidos</span>
                      </Link>

                      {/* Línea divisoria */}
                      <div className="border-t border-gray-200/50 my-2"></div>
                      
                      {/* Carrito */}
                      <button 
                        onClick={() => {
                          toggleCart();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-orange-700 hover:bg-gradient-to-r hover:from-orange-100/80 hover:to-transparent transition-all duration-200 group focus:outline-none focus:bg-orange-100/80"
                        role="menuitem"
                      >
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-orange-200 transition-colors">
                          <ShoppingBag size={16} className="text-orange-600" />
                        </div>
                        <div className="flex items-center justify-between flex-1">
                          <span className="font-medium">Mi Carrito</span>
                          {itemsCount > 0 && (
                            <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                              {itemsCount}
                            </span>
                          )}
                        </div>
                      </button>
                      
                      {/* Wishlist */}
                      <button 
                        onClick={() => {
                          handleWishlistToggle();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-pink-700 hover:bg-gradient-to-r hover:from-pink-100/80 hover:to-transparent transition-all duration-200 group focus:outline-none focus:bg-pink-100/80"
                        role="menuitem"
                      >
                        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-pink-200 transition-colors">
                          <Heart size={16} className="text-pink-600" />
                        </div>
                        <div className="flex items-center justify-between flex-1">
                          <span className="font-medium">Lista de Deseos</span>
                          {wishlistItems.length > 0 && (
                            <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                              {wishlistItems.length}
                            </span>
                          )}
                        </div>
                      </button>
                      
                      {/* Botón de logout */}
                      <div className="border-t border-gray-200/50 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50/80 hover:to-transparent transition-all duration-200 group focus:outline-none focus:bg-red-50/80"
                          role="menuitem"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                            <LogOut size={16} className="text-red-600" />
                          </div>
                          <span className="font-medium">Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Iniciar sesión o registrarse"
                >
                  <User size={20} className="group-hover:scale-110 transition-transform duration-200" />
                </button>
              )}
              
              {/* Botón del carrito mejorado */}
              <button
                ref={cartButtonRef}
                onClick={toggleCart}
                className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative group focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label={`Ver carrito (${itemsCount} items)`}
              >
                <ShoppingBag size={20} className="group-hover:scale-110 transition-transform duration-200" />
                {itemsCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-gradient-to-r from-[#ff6f61] to-[#d7263d] text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse shadow-lg ring-2 ring-white/30"
                    aria-label={`${itemsCount} items en el carrito`}
                  >
                    {itemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation mejorado */}
        {isMenuOpen && (
          <div 
            id="mobile-menu"
            className="md:hidden bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border-t border-white/20"
            role="menu"
            aria-labelledby="mobile-menu-button"
          >
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block py-3 px-4 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg transition-all duration-300 font-medium backdrop-blur-md border border-white/10 hover:border-white/30 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                  onClick={() => setIsMenuOpen(false)}
                  role="menuitem"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Elementos decorativos sutiles */}
        <div className="absolute top-1 right-1/4 w-4 h-4 bg-white/10 rounded-full animate-pulse pointer-events-none" aria-hidden="true"></div>
        <div className="absolute bottom-1 left-1/3 w-3 h-3 bg-gradient-to-br from-[#ff6f61]/20 to-[#d7263d]/20 rounded-full animate-pulse pointer-events-none" aria-hidden="true"></div>
      </nav>

      <CartSidebar />
      <WishlistSidebar isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}