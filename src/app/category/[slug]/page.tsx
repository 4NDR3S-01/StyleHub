'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getProductsByCategory, getProductsWithFilters, ServiceProductFilters } from '@/services/product.service';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters, { FilterState } from '@/components/product/ProductFilters';
import { Product } from '@/types/index';
import { Filter, Grid3X3, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Página de listado de productos por categoría con filtros laterales
 */
export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const initializePage = async (): Promise<void> => {
      await loadCategoryData(resolvedParams.slug);
    };
    initializePage();
  }, [resolvedParams.slug]);

  const loadCategoryData = async (categorySlug: string) => {
    try {
      setLoading(true);
      const categoryData = await getCategoryBySlug(categorySlug);
      if (!categoryData) {
        notFound();
        return;
      }
      setCategory(categoryData);
      
      // Cargar todos los productos de la categoría
      const categoryProducts = await getProductsByCategory(categorySlug);
      setAllProducts(categoryProducts as Product[]);
      setProducts(categoryProducts as Product[]);
    } catch (error) {
      console.error('Error loading category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (filterState: FilterState) => {
    if (!category) return;

    try {
      setLoading(true);
      
      // TEMPORALMENTE: usar productos ya cargados en lugar de hacer nueva consulta
      setProducts(allProducts);
      
      /* Activar cuando sea necesario
      const filters: ServiceProductFilters = {
        category: category.id,
        brands: filterState.brands.length > 0 ? filterState.brands : undefined,
        colors: filterState.colors.length > 0 ? filterState.colors : undefined,
        sizes: filterState.sizes.length > 0 ? filterState.sizes : undefined,
        seasons: filterState.seasons.length > 0 ? filterState.seasons : undefined,
        minPrice: filterState.priceRange[0],
        maxPrice: filterState.priceRange[1],
        featured: filterState.featured || undefined,
        sale: filterState.onSale || undefined,
        search: searchTerm || undefined
      };

      const filteredProducts = await getProductsWithFilters(filters, sortBy, sortOrder);
      setProducts(filteredProducts as Product[]);
      */
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (!category) return;

    if (!term.trim()) {
      setProducts(allProducts);
      return;
    }

    try {
      setLoading(true);
      const filters: ServiceProductFilters = {
        category: category.id,
        search: term
      };
      
      const searchResults = await getProductsWithFilters(filters, sortBy, sortOrder);
      setProducts(searchResults as Product[]);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = async (newSortBy: string) => {
    if (!category) return;
    
    setSortBy(newSortBy);
    
    try {
      setLoading(true);
      const filters: ServiceProductFilters = {
        category: category.id,
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

  if (!category) {
    return <div>Cargando...</div>;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {/* Header con imagen de categoría */}
      <div className="mb-8">
        {category.image && (
          <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden mb-6">
            <img 
              src={category.image} 
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
        </div>
      </div>

      {/* Barra de búsqueda y controles */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={handleSort}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Más recientes</SelectItem>
              <SelectItem value="name">Nombre A-Z</SelectItem>
              <SelectItem value="price">Precio: menor a mayor</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Panel de filtros lateral */}
        <aside className={`w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <ProductFilters
            products={allProducts}
            onFilterChange={handleFilterChange}
            className="sticky top-4"
            hideCategories={true}
          />
        </aside>

        {/* Lista de productos */}
        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">
              {loading ? 'Cargando...' : `${products.length} productos encontrados`}
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {(() => {
            if (loading) {
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map(() => {
                    const uniqueKey = Math.random().toString(36).substr(2, 9);
                    return (
                      <div key={uniqueKey} className="bg-gray-200 animate-pulse rounded-lg h-80"></div>
                    );
                  })}
                </div>
              );
            } else if (products.length === 0) {
              return (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😔</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No se encontraron productos
                  </h3>
                  <p className="text-gray-600">
                    Intenta ajustar los filtros o busca otros términos
                  </p>
                </div>
              );
            } else {
              return (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
                }>
                  {products.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              );
            }
          })()}
        </main>
      </div>
    </section>
  );
}