'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Home, ArrowLeft, ShoppingBag, User } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/busqueda?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const popularCategories = [
    { name: 'Mujeres', href: '/category/women', icon: '👗' },
    { name: 'Hombres', href: '/category/men', icon: '👔' },
    { name: 'Accesorios', href: '/category/accessories', icon: '👜' },
    { name: 'Zapatos', href: '/category/shoes', icon: '👠' },
    { name: 'Ofertas', href: '/sale', icon: '🎉' },
  ];

  const quickActions = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Tienda', href: '/category/all', icon: ShoppingBag },
    { name: 'Mi Cuenta', href: '/perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-gray-200 mb-4">404</div>
          <div className="text-6xl mb-4">😔</div>
        </div>

        {/* Main Content */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ¡Ups! Página no encontrada
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          La página que buscas no existe o ha sido movida.
        </p>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Search size={16} />
              </Button>
            </div>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Acciones rápidas
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {quickActions.map((action) => (
              <Link key={action.name} href={action.href}>
                <Button variant="outline" className="flex items-center gap-2">
                  <action.icon size={16} />
                  {action.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Categories */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Categorías populares
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {popularCategories.map((category) => (
              <Link key={category.name} href={category.href}>
                <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-200 hover:border-gray-300">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {category.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Volver atrás
          </Button>
        </div>

        {/* Help Section */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-gray-600 mb-4">
            Si no encuentras lo que buscas, puedes:
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Usar la barra de búsqueda para encontrar productos</p>
            <p>• Navegar por nuestras categorías principales</p>
            <p>• Contactar nuestro servicio al cliente</p>
            <p>• Revisar nuestro mapa del sitio</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 text-sm text-gray-500">
          <p>
            ¿Sigues teniendo problemas?{' '}
            <Link href="/contacto" className="text-blue-600 hover:underline">
              Contáctanos
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 