'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Grid } from 'lucide-react';
import { useNavbarCategories } from '@/hooks/useNavbarCategories';

interface CategoriesMenuProps {
  readonly isMobile?: boolean;
  readonly onItemClick?: () => void;
}

export default function CategoriesMenu({ isMobile = false, onItemClick }: Readonly<CategoriesMenuProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { categories, loading } = useNavbarCategories();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Configuración para mostrar en navbar desktop
  const MAX_VISIBLE_CATEGORIES = 4;
  const visibleCategories = categories.slice(0, MAX_VISIBLE_CATEGORIES);
  const extraCategories = categories.slice(MAX_VISIBLE_CATEGORIES);
  const hasExtraCategories = extraCategories.length > 0;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveCategory(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveCategory(null);
    }, 300);
  };

  const handleItemClick = () => {
    setIsOpen(false);
    setActiveCategory(null);
    onItemClick?.();
  };

  if (loading) {
    return null;
  }

  if (isMobile) {
    // Versión móvil - lista simple
    return (
      <div className="space-y-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="block py-3 px-4 text-white hover:text-gray-100 hover:bg-white/20 rounded-lg transition-all duration-300 font-medium backdrop-blur-md border border-white/10 hover:border-white/30 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            onClick={handleItemClick}
          >
            {category.name}
          </Link>
        ))}
      </div>
    );
  }

  // Versión desktop
  return (
    <nav className="hidden md:flex items-center space-x-2" role="navigation" aria-label="Navegación de categorías">
      {/* Categorías visibles directamente */}
      {visibleCategories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.slug}`}
          className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 hover:bg-white/10 group overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label={`Ir a ${category.name}`}
        >
          <span className="relative z-10">{category.name}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
        </Link>
      ))}

      {/* Dropdown para categorías adicionales */}
      {hasExtraCategories && (
        <div className="relative">
          <button
            className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 hover:bg-white/10 group overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/50 flex items-center gap-2"
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label="Más categorías"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Grid size={16} />
            <span className="relative z-10">Más</span>
            <ChevronDown 
              size={16} 
              className={`relative z-10 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
          </button>

          {/* Dropdown Menu */}
          <div 
            ref={dropdownRef}
            className={`absolute top-full left-0 mt-2 w-80 bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 backdrop-blur-xl rounded-2xl shadow-2xl py-3 z-50 transition-all duration-300 border border-white/20 ${
              isOpen ? 'opacity-100 visible transform translate-y-0' : 'opacity-0 invisible transform -translate-y-2'
            }`}
            role="menu"
            aria-orientation="vertical"
            tabIndex={-1}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="px-4 py-2 border-b border-gray-200/50">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Grid size={16} className="text-gray-600" />
                Todas las Categorías
              </h3>
            </div>
            
            <div className="py-2 max-h-80 overflow-y-auto">
              {/* Mostrar todas las categorías en el dropdown */}
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-transparent transition-all duration-200 group focus:outline-none focus:bg-blue-50/80"
                  role="menuitem"
                  onClick={handleItemClick}
                  onMouseEnter={() => setActiveCategory(category.id)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  {category.image && (
                    <div className="w-12 h-8 rounded-lg overflow-hidden mr-3 border border-gray-200/50">
                      <img 
                        src={category.image} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      {category.name}
                    </div>
                    {category.description && activeCategory === category.id && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {category.description}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {categories.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Grid size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay categorías disponibles</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enlace a Ofertas */}
      <Link
        href="/sale"
        className="relative text-white/90 hover:text-white px-4 py-2 rounded-lg backdrop-blur-md border border-orange-400/30 hover:border-orange-300/50 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 hover:bg-orange-500/20 group overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-400/50"
        aria-label="Ver ofertas especiales"
      >
        <span className="relative z-10 text-orange-200 group-hover:text-orange-100">🔥 Ofertas</span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
      </Link>
    </nav>
  );
}
