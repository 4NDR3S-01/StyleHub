"use client";

import React, { useState } from "react";
import { Productos } from "../../../data/Productos";
import ProductCard from "../../../components/product/ProductCard";
// Puedes crear un array de marcas populares
const marcasPopulares = ["Nike", "Adidas", "Puma", "Levi's", "Zara", "H&M"];
// Productos tendencia (puedes filtrar por featured o crear un array)
const productosTendencia = Productos.filter(p => p.category === "men" && p.featured);

const subCategories = [
  "Camisetas",
  "Camisas",
  "Trajes de baño",
  "Shorts",
  "Pantalones",
  "Jeans",
  "Básicos",
  "Buzos y hoodies",
  "Chompas y abrigos",
  "Suéteres y cárdigans",
  "Ropa deportiva",
  "Joggers",
  "Ropa formal",
  "Calzado",
  "Calcetines",
  "Ropa interior",
  "Accesorios"
];

// Relación entre subcategoría y nombre de producto (puedes ajustar según tus datos reales.)
const subCategoryKeywords: Record<string, string[]> = {
  Camisetas: ["camiseta", "t-shirt"],
  Camisas: ["camisa"],
  Buzos: ["buzo", "suéter", "hoodie"],
  Polos: ["polo"],
  Jeans: ["jean", "mezclilla"],
  Pantalones: ["pantalón", "pantalones"],
};

