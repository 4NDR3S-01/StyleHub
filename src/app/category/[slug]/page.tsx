"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProductCard from "../../../components/product/ProductCard";
import { getProductsByCategorySlug, getCategoryBySlug } from "../../../services/product.service";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  images: string[];
  category_id: string;
  brand?: string;
  gender?: string;
  material?: string;
  season?: string;
  tags?: string[];
  featured: boolean;
  sale: boolean;
  product_variants?: Array<{
    id: string;
    color: string;
    size: string;
    stock: number;
    image?: string;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  // Estados
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [colorFilter, setColorFilter] = useState<string>("");
  const [sizeFilter, setSizeFilter] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");

  // Cargar productos de la categoría
  useEffect(() => {
    async function loadCategoryData() {
      try {
        setLoading(true);
        const [categoryData, productsData] = await Promise.all([
          getCategoryBySlug(slug),
          getProductsByCategorySlug(slug)
        ]);
        setCategory(categoryData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error loading category data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadCategoryData();
    }
  }, [slug]);

  // Obtener todos los colores y tallas disponibles
  const availableColors = Array.from(new Set(
    products.flatMap(product => 
      product.product_variants?.map(v => v.color) || []
    )
  )).filter(Boolean);

  const availableSizes = Array.from(new Set(
    products.flatMap(product => 
      product.product_variants?.map(v => v.size) || []
    )
  )).filter(Boolean);

  // Productos destacados
  const featuredProducts = products.filter(product => product.featured);

  // Aplicar filtros
  let filteredProducts = [...products];

  if (colorFilter) {
    filteredProducts = filteredProducts.filter((product) =>
      product.product_variants?.some(v => 
        v.color.toLowerCase().includes(colorFilter.toLowerCase())
      )
    );
  }
  
  if (sizeFilter) {
    filteredProducts = filteredProducts.filter((product) =>
      product.product_variants?.some(v => 
        v.size.toLowerCase().includes(sizeFilter.toLowerCase())
      )
    );
  }
  
  if (priceFilter) {
    if (priceFilter === "low") {
      filteredProducts = filteredProducts.filter((product) => product.price < 50);
    } else if (priceFilter === "medium") {
      filteredProducts = filteredProducts.filter((product) => product.price >= 50 && product.price < 100);
    } else if (priceFilter === "high") {
      filteredProducts = filteredProducts.filter((product) => product.price >= 100);
    }
  }

  // Aplicar ordenamiento
  filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "name":
        return a.name.localeCompare(b.name);
      case "newest":
        return 0; // Por ahora no tenemos fecha de creación
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-gray-600">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoría no encontrada</h1>
            <p className="text-gray-600">La categoría que buscas no existe.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 capitalize">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-gray-600 text-lg">
              {category.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              {/* Productos destacados */}
              {featuredProducts.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-blue-700">Productos Destacados</h2>
                  <div className="space-y-4">
                    {featuredProducts.slice(0, 3).map((product) => (
                      <div key={product.id} className="flex space-x-3">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                            {product.name}
                          </h4>
                          <p className="text-blue-600 font-semibold text-sm">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estadísticas */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Estadísticas</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Total de productos: {products.length}</p>
                  <p>Productos destacados: {featuredProducts.length}</p>
                  <p>En oferta: {products.filter(p => p.sale).length}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <main className="lg:col-span-3">
            {/* Productos destacados */}
            {featuredProducts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos Destacados</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredProducts.slice(0, 6).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Filtros y ordenamiento */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Filtros y Ordenamiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  className="border border-gray-300 rounded-md px-3 py-2"
                  value={colorFilter}
                  onChange={(e) => setColorFilter(e.target.value)}
                >
                  <option value="">Todos los colores</option>
                  {availableColors.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
                
                <select
                  className="border border-gray-300 rounded-md px-3 py-2"
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                >
                  <option value="">Todas las tallas</option>
                  {availableSizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                
                <select
                  className="border border-gray-300 rounded-md px-3 py-2"
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                >
                  <option value="">Todos los precios</option>
                  <option value="low">Menos de $50</option>
                  <option value="medium">$50 - $99</option>
                  <option value="high">$100 o más</option>
                </select>

                <select
                  className="border border-gray-300 rounded-md px-3 py-2"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Nombre A-Z</option>
                  <option value="price-low">Precio: Menor a Mayor</option>
                  <option value="price-high">Precio: Mayor a Menor</option>
                  <option value="newest">Más Recientes</option>
                </select>
                
                <button
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition"
                  onClick={() => {
                    setColorFilter("");
                    setSizeFilter("");
                    setPriceFilter("");
                    setSortBy("name");
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            {/* Productos */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Todos los Productos
                </h2>
                <span className="text-gray-600">
                  {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    No hay productos que coincidan con los filtros seleccionados.
                  </p>
                  <button
                    onClick={() => {
                      setColorFilter("");
                      setSizeFilter("");
                      setPriceFilter("");
                    }}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Ver todos los productos
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}