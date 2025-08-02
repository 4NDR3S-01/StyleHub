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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 capitalize">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-xl md:text-2xl text-pink-100 max-w-3xl mx-auto">
                {category.description}
              </p>
            )}
            <div className="mt-8 flex justify-center space-x-4">
              <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3">
                <span className="text-2xl font-bold">{products.length}</span>
                <p className="text-sm">Productos</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3">
                <span className="text-2xl font-bold">{featuredProducts.length}</span>
                <p className="text-sm">Destacados</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3">
                <span className="text-2xl font-bold">{products.filter(p => p.sale).length}</span>
                <p className="text-sm">En Oferta</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Categories / Collections */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Explora por Colección</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <img 
                src="https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1" 
                alt="Vestidos" 
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-2 left-2 text-white">
                <h3 className="font-semibold">Vestidos</h3>
                <p className="text-xs opacity-90">Elegancia y estilo</p>
              </div>
            </div>
            
            <div className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <img 
                src="https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1" 
                alt="Chaquetas" 
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-2 left-2 text-white">
                <h3 className="font-semibold">Chaquetas</h3>
                <p className="text-xs opacity-90">Para cada ocasión</p>
              </div>
            </div>
            
            <div className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <img 
                src="https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1" 
                alt="Suéteres" 
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-2 left-2 text-white">
                <h3 className="font-semibold">Suéteres</h3>
                <p className="text-xs opacity-90">Comodidad premium</p>
              </div>
            </div>
            
            <div className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <img 
                src="https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1" 
                alt="Accesorios" 
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-2 left-2 text-white">
                <h3 className="font-semibold">Accesorios</h3>
                <p className="text-xs opacity-90">Completa tu look</p>
              </div>
            </div>
          </div>
        </div>

        {/* Productos destacados mejorados */}
        {featuredProducts.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">✨ Productos Destacados</h2>
              <p className="text-gray-600">Descubre nuestras piezas más populares y elegantes</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="group">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar mejorado */}
          <aside className="lg:col-span-1">
            <div className="space-y-6">
              {/* Filtros avanzados */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-pink-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="bg-pink-100 p-2 rounded-lg mr-3">🔍</span>
                  Filtros
                </h3>
                
                <div className="space-y-4">
                  {/* Filtro de precio con rangos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Precio</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                    >
                      <option value="">Todos los precios</option>
                      <option value="low">$0 - $50</option>
                      <option value="medium">$50 - $100</option>
                      <option value="high">$100+</option>
                    </select>
                  </div>

                  {/* Filtro de color con círculos de colores */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setColorFilter("")}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          colorFilter === "" 
                            ? "bg-pink-500 text-white" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Todos
                      </button>
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setColorFilter(color)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            colorFilter === color 
                              ? "bg-pink-500 text-white" 
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtro de talla */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Talla</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSizeFilter("")}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          sizeFilter === "" 
                            ? "bg-pink-500 text-white" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Todas
                      </button>
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSizeFilter(size)}
                          className={`py-2 rounded-lg text-sm font-medium transition-all ${
                            sizeFilter === size 
                              ? "bg-pink-500 text-white" 
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Botón limpiar filtros */}
                  <button
                    onClick={() => {
                      setColorFilter("");
                      setSizeFilter("");
                      setPriceFilter("");
                      setSortBy("name");
                    }}
                    className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              {/* Ofertas especiales */}
              {products.filter(p => p.sale).length > 0 && (
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                  <h3 className="text-xl font-bold mb-3">🏷️ Ofertas Especiales</h3>
                  <p className="text-pink-100 mb-4">
                    ¡{products.filter(p => p.sale).length} productos en oferta!
                  </p>
                  <button 
                    onClick={() => {
                      // Filtrar solo productos en oferta
                      setColorFilter("");
                      setSizeFilter("");
                      setPriceFilter("");
                    }}
                    className="bg-white text-pink-600 px-4 py-2 rounded-lg font-medium hover:bg-pink-50 transition-colors"
                  >
                    Ver ofertas
                  </button>
                </div>
              )}

              {/* Productos destacados del sidebar */}
              {featuredProducts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-pink-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">⭐ Más Populares</h3>
                  <div className="space-y-4">
                    {featuredProducts.slice(0, 3).map((product) => (
                      <div key={product.id} className="flex space-x-3 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors cursor-pointer">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                            {product.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <p className="text-pink-600 font-semibold text-sm">
                              ${product.price.toFixed(2)}
                            </p>
                            {product.original_price && (
                              <p className="text-gray-400 text-xs line-through">
                                ${product.original_price.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Contenido principal */}
          <main className="lg:col-span-3">
            {/* Barra de ordenamiento mejorada */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-pink-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <h3 className="font-semibold text-gray-900">Ordenar por:</h3>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Nombre A-Z</option>
                    <option value="price-low">Precio: Menor a Mayor</option>
                    <option value="price-high">Precio: Mayor a Menor</option>
                    <option value="newest">Más Recientes</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full font-medium">
                    {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid de productos */}
            <div>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="group">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="bg-pink-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🔍</span>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      No encontramos productos
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Intenta ajustar los filtros o explora otras categorías.
                    </p>
                    <button
                      onClick={() => {
                        setColorFilter("");
                        setSizeFilter("");
                        setPriceFilter("");
                      }}
                      className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      Ver todos los productos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Newsletter Section */}
        <div className="mt-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl shadow-2xl p-8 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">¡No te pierdas nada!</h3>
          <p className="text-pink-100 mb-6 max-w-2xl mx-auto">
            Suscríbete a nuestro newsletter y recibe las últimas tendencias, ofertas exclusivas y nuevos lanzamientos directamente en tu email.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-pink-600 px-6 py-3 rounded-lg font-medium hover:bg-pink-50 transition-colors">
              Suscribirse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}