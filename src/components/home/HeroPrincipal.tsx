"use client";

// Importaciones necesarias para el componente
import Link from 'next/link';
import { usePersonalizationContext } from '@/context/PersonalizationContext';
import { useState, useEffect } from 'react';

/**
 * Componente Hero Principal
 * Sección principal de la landing page que presenta la propuesta de valor
 * Maneja banners dinámicos desde el panel de administración
 */
export default function HeroPrincipal() {
  // Context para obtener datos de personalización
  const { banners, loading } = usePersonalizationContext();
  const [heroBanner, setHeroBanner] = useState<any>(null);

  // Efecto para buscar y establecer el banner hero activo
  useEffect(() => {
    // Buscar banner de posición 'hero' activo y dentro del rango de fechas
    const activeHeroBanner = banners.find(banner => 
      banner.position === 'hero' && 
      banner.active &&
      (!banner.start_date || new Date(banner.start_date) <= new Date()) &&
      (!banner.end_date || new Date(banner.end_date) >= new Date())
    );
    setHeroBanner(activeHeroBanner);
  }, [banners]);

  // Estado de carga con spinner personalizado
  if (loading) {
    return (
      <div className="relative h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex items-center justify-center">
      {/* Imagen de fondo dinámica desde administración o gradiente por defecto */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: heroBanner?.image 
            ? `url(${heroBanner.image})` 
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        {/* Overlay oscuro para mejorar el contraste del texto */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      {/* Contenido principal del hero */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        {/* Título principal con contenido dinámico */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          {heroBanner?.title || 'Descubre Tu'}{' '}
          <span className="block bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg">
            {heroBanner?.subtitle || 'Estilo Perfecto'}
          </span>
        </h1>
        
        {/* Descripción personalizable */}
        <p className="text-xl md:text-2xl mb-8 text-gray-200">
          {heroBanner?.description || 'Moda premium que habla de tu individualidad. Colecciones seleccionadas para el estilo de vida moderno.'}
        </p>
        
        {/* Botones de acción principales */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* CTA primario - Texto personalizable desde admin */}
          <Link
            href="/category/women"
            className="bg-white text-slate-900 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
          >
            {heroBanner?.button_text || 'Comprar Mujeres'}
          </Link>
          
          {/* CTA secundario - Hombres */}
          <Link
            href="/category/men"
            className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-slate-900 transition-all duration-300 transform hover:scale-105"
          >
            Comprar Hombres
          </Link>
        </div>
      </div>

      {/* Indicador de scroll animado - UX mejorada */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}