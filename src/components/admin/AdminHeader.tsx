'use client';

import Link from 'next/link';
import { User, Home, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
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
  '/admin/configuracion-de-cuenta': 'Mi perfil',
  '/admin/usuarios': 'Gestión de Usuarios',
};

type Props = Readonly<{
  onOpenSidebar?: () => void;
}>;

export default function AdminHeader({ onOpenSidebar }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null); // referencia al botón
  const menuPortalRef = useRef<HTMLDivElement>(null); // referencia al menú real
  const [user, setUser] = useState<{ name: string; avatar: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Carga del usuario
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

  // Título dinámico
  let title = TITLES[pathname] || '';
  if (!TITLES[pathname]) {
    const found = Object.keys(TITLES).find((key) => pathname.startsWith(key));
    if (found) title = TITLES[found];
  }

  // Coloca el menú justo debajo del botón (por posición)
  const openMenu = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 224; // w-56 = 14rem
      const padding = 16;
      let left = rect.left + window.scrollX;
      if (left + menuWidth + padding > window.innerWidth) {
        left = window.innerWidth - menuWidth - padding;
      }
      setMenuPos({
        top: rect.bottom + window.scrollY + 8,
        left,
      });
      setMenuOpen(true);
    }
  }, []);

  // Cerrar menú cuando: click fuera o tecla ESC
  useEffect(() => {
    if (!menuOpen) return;

    function handleClick(e: MouseEvent) {
      if (
        menuPortalRef.current &&
        !menuPortalRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('keydown', handleEscape);
    // Bloquea scroll de fondo mientras el menú está abierto (opcional UX)
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Logout funcional
  async function handleLogout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.replace('/');
  }

  // Menú dropdown portal
  const menuDropdown = menuOpen && menuPos && typeof window !== "undefined"
    ? createPortal(
      <div
        ref={menuPortalRef}
        className="fixed w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-[9999] animate-fadeIn"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          minWidth: '12rem',
          maxWidth: 'calc(100vw - 1rem)',
        }}
        tabIndex={-1}
        role="menu"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 mb-2">
          <img
            src={avatarUrl || (user?.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=ff6f61&color=fff` : '/default-avatar.png')}
            alt={user?.name || 'Avatar'}
            className="w-10 h-10 rounded-full border border-slate-200"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 text-base leading-tight">{user?.name || 'Usuario'}</span>
            <span className="text-xs text-slate-400">Administrador</span>
          </div>
        </div>
        <Link
          href="/admin/configuracion-de-cuenta"
          className="block px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
          role="menuitem"
          tabIndex={0}
          onClick={() => setMenuOpen(false)}
        >
          Perfil
        </Link>
        <button
          className="block w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
          onClick={handleLogout}
          role="menuitem"
        >
          Cerrar sesión
        </button>
      </div>,
      document.body
    )
    : null;

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
          <div className="relative">
            <button
              ref={triggerRef}
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors focus:outline-none"
              onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              tabIndex={0}
            >
              <User size={18} className="text-red-600" />
              <span>Cuenta</span>
              <ChevronDown size={16} className={`ml-1 text-slate-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
            {/* El menú dropdown va como portal */}
            {menuDropdown}
          </div>
        </div>
      </div>
    </header>
  );
}
