'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('categories').select('*');
      if (!error && data) setCategories(data);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Cargando categorías...</p>
      ) : (
        <ul className="space-y-2">
          {categories.map(cat => (
            <li key={cat.id} className="border p-2 rounded flex items-center gap-4">
              {cat.image && <img src={cat.image} alt={cat.name} className="w-10 h-10 object-cover rounded" />}
              <span className="font-semibold">{cat.name}</span>
              <span className="text-gray-500">({cat.slug})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
