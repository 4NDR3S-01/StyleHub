'use client';

import Link from 'next/link';
import { HomeIcon, ShoppingBagIcon, TagIcon, CogIcon, ClipboardListIcon, MessageSquareIcon, PencilIcon, ChevronDown, PaletteIcon } from 'lucide-react';
import { useState } from 'react';


const menuItems = [
  { name: 'Dashboard', icon: HomeIcon, href: '/admin' },
  { name: 'Ordenes', icon: ShoppingBagIcon, href: '/admin/ordenes' },
  { name: 'Productos', icon: ClipboardListIcon, href: '/admin/productos' },
  { name: 'Categorias', icon: TagIcon }, // Agregado para el submenú
  { name: 'Cupones', icon: PencilIcon, href: '/admin/cupones' },
  { name: 'Reseñas', icon: MessageSquareIcon, href: '/admin/resenas' },
];

export default function AdminSidebar() {
  const [configOpen, setConfigOpen] = useState(false);
  const [categoriasOpen, setCategoriasOpen] = useState(false);
  const [personalizacionOpen, setPersonalizacionOpen] = useState(false);
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
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white shadow-lg flex flex-col p-4 border-r border-slate-100 overflow-y-auto transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:fixed md:block`}
        style={{ minHeight: '100vh', width: '16rem' }}
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
        <div className="flex items-center mb-8 mt-8 md:mt-0">
          <span className="font-bold text-xl text-red-700">StyleHub</span>
          <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">administrador</span>
        </div>
        <nav className="flex-1">
          <ul>
            {menuItems.map((item) => {
              if (item.name === 'Categorias') {
                // Submenú para categorías
                return (
                  <li key={item.name} className="mb-2">
                    <button
                      type="button"
                      className="flex items-center w-full px-3 py-2 rounded hover:bg-red-50 text-gray-700 focus:outline-none"
                      onClick={() => setCategoriasOpen((v) => !v)}
                    >
                      <TagIcon size={20} className="mr-3 text-red-600" />
                      Categorías
                      <ChevronDown size={16} className={`ml-auto text-slate-500 transition-transform ${categoriasOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {categoriasOpen && (
                      <ul className="ml-8 mt-1">
                        <li>
                          <Link href="/admin/categorias" className="flex items-center px-2 py-2 rounded hover:bg-red-100 text-gray-700" onClick={() => setOpen(false)}>
                            Gestión de categorías
                          </Link>
                        </li>
                        <li>
                          <Link href="/admin/subcategorias" className="flex items-center px-2 py-2 rounded hover:bg-red-100 text-gray-700" onClick={() => setOpen(false)}>
                            Gestión de subcategorías
                          </Link>
                        </li>
                      </ul>
                    )}
                  </li>
                );
              }
              return (
                <li key={item.name} className="mb-2">
                  {item.href ? (
                    <Link href={item.href} className="flex items-center px-3 py-2 rounded hover:bg-red-50 text-gray-700" onClick={() => setOpen(false)}>
                      <item.icon size={20} className="mr-3 text-red-600" />
                      {item.name}
                    </Link>
                  ) : null}
                </li>
              );
            })}
            {/* Configuración con submenú */}
            <li className="mb-2">
              <button
                type="button"
                className="flex items-center w-full px-3 py-2 rounded hover:bg-red-50 text-gray-700 focus:outline-none"
                onClick={() => setConfigOpen((v) => !v)}
              >
                <CogIcon size={20} className="mr-3 text-red-600" />
                Configuración
                <ChevronDown size={16} className={`ml-auto text-slate-500 transition-transform ${configOpen ? 'rotate-180' : ''}`} />
              </button>
              {configOpen && (
                <ul className="ml-8 mt-1">
                  <li>
                    <Link href="/admin/configuracion-de-cuenta" className="flex items-center px-2 py-2 rounded hover:bg-red-100 text-gray-700" onClick={() => setOpen(false)}>
                      Configuraciones de la cuenta
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/usuarios" className="flex items-center px-2 py-2 rounded hover:bg-red-100 text-gray-700" onClick={() => setOpen(false)}>
                      Gestión de usuarios
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            {/* Personalización con submenú */}
            <li className="mb-2">
              <button
                type="button"
                className="flex items-center w-full px-3 py-2 rounded hover:bg-red-50 text-gray-700 focus:outline-none"
                onClick={() => setPersonalizacionOpen((v) => !v)}
              >
                <PaletteIcon size={20} className="mr-3 text-red-600" />
                Personalización
                <ChevronDown size={16} className={`ml-auto text-slate-500 transition-transform ${personalizacionOpen ? 'rotate-180' : ''}`} />
              </button>
              {personalizacionOpen && (
                <ul className="ml-8 mt-1">
                  <li>
                    <Link href="/admin/personalizacion/temas" className="flex items-center px-2 py-2 rounded hover:bg-red-100 text-gray-700" onClick={() => setOpen(false)}>
                      Temas y colores
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/personalizacion/logos" className="flex items-center px-2 py-2 rounded hover:bg-red-100 text-gray-700" onClick={() => setOpen(false)}>
                      Logos y branding
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/personalizacion/banners" className="flex items-center px-2 py-2 rounded hover:bg-red-100 text-gray-700" onClick={() => setOpen(false)}>
                      Banners y promociones
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/personalizacion/footer" className="flex items-center px-2 py-2 rounded hover:bg-red-100 text-gray-700" onClick={() => setOpen(false)}>
                      Footer y enlaces
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
      </aside>
      {/* Fondo oscuro al abrir menú en móvil */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          aria-label="Cerrar menú"
          tabIndex={0}
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setOpen(false);
            }
          }}
          style={{ cursor: 'pointer' }}
        />
      )}
    </>
  );
}
