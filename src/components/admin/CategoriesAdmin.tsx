'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, X, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  parent_id?: string;
}

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  // Mejoras: filtro de búsqueda y paginación
  const [search, setSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({ 
      ...prev, 
      [name]: value,
      // Auto-generar slug desde el nombre
      slug: name === 'name' ? value.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') : prev.slug
    }));
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || ''
    });
    setIsCategoryModalOpen(true);
  };

  const resetCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      slug: '',
      description: ''
    });
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryFormData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la categoría es requerido',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    
    try {
      let result;
      if (editingCategory) {
        // Actualizar categoría existente
        result = await supabase
          .from('categories')
          .update(categoryFormData)
          .eq('id', editingCategory.id)
          .select();
      } else {
        // Insertar nueva categoría
        result = await supabase
          .from('categories')
          .insert([categoryFormData])
          .select();
      }

      if (result.error) {
        toast({
          title: 'Error',
          description: `Error al ${editingCategory ? 'actualizar' : 'guardar'} la categoría: ${result.error.message}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Éxito',
        description: `Categoría ${editingCategory ? 'actualizada' : 'guardada'} exitosamente!`,
      });

      setIsCategoryModalOpen(false);
      resetCategoryModal();
      fetchCategories();
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Error al ${editingCategory ? 'actualizar' : 'guardar'} la categoría: ${error?.message || 'Error desconocido'}`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);

        if (error) {
          toast({
            title: 'Error',
            description: 'Error al eliminar la categoría: ' + error.message,
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Éxito',
          description: 'Categoría eliminada exitosamente!',
        });
        fetchCategories();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Error al eliminar la categoría: ' + (error?.message || 'Error desconocido'),
          variant: 'destructive',
        });
      }
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    let query = supabase
      .from('categories')
      .select('id, name, slug, image, description, parent_id', { count: 'exact' })
      .order('name')
      .range((pagina - 1) * porPagina, pagina * porPagina - 1);
    if (search) query = query.ilike('name', `%${search}%`);
    const { data, error, count } = await query;
    if (error) {
      toast({
        title: 'Error al cargar categorías',
        description: error.message,
        variant: 'destructive',
      });
    } else if (data) {
      setCategories(data);
      setTotalPaginas(count ? Math.ceil(count / porPagina) : 1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, [pagina, porPagina, search]);

  // Extracted button text for clarity
  let submitButtonText = '';
  if (submitting) {
    submitButtonText = editingCategory ? 'Actualizando...' : 'Guardando...';
  } else {
    submitButtonText = editingCategory ? 'Actualizar Categoría' : 'Crear Categoría';
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2 items-center">
          <Input
            type="text"
            placeholder="Buscar categoría por nombre..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPagina(1); }}
            className="max-w-xs border-slate-300 focus:border-pink-400 focus:ring-pink-200"
            autoComplete="off"
          />
        </div>
        <Button 
          onClick={() => {
            resetCategoryModal();
            setIsCategoryModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Añadir Categoría
        </Button>
      </div>

      {(() => {
        if (loading) {
          return <p>Cargando categorías...</p>;
        }
        if (categories.length === 0) {
          return <p className="text-gray-500">No hay categorías registradas.</p>;
        }
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <div key={category.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="font-medium text-lg mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600 mb-2">Slug: {category.slug}</p>
                {category.description && (
                  <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditCategoryModal(category)}
                    className="flex items-center gap-1"
                  >
                    <Edit size={14} />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteCategory(category.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
      {/* Paginación */}
      <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setPagina(1)} disabled={pagina === 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40">{'<<'}</button>
          <button onClick={() => setPagina(pagina - 1)} disabled={pagina === 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40">{'<'}</button>
          <span className="font-semibold">Página {pagina} de {totalPaginas}</span>
          <button onClick={() => setPagina(pagina + 1)} disabled={pagina === totalPaginas} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40">{'>'}</button>
          <button onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40">{'>>'}</button>
        </div>
        <div className="flex items-center gap-2">
          <span>Categorías por página:</span>
          <select value={porPagina} onChange={e => { setPorPagina(Number(e.target.value)); setPagina(1); }} className="border border-slate-300 rounded px-2 py-1">
            {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Modal para crear/editar categorías */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  resetCategoryModal();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
              <Label htmlFor="category_name">Nombre de la Categoría</Label>
              <Input
                id="category_name"
                name="name"
                value={categoryFormData.name}
                onChange={handleCategoryInputChange}
                placeholder="Ej: Ropa para hombres"
                required
              />
            </div>

            <div>
              <Label htmlFor="category_description">Descripción</Label>
              <Textarea
                id="category_description"
                name="description"
                value={categoryFormData.description}
                onChange={handleCategoryInputChange}
                placeholder="Describe la categoría"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category_slug">Slug (se genera automáticamente)</Label>
              <Input
                id="category_slug"
                name="slug"
                value={categoryFormData.slug}
                onChange={handleCategoryInputChange}
                placeholder="ropa-para-hombres"
                disabled
                className="bg-gray-100"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitButtonText}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  resetCategoryModal();
                }}
                className="flex-1"
                disabled={submitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
