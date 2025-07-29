'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Search, ShoppingBag, User, Menu, X, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import CartSidebar from '../cart/CartSidebar';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userButtonPosition, setUserButtonPosition] = useState({ top: 0, right: 0 });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const { itemsCount, toggleCart } = useCart();
  const { user, logout, isLoading } = useAuth();

  // Función para abrir/cerrar el menú y calcular posición
  const toggleUserMenu = () => {
    if (!isUserMenuOpen && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      const menuWidth = 192; // 48 * 4 = w-48 en px
      const menuHeight = 200; // altura estimada del menú
      
      let top = rect.bottom + 8;
      let right = window.innerWidth - rect.right;
      
      // Ajustar si el menú se sale por la derecha
      if (right + menuWidth > window.innerWidth) {
        right = window.innerWidth - rect.left - menuWidth;
      }
      
      // Ajustar si el menú se sale por abajo
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 8; // Mostrar arriba del botón
      }
      
      // Asegurar que no sea negativo
      top = Math.max(8, top);
      right = Math.max(8, right);
      
      setUserButtonPosition({ top, right });
    }
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleScroll() {
      // Recalcular posición al hacer scroll si el menú está abierto
      if (isUserMenuOpen && userButtonRef.current) {
        const rect = userButtonRef.current.getBoundingClientRect();
        const menuWidth = 192;
        const menuHeight = 200;
        
        let top = rect.bottom + 8;
        let right = window.innerWidth - rect.right;
        
        // Ajustar si el menú se sale por la derecha
        if (right + menuWidth > window.innerWidth) {
          right = window.innerWidth - rect.left - menuWidth;
        }
        
        // Ajustar si el menú se sale por abajo
        if (top + menuHeight > window.innerHeight) {
          top = rect.top - menuHeight - 8;
        }
        
        // Asegurar que no sea negativo
        top = Math.max(8, top);
        right = Math.max(8, right);
        
        setUserButtonPosition({ top, right });
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true); // true para capturar en fase de captura
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isUserMenuOpen]);

  const navigation = [
    { name: 'Mujeres', href: '/category/women' },
    { name: 'Hombres', href: '/category/men' },
    { name: 'Accesorios', href: '/category/accessories' },
    { name: 'Zapatos', href: '/category/shoes' },
    { name: 'Ofertas', href: '/sale' },
  ];

  // Componente del menú desplegable que se renderiza como portal
  const UserMenuPortal = () => {
    if (!isUserMenuOpen || typeof window === 'undefined') return null;
    
    return createPortal(
      <div 
        className="fixed w-64 bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 backdrop-blur-2xl shadow-2xl rounded-3xl py-1 border border-white/20 transition-all duration-500 transform animate-in slide-in-from-top-2 fade-in-0 overflow-hidden"
        style={{ 
          top: userButtonPosition.top + 'px',
          right: userButtonPosition.right + 'px',
          zIndex: 999999,
          transform: 'translateZ(0)',
          isolation: 'isolate',
          maxHeight: 'calc(100vh - ' + (userButtonPosition.top + 20) + 'px)',
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.9), 0 0 60px rgba(255, 111, 97, 0.1)'
        }}
        ref={userMenuRef}
      >
        {/* Header del menú con info del usuario - Clickeable para ir al perfil */}
        <Link 
          href="/perfil"
          onClick={() => setIsUserMenuOpen(false)}
          className="relative block px-5 py-4 bg-gradient-to-r from-[#ff6f61]/8 via-[#d7263d]/5 to-[#ff6f61]/8 border-b border-white/30 hover:bg-gradient-to-r hover:from-[#ff6f61]/15 hover:via-[#d7263d]/10 hover:to-[#ff6f61]/15 transition-all duration-300 group"
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#ff6f61] via-[#e84855] to-[#d7263d] rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/50 group-hover:scale-105 transition-transform duration-300">
                <User size={22} className="text-white drop-shadow-sm" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text group-hover:from-[#d7263d] group-hover:to-[#ff6f61] transition-all duration-300">
                {user?.name || 'Usuario Invitado'}
              </p>
              <p className="text-xs text-gray-500 truncate font-medium group-hover:text-gray-600 transition-colors duration-300">
                {user?.email || 'usuario@stylehub.com'}
              </p>
              <div className="flex items-center mt-1">
                <div className="w-1 h-1 bg-[#ff6f61] rounded-full mr-1 group-hover:bg-[#d7263d] transition-colors duration-300"></div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold group-hover:text-gray-500 transition-colors duration-300">
                  {user?.role === 'admin' ? 'Administrador' : 'Cliente VIP'} • Ver Perfil
                </span>
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-5 h-5 text-[#d7263d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          {/* Decoración del header */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#ff6f61]/20 to-transparent rounded-full blur-xl group-hover:from-[#ff6f61]/30 transition-all duration-300"></div>
        </Link>

        {/* Opciones del menú */}
        <div className="py-3">
          {user?.role === 'admin' && (
            <Link 
              href="/admin" 
              className="relative flex items-center px-5 py-4 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-100/80 hover:via-purple-50 hover:to-transparent hover:text-purple-700 transition-all duration-300 group overflow-hidden"
              onClick={() => setIsUserMenuOpen(false)}
            >
              <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-purple-200 group-hover:to-purple-300 group-hover:scale-110 transition-all duration-300 shadow-sm">
                <svg className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="relative z-10 flex-1">
                <span className="font-semibold block">Panel Admin</span>
                <span className="text-xs text-purple-400">Control total del sistema</span>
              </div>
              <span className="relative z-10 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                ADMIN
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-purple-200/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            </Link>
          )}
        </div>

        {/* Footer del menú con botón de logout */}
        <div className="border-t border-white/20 pt-2 bg-gradient-to-t from-gray-50/30 to-transparent">
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              if (isLoggingOut) return;
              
              setIsLoggingOut(true);
              try {
                setIsUserMenuOpen(false);
                await logout();
              } catch (error) {
                console.error('Error al cerrar sesión:', error);
                alert('Error al cerrar sesión. Inténtalo de nuevo.');
              } finally {
                setIsLoggingOut(false);
              }
            }}
            disabled={isLoggingOut}
            type="button"
            className={`relative flex items-center w-full px-5 py-4 text-sm text-red-600 transition-all duration-300 group overflow-hidden ${
              isLoggingOut 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gradient-to-r hover:from-red-50/80 hover:via-red-100/50 hover:to-transparent cursor-pointer'
            }`}
          >
            <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center mr-4 group-hover:from-red-100 group-hover:to-red-200 group-hover:scale-110 transition-all duration-300 shadow-sm">
              {isLoggingOut ? (
                <svg className="w-5 h-5 text-red-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              )}
            </div>
            <div className="relative z-10 flex-1 text-left">
              <span className="font-semibold block text-red-600">
                {isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
              </span>
              <span className="text-xs text-red-400">
                {isLoggingOut ? 'Por favor espera' : 'Salir de forma segura'}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-red-100/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
          </button>
        </div>

        {/* Elementos decorativos mejorados */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff6f61]/15 via-[#ff6f61]/8 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-[#d7263d]/15 via-[#d7263d]/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-r from-transparent via-[#ff6f61]/5 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        
        {/* Borde interior luminoso */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-white/10 pointer-events-none"></div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 overflow-hidden shadow-lg sticky top-0 z-[99999]">
        {/* Animated background patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-pulse pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="w-full h-full bg-repeat animate-pulse" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }}></div>
        </div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-1 right-1/4 w-6 h-6 bg-white/10 rounded-full animate-bounce delay-1000 pointer-events-none"></div>
        <div className="absolute bottom-1 left-1/3 w-4 h-4 bg-gradient-to-br from-[#ff6f61]/20 to-[#d7263d]/20 rounded-full animate-bounce delay-500 pointer-events-none"></div>
        <div className="absolute top-2 left-1/2 w-3 h-3 bg-[#d7263d]/30 rounded-full animate-pulse delay-700 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 relative z-10"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Logo */}
            <Link href="/" className="flex items-center group relative z-10">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg group-hover:scale-105 transition-all duration-300 transform">
                  StyleHub
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 relative z-10">
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
            <div className="flex items-center space-x-3 relative z-10">
              <button className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative z-20">
                <Search size={20} />
              </button>
              <button className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative z-20">
                <Heart size={20} />
              </button>
              {!isLoading && user ? (
                <div className="relative z-20">
                  <button 
                    ref={userButtonRef}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleUserMenu();
                    }}
                    className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
                    type="button"
                  >
                    <User size={20} />
                  </button>
                </div>
              ) : (
                <>
                  {!isLoading ? (
                    <Link
                      href="/login"
                      className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative z-20"
                    >
                      <User size={20} />
                    </Link>
                  ) : (
                    <div className="p-2 text-white/50 rounded-lg backdrop-blur-md border border-white/20 relative z-20">
                      <User size={20} />
                    </div>
                  )}
                </>
              )}
              <button
                onClick={toggleCart}
                className="p-2 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg backdrop-blur-md border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative z-20"
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
      <UserMenuPortal />
      <CartSidebar />
    </>
  );
}