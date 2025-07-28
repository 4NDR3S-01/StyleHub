

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
  "Buzos",
  "Polos",
  "Jeans",
  "Pantalones"
];

// Relación entre subcategoría y nombre de producto (puedes ajustar según tus datos reales)
const subCategoryKeywords: Record<string, string[]> = {
  Camisetas: ["camiseta", "t-shirt"],
  Camisas: ["camisa"],
  Buzos: ["buzo", "suéter", "hoodie"],
  Polos: ["polo"],
  Jeans: ["jean", "mezclilla"],
  Pantalones: ["pantalón", "pantalones"],
};

export default function MenCategoryPage() {
  const [selectedSub, setSelectedSub] = useState<string>("");
  const menProducts = Productos.filter((product) => product.category === "men");

  // Filtrado por subcategoría
  const filteredProducts = selectedSub
    ? menProducts.filter((product) => {
        const keywords = subCategoryKeywords[selectedSub] || [];
        return keywords.some((kw) =>
          product.name.toLowerCase().includes(kw)
        );
      })
    : menProducts;

  return (
    <main className="flex flex-col items-center min-h-[60vh] p-8">
      {/* Banner destacado */}
      <div className="w-full max-w-6xl mb-8 rounded-2xl overflow-hidden shadow-lg relative">
        {/* Imagen de fondo dinámica y overlay */}
        <div className="w-full h-64 relative">
          <img
            src="/banner-men.jpg"
            alt="Moda Hombre"
            className="w-full h-64 object-cover absolute inset-0 z-0"
            style={{ filter: 'brightness(0.7) blur(1px)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 via-transparent to-blue-900/60 z-10 flex flex-col justify-center items-center">
            <h1 className="text-5xl font-extrabold text-white mb-2 drop-shadow-lg tracking-tight animate-fadeIn">Estilo Masculino</h1>
            <p className="text-lg text-white mb-4 drop-shadow-lg animate-fadeIn delay-100">Descubre tu mejor versión con las tendencias de este año</p>
            <span className="bg-white/20 text-white px-4 py-2 rounded-full text-base font-semibold mt-2 backdrop-blur-md shadow">#Actitud #Confianza #Tendencia</span>
          </div>
        </div>
      </div>

      {/* Submenú de categorías */}
      <nav className="flex flex-wrap gap-3 mb-8 justify-center">
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
      <div className="w-full max-w-6xl mb-12">
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
      <div className="w-full max-w-6xl mb-12">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Marcas Populares</h2>
        <div className="flex flex-wrap gap-6 justify-center items-center">
          {marcasPopulares.map((marca) => (
            <span key={marca} className="bg-gray-100 px-6 py-3 rounded-full text-lg font-semibold shadow hover:bg-blue-100 transition">{marca}</span>
          ))}
        </div>
      </div>

      {/* Recomendaciones personalizadas */}
      <div className="w-full max-w-6xl mb-12">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Recomendaciones para ti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">No hay productos para esta categoría.</p>
          )}
        </div>
      </div>
    </main>
  );
}
