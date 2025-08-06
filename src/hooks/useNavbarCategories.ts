'use client';

import { useState, useEffect } from 'react';
import { getMainCategoriesForNavbar } from '@/services/category.service';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

export function useNavbarCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getMainCategoriesForNavbar();
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar categorías del navbar:', err);
        setError('Error al cargar categorías');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