export default function MenCategoryPage() {
  // Estado para favoritos
  const [favorites, setFavorites] = useState<number[]>([]);
  // Estado para filtros
  const [colorFilter, setColorFilter] = useState<string>("");
  const [sizeFilter, setSizeFilter] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<string>("");
  const [selectedSub, setSelectedSub] = useState<string>("");
  const menProducts = Productos.filter((product) => product.category === "men");

  // Filtrado por subcategoría.
  // Generar productos de ejemplo para mostrar muchas tarjetas

  // Corregir filtrado por subcategoría: si no hay keywords, filtrar por subcategoría exacta
  let filteredProducts = selectedSub
    ? menProducts.filter((product) => {
        const keywords = subCategoryKeywords[selectedSub] || [];
        if (keywords.length > 0) {
          return keywords.some((kw) =>
            product.name?.toLowerCase().includes(kw)
          );
        }
        // Si no hay keywords, filtra por subcategoría exacta en el producto
        return product.category === selectedSub;
      })
    : menProducts;

  // Filtros adicionales
  if (colorFilter) {
    filteredProducts = filteredProducts.filter((product) =>
      product.colors?.map(c => c.toLowerCase()).includes(colorFilter.toLowerCase())
    );
  }
  if (sizeFilter) {
    filteredProducts = filteredProducts.filter((product) =>
      product.sizes?.map(s => s.toLowerCase()).includes(sizeFilter.toLowerCase())
    );
  }
  if (priceFilter) {
    if (priceFilter === "low") filteredProducts = filteredProducts.filter((product) => Number(product.price) < 50);
    if (priceFilter === "medium") filteredProducts = filteredProducts.filter((product) => Number(product.price) >= 50 && Number(product.price) < 100);
    if (priceFilter === "high") filteredProducts = filteredProducts.filter((product) => Number(product.price) >= 100);
  }

  return (
    <main className="flex flex-row min-h-[60vh] p-8 bg-gray-50">
      {/* Menú lateral */}
      <aside className="hidden lg:block w-72 mr-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Nuevos productos</h2>
          <ul className="space-y-2">
            <li><button className="text-blue-700 hover:underline" onClick={() => setSelectedSub("")}>Ver todo</button></li>
            {subCategories.map((sub) => (
              <li key={sub}><button className="text-gray-700 hover:underline" onClick={() => setSelectedSub(sub)}>{sub}</button></li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Las tendencias actuales</h2>
          <ul className="space-y-2">
            <li><span className="text-gray-700">Regreso a clases</span></li>
            <li><span className="text-gray-700">La edición de verano</span></li>
            <li><span className="text-gray-700">Del trabajo al descanso</span></li>
            <li><span className="text-gray-700">Lino</span></li>
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Compra por producto</h2>
          <ul className="space-y-2">
            <li><button className="text-red-600 font-semibold hover:underline" onClick={() => setSelectedSub("")}>Ver todo</button></li>
            {subCategories.map((sub) => (
              <li key={sub}><button className="text-gray-700 hover:underline" onClick={() => setSelectedSub(sub)}>{sub}</button></li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Contenido principal */}
      <section className="flex-1">
        {/* Banner promocional StyleHub */}
        <div className="w-full mb-8 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-cyan-300 py-10 px-8 flex flex-col items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">StyleHub</h1>
            <p className="text-lg text-gray-900 mb-4 font-semibold">Suscríbete y recibe -15% en un artículo + envío gratis</p>
            <span className="text-base text-gray-800 mb-2">Recibe ofertas exclusivas, las últimas tendencias, nuevos lanzamientos y más.</span>
            <button className="bg-white text-cyan-700 font-bold px-6 py-2 rounded-full shadow hover:bg-cyan-100 transition">Suscribirse</button>
          </div>
        </div>

        {/* Submenú de categorías (solo visible en móvil/tablet) */}
        <nav className="flex flex-wrap gap-3 mb-8 justify-center lg:hidden">
          {subCategories.map((sub) => (
            <button
              key={sub}
              className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors duration-200 ${selectedSub === sub ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
              onClick={() => setSelectedSub(sub)}
            >
              {sub}
            </button>
          ))}
          <button
            className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors duration-200 ${selectedSub === "" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
            onClick={() => setSelectedSub("")}
          >
            Todos
          </button>
        </nav>

        {/* Tendencias */}
        <div className="w-full mb-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-700">Tendencias</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {productosTendencia.length > 0 ? (
              productosTendencia.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">No hay productos tendencia.</p>
            )}
          </div>
        </div>

        {/* Marcas populares */}
        <div className="w-full mb-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-700">Marcas Populares</h2>
          <div className="flex flex-wrap gap-6 justify-center items-center">
            {marcasPopulares.map((marca) => (
              <span key={marca} className="bg-gray-100 px-6 py-3 rounded-full text-lg font-semibold shadow hover:bg-blue-100 transition">{marca}</span>
            ))}
          </div>
        </div>

        {/* Grid tipo H&M */}
        <div className="w-full mb-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-700">Recomendaciones para ti</h2>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select value={colorFilter} onChange={e => setColorFilter(e.target.value)} className="px-4 py-2 rounded border">
              <option value="">Color</option>
              <option value="Blanco">Blanco</option>
              <option value="Negro">Negro</option>
              <option value="Azul">Azul</option>
              <option value="Gris">Gris</option>
              <option value="Rojo">Rojo</option>
              <option value="Verde">Verde</option>
              <option value="Amarillo">Amarillo</option>
            </select>
            <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)} className="px-4 py-2 rounded border">
              <option value="">Talla</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
            <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)} className="px-4 py-2 rounded border">
              <option value="">Precio</option>
              <option value="low">Menos de $50</option>
              <option value="medium">$50 - $99</option>
              <option value="high">$100 o más</option>
            </select>
            <button className="px-4 py-2 rounded bg-gray-200" onClick={() => {setColorFilter("");setSizeFilter("");setPriceFilter("");}}>Limpiar filtros</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition hover:shadow-xl relative">
                  {/* Ícono de favorito */}
                  <button
                    className={`absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow hover:bg-red-100 transition`}
                    onClick={() => setFavorites(favorites.includes(Number(product.id)) ? favorites.filter(f => f !== Number(product.id)) : [...favorites, Number(product.id)])}
                    aria-label="Favorito"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill={favorites.includes(Number(product.id)) ? "#e53e3e" : "none"} viewBox="0 0 24 24" stroke="#e53e3e" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                    </svg>
                  </button>
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-80 object-cover"
                    />
                  ) : (
                    <div className="w-full h-80 flex items-center justify-center bg-gray-100 text-gray-400">Sin imagen</div>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-center items-center">
                    <h3 className="font-bold text-lg mb-1 text-gray-900 text-center">{product.name}</h3>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">No hay productos para esta categoría.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
