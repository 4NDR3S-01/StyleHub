'use client';

import Link from 'next/link';
import { HomeIcon, ShoppingBagIcon, GroupIcon, TagIcon, CogIcon, ClipboardListIcon, MessageSquareIcon, PencilIcon, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { name: 'Dashboard', icon: HomeIcon, href: '/admin' },
  { name: 'Ordenes', icon: ShoppingBagIcon, href: '/admin/ordenes' },
  { name: 'Clientes', icon: GroupIcon, href: '/admin/clientes' },
  { name: 'Productos', icon: ClipboardListIcon, href: '/admin/productos' },
  { name: 'Categorias', icon: TagIcon, href: '/admin/categorias' },
  { name: 'Cupones', icon: PencilIcon, href: '/admin/cupones' },
  { name: 'Reseñas', icon: MessageSquareIcon, href: '/admin/resenas' },
];

export default function AdminSidebar() {
  const [configOpen, setConfigOpen] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Botón hamburguesa solo visible en móvil */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white border border-slate-200 rounded-full p-2 shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
      </button>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 backdrop-blur-xl shadow-2xl flex flex-col p-6 border-r border-white/20 overflow-y-auto transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:fixed md:block`}
        style={{ 
          minHeight: '100vh', 
          width: '16rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)'
        }}
        aria-label="Sidebar"
      >
        {/* Botón cerrar solo en móvil */}
        <button
          className="md:hidden absolute top-4 right-4 bg-slate-100 rounded-full p-1"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" /></svg>
        </button>
        <div className="flex items-center mb-8 mt-8 md:mt-0 relative">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg mr-3">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">StyleHub</span>
            <span className="text-xs bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full font-semibold shadow-sm">ADMIN</span>
          </div>
          {/* Decoración */}
          <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-red-500/20 to-transparent rounded-full blur-lg"></div>
        </div>
        <nav className="flex-1 space-y-2">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.href} 
                  className="relative flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50/80 hover:via-red-100/50 hover:to-transparent hover:text-red-600 transition-all duration-300 group overflow-hidden rounded-xl"
                  onClick={() => setOpen(false)}
                >
                  <div className="relative z-10 w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mr-3 group-hover:from-red-100/80 group-hover:to-red-200/60 group-hover:scale-110 transition-all duration-300 shadow-sm">
                    <item.icon size={18} className="text-gray-600 group-hover:text-red-600 transition-colors" />
                  </div>
                  <span className="relative z-10 font-medium">{item.name}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-red-100/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500 rounded-xl"></div>
                </Link>
              </li>
            ))}
            {/* Configuración con submenú */}
            <li>
              <button
                type="button"
                className="relative flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50/80 hover:via-purple-100/50 hover:to-transparent hover:text-purple-600 transition-all duration-300 group overflow-hidden rounded-xl focus:outline-none"
                onClick={() => setConfigOpen((v) => !v)}
              >
                <div className="relative z-10 w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mr-3 group-hover:from-purple-100/80 group-hover:to-purple-200/60 group-hover:scale-110 transition-all duration-300 shadow-sm">
                  <CogIcon size={18} className="text-gray-600 group-hover:text-purple-600 transition-colors" />
                </div>
                <span className="relative z-10 font-medium flex-1 text-left">Configuración</span>
                <ChevronDown size={16} className={`relative z-10 text-gray-500 group-hover:text-purple-500 transition-all duration-300 ${configOpen ? 'rotate-180' : ''}`} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/30 to-purple-100/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500 rounded-xl"></div>
              </button>
              {configOpen && (
                <div className="ml-8 mt-2 space-y-1">
                  <Link 
                    href="/admin/configuracion-de-cuenta" 
                    className="relative flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gradient-to-r hover:from-purple-50/60 hover:to-transparent hover:text-purple-600 transition-all duration-300 group overflow-hidden rounded-lg"
                    onClick={() => setOpen(false)}
                  >
                    <div className="relative z-10 w-6 h-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-md flex items-center justify-center mr-2 group-hover:from-purple-50 group-hover:to-purple-100 transition-all duration-300">
                      <div className="w-2 h-2 bg-gray-400 rounded-full group-hover:bg-purple-500 transition-colors"></div>
                    </div>
                    <span className="relative z-10 font-medium">Configuraciones de la cuenta</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/20 to-purple-100/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 rounded-lg"></div>
                  </Link>
                </div>
              )}
            </li>
          </ul>
          
          {/* Elementos decorativos del sidebar */}
          <div className="absolute bottom-20 left-4 w-16 h-16 bg-gradient-to-tr from-red-500/10 via-red-500/5 to-transparent rounded-full blur-xl"></div>
          <div className="absolute top-32 right-4 w-12 h-12 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-lg"></div>
        </nav>
      </aside>
      {/* Fondo oscuro al abrir menú en móvil */}
      {open && (
        <button
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          aria-label="Cerrar menú"
        />
      )}
    </>
  );
}
