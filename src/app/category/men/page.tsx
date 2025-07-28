

"use client";
import React, { useState } from "react";
import { Productos } from "../../../data/Productos";
import ProductCard from "../../../components/product/ProductCard";

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
      <h1 className="text-4xl font-bold mb-4">Colección para Hombres</h1>
      <p className="text-lg text-center mb-8 max-w-xl">
        Explora nuestra selección exclusiva de moda para hombres. Encuentra las últimas tendencias, ropa, accesorios y más.
      </p>
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
        {/* Botón para mostrar todos */}
        <button
          className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors duration-200 ${selectedSub === "" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"}`}
          onClick={() => setSelectedSub("")}
        >
          Todos
        </button>
      </nav>
      <section className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No hay productos para esta categoría.</p>
        )}
      </section>
    </main>
  );
}
