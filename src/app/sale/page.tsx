'use client';

import { useState, useEffect } from 'react';
import { getSaleProducts } from '@/services/product.service';
import ProductCard from '@/components/product/ProductCard';
import { Filter, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  product_variants: Array<{
    id: string;
    color: string;
    size: string;
    stock: number;
    price_adjustment: number;
  }>;
  brand: string;
  gender: string;
  tags: string[];
  featured: boolean;
  sale: boolean;
  active: boolean;
  created_at: string;
}

export default function SalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000000 });
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  useEffect(() => {
    loadSaleProducts();
  }, []);

  const loadSaleProducts = async () => {
    try {
      setLoading(true);
      const saleProducts = await getSaleProducts(50); // Get more products for sale page
      setProducts(saleProducts);
    } catch (error) {
      console.error('Error loading sale products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique brands and genders for filters
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
  const genders = Array.from(new Set(products.map(p => p.gender).filter(Boolean)));

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
      const matchesBrand = !selectedBrand || product.brand === selectedBrand;
      const matchesGender = !selectedGender || product.gender === selectedGender;

      return matchesSearch && matchesPrice && matchesBrand && matchesGender;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'discount':
          aValue = ((a.original_price - a.price) / a.original_price) * 100;
          bValue = ((b.original_price - b.price) / b.original_price) * 100;
          break;
        default:
          aValue = a.price;
          bValue = b.price;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const calculateDiscount = (originalPrice: number, currentPrice: number) => {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: 0, max: 1000000 });
    setSelectedBrand('');
    setSelectedGender('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-4">
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
            <span>📦 {filteredProducts.length} productos en oferta</span>
            <span>🔥 Descuentos de hasta 70%</span>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Buscar en ofertas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* View Mode */}
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

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Precio</SelectItem>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="created_at">Más recientes</SelectItem>
                  <SelectItem value="discount">Mayor descuento</SelectItem>
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

          {/* Advanced Filters */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Marca:</span>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    {brands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Género:</span>
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {genders.map(gender => (
                      <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Precio:</span>
                <Input
                  type="number"
                  placeholder="Mín"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  className="w-20"
                />
                <span>-</span>
                <Input
                  type="number"
                  placeholder="Máx"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-20"
                />
              </div>

              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-gray-600 mb-4">
              Intenta ajustar tus filtros o busca algo diferente
            </p>
            <Button onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              <div key={product.id} className="relative">
                {/* Discount Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    -{calculateDiscount(product.original_price || product.price, product.price)}%
                  </div>
                </div>
                
                <ProductCard 
                  product={product}
                  showDiscount={true}
                  layout={viewMode}
                />
              </div>
            ))}
          </div>
        )}

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