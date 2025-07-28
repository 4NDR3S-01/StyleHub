"use client";

import React, { useState } from "react";
import { Productos } from "../../../data/Productos";
import ProductCard from "../../../components/product/ProductCard";

// Marcas populares para mujeres
const marcasPopulares = ["Zara", "H&M", "Nike", "Adidas", "Forever 21", "Mango"];

// Productos tendencia
const productosTendencia = Productos.filter(p => p.category === "women" && p.featured);

// Subcategorías para mujeres
const subCategories = [
  "Blusas",
  "Vestidos", 
  "Faldas",
  "Pantalones",
  "Jeans",
  "Abrigos"
];

export default function WomenCategoryPage() {
  const [selectedSub, setSelectedSub] = useState<string>("");

  // Filtrar productos
  const allWomenProducts = Productos.filter(p => p.category === "women");
  
  const filteredProducts = selectedSub
    ? allWomenProducts.filter((product) =>
        product.name.toLowerCase().includes(selectedSub.toLowerCase())
      )
    : allWomenProducts;

  return (
    <main className="flex flex-col items-center min-h-[60vh] p-8">
      {/* Banner principal */}
      <div className="w-full max-w-6xl mb-12 text-center">
        <h1 className="text-5xl font-bold text-pink-600 mb-4">
          Moda Femenina
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Descubre las últimas tendencias en ropa para mujer
        </p>
      </div>

      {/* Productos en tendencia */}
      {productosTendencia.length > 0 && (
        <div className="w-full max-w-6xl mb-12">
          <h2 className="text-3xl font-bold text-pink-600 mb-6">
            🔥 Productos en Tendencia
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productosTendencia.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Filtros por subcategoría */}
      <div className="w-full max-w-6xl mb-8">
        <h3 className="text-2xl font-bold text-pink-600 mb-4">Categorías</h3>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setSelectedSub("")}
            className={`px-6 py-3 rounded-full font-medium transition ${
              selectedSub === ""
                ? "bg-pink-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-pink-100"
            }`}
          >
            Todos
          </button>
          {subCategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSub(sub)}
              className={`px-6 py-3 rounded-full font-medium transition ${
                selectedSub === sub
                  ? "bg-pink-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-pink-100"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Marcas populares */}
      <div className="w-full max-w-6xl mb-12">
        <h2 className="text-2xl font-bold mb-4 text-pink-600">Marcas Populares</h2>
        <div className="flex flex-wrap gap-6 justify-center items-center">
          {marcasPopulares.map((marca) => (
            <span 
              key={marca} 
              className="bg-gray-100 px-6 py-3 rounded-full text-lg font-semibold shadow hover:bg-pink-100 transition"
            >
              {marca}
            </span>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="w-full max-w-6xl mb-12">
        <h2 className="text-2xl font-bold mb-4 text-pink-600">
          {selectedSub ? `${selectedSub}` : "Todos los Productos"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No hay productos para esta categoría.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
