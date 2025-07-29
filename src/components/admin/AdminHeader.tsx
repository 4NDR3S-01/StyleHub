'use client';

import Link from 'next/link';
import { User, Home, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from "react-dom";
import supabase from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

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
  const { logout } = useAuth();

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
                  className="fixed w-56 bg-white shadow-lg rounded-lg py-2 border border-gray-200 z-50"
                  style={{
                    position: "absolute",
                    top: menuPos.top,
                    left: menuPos.left,
                  }}
                >
                  {/* Header del menú con info del admin */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={user?.name || 'Avatar'}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <User size={18} className="text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.name || 'Administrador'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Panel de Administración
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Opciones del menú */}
                  <div className="py-1">
                    <Link 
                      href="/admin/configuracion-de-cuenta"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Configuración de Cuenta
                    </Link>

                    <button
                      onClick={async () => {
                        try {
                          await logout();
                          setMenuOpen(false);
                        } catch (error) {
                          console.error('Error al cerrar sesión:', error);
                          setMenuOpen(false);
                        }
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar Sesión
                    </button>
                  </div>
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
