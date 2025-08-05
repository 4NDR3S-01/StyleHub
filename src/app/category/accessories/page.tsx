'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import ProductCard from '../../../components/product/ProductCard';
import { getProductsByCategory, getCategoryBySlug } from '@/services/product.service';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  images?: string[];
  tags?: string[];
  created_at?: string;
  variants?: Array<{
    color?: string;
    size?: string;
    stock: number;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export default function AccessoriesCategoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);

  // Colores y tallas disponibles
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  useEffect(() => {
    fetchCategoryAndProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, selectedColors, selectedSizes, priceRange, sortBy]);

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true);
      
      // Obtener categoría
      const categoryData = await getCategoryBySlug('accessories');
      if (categoryData) {
        setCategory(categoryData);
        
        // Obtener productos de la categoría
        const productsData = await getProductsByCategory('accessories');
        setProducts(productsData);
        
        // Extraer colores y tallas únicos de las variantes
        const colors = new Set<string>();
        const sizes = new Set<string>();
        
        productsData.forEach((product: any) => {
          if (product.variants) {
            product.variants.forEach((variant: any) => {
              if (variant.color) colors.add(variant.color);
              if (variant.size) sizes.add(variant.size);
            });
          }
        });
        
        setAvailableColors(Array.from(colors));
        setAvailableSizes(Array.from(sizes));
        
        // Establecer rango de precios dinámico
        if (productsData.length > 0) {
          const prices = productsData.map((p: any) => p.price);
          setPriceRange({
            min: 0,
            max: Math.ceil(Math.max(...prices))
          });
        }
      }
    } catch (err) {
      console.error('Error fetching accessories:', err);
      setError('Error al cargar los accesorios');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags?.some((tag: any) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro de colores
    if (selectedColors.length > 0) {
      filtered = filtered.filter(product =>
        product.variants?.some((variant: any) =>
          selectedColors.includes(variant.color || '')
        )
      );
    }

    // Filtro de tallas
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(product =>
        product.variants?.some((variant: any) =>
          selectedSizes.includes(variant.size || '')
        )
      );
    }

    // Filtro de precio
    filtered = filtered.filter(product =>
      product.price >= priceRange.min && product.price <= priceRange.max
    );

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange({ min: 0, max: 1000 });
    setSortBy('name');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={`loading-skeleton-${i + 1}`} className="bg-gray-200 rounded-lg h-80"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {category?.name || 'Accesorios'}
        </h1>
        <p className="text-gray-600">
          {category?.description || 'Descubre nuestra colección de accesorios únicos'}
        </p>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar accesorios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filtros
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Ordenamiento */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Nombre A-Z</option>
            <option value="price-low">Precio: Menor a Mayor</option>
            <option value="price-high">Precio: Mayor a Menor</option>
            <option value="newest">Más Recientes</option>
          </select>
        </div>

        {/* Panel de filtros expandido */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro de colores */}
              {availableColors.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Colores</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => toggleColor(color)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          selectedColors.includes(color)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtro de tallas */}
              {availableSizes.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Tallas</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          selectedSizes.includes(size)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtro de precio */}
              <div>
                <h3 className="font-medium mb-2">Rango de Precio</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={priceRange.max}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${priceRange.min}</span>
                    <span>${priceRange.max}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón limpiar filtros */}
            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <X className="h-4 w-4" />
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className="mb-4">
        <p className="text-gray-600">
          Mostrando {filteredProducts.length} de {products.length} productos
        </p>
      </div>

      {/* Grid de productos */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                images: product.images ?? [],
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron accesorios con los filtros seleccionados.</p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}