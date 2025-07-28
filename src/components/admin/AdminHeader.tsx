'use client';

import Link from 'next/link';
import { User, Home, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from "react-dom";
import supabase from '../../lib/supabaseClient';

const TITLES: Record<string, string> = {
  '/admin': 'Panel de Administración',
  '/admin/ordenes': 'Órdenes',
  '/admin/productos': 'Productos',
  '/admin/categorias': 'Categorías',
  '/admin/clientes': 'Clientes',
  '/admin/cupones': 'Cupones',
  '/admin/reseñas': 'Reseñas',
  '/admin/configuracion': 'Configuración',
};

type Props = {
  readonly onOpenSidebar?: () => void;
};

export default function AdminHeader({ onOpenSidebar }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<{ name: string; avatar: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setAvatarUrl('');
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('name, avatar')
        .eq('id', authUser.id)
        .single();
      if (error || !data) {
        setUser({ name: authUser.email || 'Usuario', avatar: '' });
        setAvatarUrl('');
      } else {
        setUser({ name: data.name || 'Usuario', avatar: data.avatar || '' });
        if (data.avatar) {
          const { data: urlData } = supabase.storage.from('avatar').getPublicUrl(data.avatar);
          setAvatarUrl(urlData.publicUrl);
        } else {
          setAvatarUrl('');
        }
      }
    }
    fetchUser();
  }, []);

  let title = TITLES[pathname] || '';
  if (!TITLES[pathname]) {
    const found = Object.keys(TITLES).find((key) => pathname.startsWith(key));
    if (found) title = TITLES[found];
  }

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Calcular posición del menú adaptativo
  useEffect(() => {
    if (menuOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const menuWidth = 224; // w-56 = 14rem = 224px
      const padding = 16;    // margen mínimo al borde
      let left = rect.left + window.scrollX;
      if (left + menuWidth + padding > window.innerWidth) {
        left = window.innerWidth - menuWidth - padding;
      }
      setMenuPos({
        top: rect.bottom + window.scrollY + 8,
        left,
      });
    }
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 px-4 py-5 bg-white border-b xm:px-8 border-gray-300" style={{ right: 0, left: 0, minWidth: 0 }}>
      <div className="w-full max-w-6xl mx-auto flex flex-row items-center gap-2">
        {/* Botón hamburguesa móvil */}
        {onOpenSidebar && (
          <button
            className="block lg:hidden mr-2 p-2 rounded-md hover:bg-slate-100"
            onClick={onOpenSidebar}
            aria-label="Abrir menú"
          >
            <svg className="w-7 h-7 text-slate-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        {title && (
          <h1 className="text-2xl font-bold text-red-700 tracking-tight whitespace-nowrap mr-4 text-left">
            {title}
          </h1>
        )}
        <div className="flex items-center gap-2 flex-wrap min-w-0 overflow-x-auto ml-auto">
          <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors">
            <Home size={18} className="text-red-600" />
            <span>Regresar al Inicio</span>
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors focus:outline-none"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <User size={18} className="text-red-600" />
              <span>Cuenta</span>
              <ChevronDown size={16} className={`ml-1 text-slate-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {/* Dropdown adaptativo en portal */}
            {menuOpen && menuPos && typeof window !== 'undefined'
              ? createPortal(
                <div
                  className="fixed w-64 bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 backdrop-blur-2xl shadow-2xl rounded-3xl py-1 border border-white/20 transition-all duration-500 transform animate-in slide-in-from-top-2 fade-in-0 overflow-hidden"
                  style={{
                    position: "absolute",
                    top: menuPos.top,
                    left: menuPos.left,
                    zIndex: 999999,
                    transform: 'translateZ(0)',
                    isolation: 'isolate',
                    maxHeight: 'calc(100vh - ' + (menuPos.top + 20) + 'px)',
                    boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.9), 0 0 60px rgba(255, 111, 97, 0.1)'
                  }}
                >
                  {/* Header del menú con info del admin - Clickeable para ir al perfil */}
                  <Link 
                    href="/perfil"
                    onClick={() => setMenuOpen(false)}
                    className="relative block px-5 py-4 bg-gradient-to-r from-purple-100/40 via-red-50/30 to-purple-100/40 border-b border-white/30 hover:bg-gradient-to-r hover:from-purple-100/60 hover:via-red-100/40 hover:to-purple-100/60 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/50 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={user?.name || 'Avatar'}
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            <User size={22} className="text-white drop-shadow-sm" />
                          )}
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text group-hover:from-red-600 group-hover:to-purple-600 transition-all duration-300">
                          {user?.name || 'Administrador'}
                        </p>
                        <p className="text-xs text-gray-500 truncate font-medium group-hover:text-gray-600 transition-colors duration-300">
                          Panel de Administración
                        </p>
                        <div className="flex items-center mt-1">
                          <div className="w-1 h-1 bg-red-500 rounded-full mr-1 group-hover:bg-purple-500 transition-colors duration-300"></div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold group-hover:text-gray-500 transition-colors duration-300">
                            Administrador • Ver Perfil
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    {/* Decoración del header */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-500/20 to-transparent rounded-full blur-xl group-hover:from-red-500/30 transition-all duration-300"></div>
                  </Link>

                  {/* Opciones del menú admin */}
                  <div className="py-3">
                    <Link 
                      href="/admin" 
                      className="relative flex items-center px-5 py-4 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50/80 hover:via-red-100/50 hover:to-transparent hover:text-red-600 transition-all duration-300 group overflow-hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-red-100/80 group-hover:to-red-200/60 group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="relative z-10 flex-1">
                        <span className="font-semibold block">Dashboard</span>
                        <span className="text-xs text-gray-400">Panel principal</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-red-100/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </Link>

                    <Link 
                      href="/admin/configuracion-de-cuenta" 
                      className="relative flex items-center px-5 py-4 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50/80 hover:via-purple-100/50 hover:to-transparent hover:text-purple-600 transition-all duration-300 group overflow-hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mr-4 group-hover:from-purple-100/80 group-hover:to-purple-200/60 group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <svg className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="relative z-10 flex-1">
                        <span className="font-semibold block">Configuración</span>
                        <span className="text-xs text-gray-400">Ajustes de cuenta</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/30 to-purple-100/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </Link>
                  </div>

                  {/* Footer del menú con botón de logout */}
                  <div className="border-t border-white/20 pt-2 bg-gradient-to-t from-gray-50/30 to-transparent">
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setMenuOpen(false);
                        window.location.href = '/';
                      }}
                      className="relative flex items-center w-full px-5 py-4 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50/80 hover:via-red-100/50 hover:to-transparent transition-all duration-300 group overflow-hidden"
                    >
                      <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center mr-4 group-hover:from-red-100 group-hover:to-red-200 group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <svg className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div className="relative z-10 flex-1 text-left">
                        <span className="font-semibold block text-red-600">Cerrar Sesión</span>
                        <span className="text-xs text-red-400">Salir del panel admin</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-red-100/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    </button>
                  </div>

                  {/* Elementos decorativos mejorados */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/15 via-red-500/8 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl animate-pulse"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-purple-500/15 via-purple-500/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl animate-pulse"></div>
                  <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-r from-transparent via-red-500/5 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                  
                  {/* Borde interior luminoso */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-transparent to-white/10 pointer-events-none"></div>
                </div>,
                document.body
              )
              : null}
          </div>
        </div>
      </div>
    </header>
  );
}
