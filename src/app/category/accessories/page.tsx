import React from "react";
import { accessoriesProducts } from "../../../data/accessories";
import ProductCard from "../../../components/product/ProductCard";

export default function AccessoriesCategoryPage() {
    return (
        <main className="flex flex-col items-center min-h-[60vh] p-8">
            <h1 className="text-4xl font-bold mb-4">Descubre Nuestros Accesorios</h1>
            <p className="text-lg text-center mb-8 max-w-xl">Encuentra los mejores accesorios a tu alcance</p>
            <section className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {accessoriesProducts.length > 0 ? (
                    accessoriesProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500">No hay accesorios disponibles.</p>
                )}
            </section>
        </main>
    )
}