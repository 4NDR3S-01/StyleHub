'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProductsWithFilters, ServiceProductFilters } from '@/services/product.service';
import { Product } from '@/types/index';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters, { FilterState } from '@/components/product/ProductFilters';
import { Grid, List, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('price-low');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadSaleProducts();
  }, []);

  const loadSaleProducts = async () => {
    try {
      setLoading(true);
      // Cargar todos los productos en oferta
      const filters: ServiceProductFilters = {
        sale: true
      };
      const saleProducts = await getProductsWithFilters(filters, 'created_at', 'desc', 100);
      setAllProducts(saleProducts as Product[]);
      setProducts(saleProducts as Product[]);
    } catch (error) {
      console.error('Error loading sale products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback(async (filterState: FilterState) => {
    try {
      setLoading(true);
      
      const filters: ServiceProductFilters = {
        sale: true, // Siempre filtrar por productos en oferta
        brands: filterState.brands.length > 0 ? filterState.brands : undefined,
        colors: filterState.colors.length > 0 ? filterState.colors : undefined,
        sizes: filterState.sizes.length > 0 ? filterState.sizes : undefined,
        seasons: filterState.seasons.length > 0 ? filterState.seasons : undefined,
        minPrice: filterState.priceRange[0],
        maxPrice: filterState.priceRange[1],
        featured: filterState.featured || undefined,
        search: searchTerm || undefined
      };

      const filteredProducts = await getProductsWithFilters(filters, sortBy, sortOrder);
      setProducts(filteredProducts as Product[]);
    } catch (error) {
      console.error('Error filtering products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder]);

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setProducts(allProducts);
      return;
    }

    try {
      setLoading(true);
      const filters: ServiceProductFilters = {
        sale: true,
        search: term
      };
      
      const searchResults = await getProductsWithFilters(filters, sortBy, sortOrder);
      setProducts(searchResults as Product[]);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  }, [allProducts, sortBy, sortOrder]);

  const handleSortChange = async (newSortBy: string) => {
    setSortBy(newSortBy);
    
    try {
      setLoading(true);
      const filters: ServiceProductFilters = {
        sale: true,
        search: searchTerm || undefined
      };
      
      const sortedProducts = await getProductsWithFilters(filters, newSortBy, sortOrder);
      setProducts(sortedProducts as Product[]);
    } catch (error) {
      console.error('Error sorting products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={`sale-skeleton-${i}`} className="bg-white rounded-lg shadow-md p-4">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎉 Ofertas Especiales
          </h1>
          <p className="text-lg text-gray-600">
            Descubre increíbles descuentos en nuestra colección seleccionada
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>📦 {products.length} productos en oferta</span>
            <span>🔥 Descuentos de hasta 70%</span>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar con filtros */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} w-80 flex-shrink-0`}>
            <ProductFilters
              products={allProducts}
              onFilterChange={handleFilterChange}
              className="sticky top-4"
            />
          </div>

          {/* Contenido principal */}
          <div className="flex-1">
            {/* Controles superiores */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Búsqueda */}
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Buscar en ofertas..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Botón filtros móvil */}
                <div className="lg:hidden">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Filtros
                  </Button>
                </div>

                {/* Modo de vista */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid size={16} />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List size={16} />
                  </Button>
                </div>

                {/* Ordenamiento */}
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price-low">Precio: Menor a mayor</SelectItem>
                      <SelectItem value="price-high">Precio: Mayor a menor</SelectItem>
                      <SelectItem value="name">Nombre A-Z</SelectItem>
                      <SelectItem value="created_at">Más recientes</SelectItem>
                      <SelectItem value="featured">Destacados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Grid de productos */}
            {(() => {
              let content;
              if (loading) {
                content = (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div key={`loading-${i}`} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                        <div className="h-48 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                );
              } else if (products.length === 0) {
                content = (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">😔</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No se encontraron productos en oferta
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Intenta ajustar tus filtros o busca algo diferente
                    </p>
                    <Button onClick={() => {
                      setSearchTerm('');
                      loadSaleProducts();
                    }}>
                      Ver todas las ofertas
                    </Button>
                  </div>
                );
              } else {
                content = (
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                      : 'grid-cols-1'
                  }`}>
                    {products.map((product) => (
                      <div key={product.id} className="relative">
                        <ProductCard 
                          product={product}
                          viewMode={viewMode}
                        />
                      </div>
                    ))}
                  </div>
                );
              }
              return content;
            })()}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">
              ¡No te pierdas las mejores ofertas!
            </h3>
            <p className="text-red-100 mb-4">
              Suscríbete para recibir notificaciones de ofertas exclusivas
            </p>
            <div className="flex max-w-md mx-auto gap-2">
              <Input 
                placeholder="Tu email" 
                className="flex-1 text-gray-900"
              />
              <Button variant="secondary">
                Suscribirse
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 