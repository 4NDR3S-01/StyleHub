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
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, image, description, parent_id')
      .order('name');
    
    if (error) {
      toast({
        title: 'Error al cargar categorías',
        description: error.message,
        variant: 'destructive',
      });
    } else if (data) {
      setCategories(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div>
      <div className="mb-6">
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

      {loading ? (
        <p>Cargando categorías...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500">No hay categorías registradas.</p>
      ) : (
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
      )}

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
                {submitting ? (editingCategory ? 'Actualizando...' : 'Guardando...') : (editingCategory ? 'Actualizar Categoría' : 'Crear Categoría')}
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
