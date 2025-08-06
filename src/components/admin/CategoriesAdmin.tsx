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
import { validateImageFile, resizeImage, generateUniqueFileName } from '@/utils/imageUtils';

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
  active: boolean;
  sort_order: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
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
    description: '',
    active: true,
    sort_order: 0,
    meta_title: '',
    meta_description: '',
    image: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  // Mejoras: filtro de búsqueda y paginación
  const [search, setSearch] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar archivo
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast({
        title: 'Error',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Redimensionar imagen
      const resizedFile = await resizeImage(file, 800, 400, 0.8);
      setImageFile(resizedFile);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(resizedFile);
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      toast({
        title: 'Error',
        description: 'Error al procesar la imagen',
        variant: 'destructive',
      });
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileName = generateUniqueFileName(file.name);
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('categories')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error al subir imagen:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('categories')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error en uploadImage:', error);
      return null;
    }
  };

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    let processedValue: string | number | boolean = value;
    if (type === 'checkbox') {
      processedValue = checked;
    } else if (type === 'number') {
      processedValue = Number(value);
    }
    
    setCategoryFormData(prev => ({ 
      ...prev, 
      [name]: processedValue,
      // Auto-generar slug desde el nombre
      slug: name === 'name' ? value.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remover acentos
        .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
        .replace(/\s+/g, '-') // Espacios a guiones
        .replace(/-+/g, '-') // Múltiples guiones a uno solo
        .trim() : prev.slug
    }));
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      active: category.active,
      sort_order: category.sort_order,
      meta_title: category.meta_title || '',
      meta_description: category.meta_description || '',
      image: category.image || ''
    });
    setImagePreview(category.image || '');
    setImageFile(null);
    setIsCategoryModalOpen(true);
  };

  const resetCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      slug: '',
      description: '',
      active: true,
      sort_order: 0,
      meta_title: '',
      meta_description: '',
      image: ''
    });
    setImageFile(null);
    setImagePreview('');
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
      let imageUrl = categoryFormData.image;
      
      // Si hay una nueva imagen, subirla
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          toast({
            title: 'Error',
            description: 'Error al subir la imagen',
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }
      }

      const dataToSubmit = {
        ...categoryFormData,
        image: imageUrl
      };

      let result;
      if (editingCategory) {
        // Actualizar categoría existente
        result = await supabase
          .from('categories')
          .update(dataToSubmit)
          .eq('id', editingCategory.id)
          .select();
      } else {
        // Insertar nueva categoría
        result = await supabase
          .from('categories')
          .insert([dataToSubmit])
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
      .select('id, name, slug, image, description, parent_id, active, sort_order, meta_title, meta_description, created_at, updated_at', { count: 'exact' })
      .is('parent_id', null) // Solo categorías principales (sin parent_id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
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
    submitButtonText = editingCategory ? 'Actualizar Categoría Principal' : 'Crear Categoría Principal';
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Gestión de Categorías Principales
        </h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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
            Añadir Categoría Principal
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          💡 Solo se muestran las categorías principales. Las subcategorías se gestionan por separado.
        </p>
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
              <div key={category.id} className={`border rounded-lg overflow-hidden bg-white shadow-sm ${!category.active ? 'opacity-60 bg-gray-50' : ''}`}>
                {category.image && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-lg">{category.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {category.active ? 'Activa' : 'Inactiva'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        #{category.sort_order}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Slug: {category.slug}</p>
                  {category.description && (
                    <p className="text-sm text-gray-500 mb-3">{category.description}</p>
                  )}
                  {category.meta_title && (
                    <p className="text-xs text-blue-600 mb-1">Meta Title: {category.meta_title}</p>
                  )}
                  <div className="flex gap-2 mt-3">
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
        <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {editingCategory ? 'Editar Categoría Principal' : 'Crear Nueva Categoría Principal'}
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
              <Label htmlFor="category_name">Nombre de la Categoría Principal</Label>
              <Input
                id="category_name"
                name="name"
                value={categoryFormData.name}
                onChange={handleCategoryInputChange}
                placeholder="Ej: Hombres, Mujeres, Accesorios"
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
                placeholder="Describe la categoría principal"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category_image">Imagen de la Categoría</Label>
              <div className="space-y-3">
                <Input
                  id="category_image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {imagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-40 h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                        setCategoryFormData(prev => ({ ...prev, image: '' }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      aria-label="Eliminar imagen"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Formatos permitidos: JPG, PNG, WebP</p>
                  <p>• Tamaño máximo: 5MB</p>
                  <p>• Dimensiones recomendadas: 800x400px</p>
                  <p>• La imagen se redimensionará automáticamente</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="category_slug">Slug (se genera automáticamente)</Label>
              <Input
                id="category_slug"
                name="slug"
                value={categoryFormData.slug}
                onChange={handleCategoryInputChange}
                placeholder="hombres-mujeres-accesorios"
                disabled
                className="bg-gray-100"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="category_active"
                name="active"
                type="checkbox"
                checked={categoryFormData.active}
                onChange={handleCategoryInputChange}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <Label htmlFor="category_active" className="text-sm font-medium text-gray-700">
                Categoría activa
              </Label>
            </div>

            <div>
              <Label htmlFor="category_sort_order">Orden de visualización</Label>
              <Input
                id="category_sort_order"
                name="sort_order"
                type="number"
                min="0"
                value={categoryFormData.sort_order}
                onChange={handleCategoryInputChange}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Orden numérico para mostrar las categorías (menor número = primera posición)
              </p>
            </div>

            <div>
              <Label htmlFor="category_meta_title">Meta Title (SEO)</Label>
              <Input
                id="category_meta_title"
                name="meta_title"
                value={categoryFormData.meta_title}
                onChange={handleCategoryInputChange}
                placeholder="Título para SEO (máx. 60 caracteres)"
                maxLength={60}
              />
            </div>

            <div>
              <Label htmlFor="category_meta_description">Meta Description (SEO)</Label>
              <Textarea
                id="category_meta_description"
                name="meta_description"
                value={categoryFormData.meta_description}
                onChange={handleCategoryInputChange}
                placeholder="Descripción para motores de búsqueda (máx. 160 caracteres)"
                rows={2}
                maxLength={160}
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
