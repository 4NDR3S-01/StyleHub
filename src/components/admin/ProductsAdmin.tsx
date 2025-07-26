'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  featured: boolean;
  sale: boolean;
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('id, name, price, stock, featured, sale');
      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Nombre</th>
              <th className="p-2">Precio</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Destacado</th>
              <th className="p-2">Oferta</th>
            </tr>
          </thead>
          <tbody>
            {products.map(prod => (
              <tr key={prod.id} className="border-t">
                <td className="p-2">{prod.name}</td>
                <td className="p-2">${prod.price}</td>
                <td className="p-2">{prod.stock}</td>
                <td className="p-2">{prod.featured ? 'Sí' : 'No'}</td>
                <td className="p-2">{prod.sale ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
