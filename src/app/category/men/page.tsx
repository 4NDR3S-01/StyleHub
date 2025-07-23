
import React from "react";
import { products } from "../../../data/products";
import ProductCard from "../../../components/product/ProductCard";

export default function MenCategoryPage() {
  const menProducts = products.filter((product) => product.category === "men");

  return (
    <main className="flex flex-col items-center min-h-[60vh] p-8">
      <h1 className="text-4xl font-bold mb-4">Colección para Hombres</h1>
      <p className="text-lg text-center mb-8 max-w-xl">
        Explora nuestra selección exclusiva de moda para hombres. Encuentra las últimas tendencias, ropa, accesorios y más.
      </p>
      <section className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {menProducts.length > 0 ? (
          menProducts.map((product: typeof products[0]) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No hay productos para hombres disponibles.</p>
        )}
      </section>
    </main>
  );
}
