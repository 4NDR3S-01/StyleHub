'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { Plus, X, Upload, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  images?: string[];
  category_id?: string;
  brand?: string;
  gender?: string;
  material?: string;
  season?: string;
  tags?: string[];
  featured: boolean;
  sale: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  parent_id?: string;
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    category_id: '',
    brand: '',
    gender: '',
    material: '',
    season: '',
    tags: '',
    featured: false,
    sale: false
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category_id: value }));
  };

  const handleCheckboxChange = (field: 'featured' | 'sale', checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({ 
      ...prev, 
      [name]: value,
      // Auto-generar slug desde el nombre
      slug: name === 'name' ? value.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '') : prev.slug
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      original_price: product.original_price ? product.original_price.toString() : '',
      category_id: product.category_id || '',
      brand: product.brand || '',
      gender: product.gender || '',
      material: product.material || '',
      season: product.season || '',
      tags: product.tags ? product.tags.join(', ') : '',
      featured: product.featured,
      sale: product.sale
    });
    if (product.images && product.images[0]) {
      setImagePreview(product.images[0]);
    }
    setIsModalOpen(true);
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

  const resetProductModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      original_price: '',
      category_id: '',
      brand: '',
      gender: '',
      material: '',
      season: '',
      tags: '',
      featured: false,
      sale: false
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const resetCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      slug: '',
      description: ''
    });
  };

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file);

      if (uploadError) {
        toast({
          title: 'Error al subir la imagen',
          description: uploadError.message,
          variant: 'destructive',
        });
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('productos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      toast({
        title: 'Error al subir la imagen',
        description: error?.message || 'Error desconocido',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del producto es requerido',
        variant: 'destructive',
      });
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: 'Error',
        description: 'El precio debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    
    try {
      let imageUrl = null;
      
      // Subir imagen a Supabase Storage si hay una seleccionada
      if (selectedImage) {
        imageUrl = await uploadImageToSupabase(selectedImage);
        if (!imageUrl) {
          toast({
            title: 'Error al subir la imagen',
            description: 'No se pudo obtener la URL de la imagen',
            variant: 'destructive',
          });
          return;
        }
      }

      // Preparar datos para insertar/actualizar
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        images: imageUrl ? [imageUrl] : (editingProduct?.images || null),
        category_id: formData.category_id || null,
        brand: formData.brand || null,
        gender: formData.gender || null,
        material: formData.material || null,
        season: formData.season || null,
        // Convertir tags de string a array
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : null,
        featured: formData.featured,
        sale: formData.sale
      };

      let result;
      if (editingProduct) {
        // Actualizar producto existente
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select();
      } else {
        // Insertar nuevo producto
        result = await supabase
          .from('products')
          .insert([productData])
          .select();
      }

      if (result.error) {
        toast({
          title: `Error al ${editingProduct ? 'actualizar' : 'guardar'} el producto`,
          description: result.error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: `Producto ${editingProduct ? 'actualizado' : 'guardado'} exitosamente!`,
        variant: 'default',
      });
      setIsModalOpen(false);
      resetProductModal();
      fetchProducts();
    } catch (error: any) {
      toast({
        title: `Error al ${editingProduct ? 'actualizar' : 'guardar'} el producto`,
        description: error?.message || 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, original_price, images, brand, gender, material, season, tags, featured, sale');
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, image, description, parent_id')
      .order('name');
    if (!error && data) setCategories(data);
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
          title: `Error al ${editingCategory ? 'actualizar' : 'guardar'} la categoría`,
          description: result.error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: `Categoría ${editingCategory ? 'actualizada' : 'guardada'} exitosamente!`,
        variant: 'default',
      });
      setIsCategoryModalOpen(false);
      resetCategoryModal();
      fetchCategories();
    } catch (error: any) {
      toast({
        title: `Error al ${editingCategory ? 'actualizar' : 'guardar'} la categoría`,
        description: error?.message || 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (error) {
          toast({
            title: 'Error al eliminar el producto',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Producto eliminado exitosamente!',
          variant: 'default',
        });
        fetchProducts();
      } catch (error: any) {
        toast({
          title: 'Error al eliminar el producto',
          description: error?.message || 'Error desconocido',
          variant: 'destructive',
        });
      }
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
            title: 'Error al eliminar la categoría',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Categoría eliminada exitosamente!',
          variant: 'default',
        });
        fetchCategories();
      } catch (error: any) {
        toast({
          title: 'Error al eliminar la categoría',
          description: error?.message || 'Error desconocido',
          variant: 'destructive',
        });
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  return (
    <div>
      <div className="mb-6 flex gap-3">
        <Button 
          onClick={() => {
            resetProductModal();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Añadir Producto
        </Button>
        <Button 
          onClick={() => {
            resetCategoryModal();
            setIsCategoryModalOpen(true);
          }}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Añadir Categoría
        </Button>
      </div>

      {/* Sección de Categorías */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Gestión de Categorías</h2>
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
        ) : (
          <p className="text-gray-500 mb-6">No hay categorías creadas aún.</p>
        )}
      </div>

      {/* Sección de Productos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Gestión de Productos</h2>
        {loading ? (
          <p>Cargando productos...</p>
        ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Imagen</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">Precio</th>
              <th className="p-2">Etiquetas</th>
              <th className="p-2">Destacado</th>
              <th className="p-2">Oferta</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(prod => (
              <tr key={prod.id} className="border-t">
                <td className="p-2">
                  {prod.images && prod.images[0] ? (
                    <img src={prod.images[0]} alt={prod.name} className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">Sin imagen</span>
                    </div>
                  )}
                </td>
                <td className="p-2">{prod.name}</td>
                <td className="p-2">${prod.price}</td>
                <td className="p-2">
                  {prod.tags && prod.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {prod.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                      {prod.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{prod.tags.length - 3} más</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Sin etiquetas</span>
                  )}
                </td>
                <td className="p-2">{prod.featured ? 'Sí' : 'No'}</td>
                <td className="p-2">{prod.sale ? 'Sí' : 'No'}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditProductModal(prod)}
                      className="p-2"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteProduct(prod.id)}
                      className="p-2"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetProductModal();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ingresa el nombre del producto"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe el producto"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image">Imagen del Producto</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Haz clic para subir una imagen
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, GIF hasta 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="original_price">Precio Original</Label>
                <Input
                  id="original_price"
                  name="original_price"
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category_id">Categoría *</Label>
              <Select onValueChange={handleSelectChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="Marca del producto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Género</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hombre">Hombre</SelectItem>
                    <SelectItem value="mujer">Mujer</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  name="material"
                  value={formData.material}
                  onChange={handleInputChange}
                  placeholder="Material del producto"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="season">Temporada</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, season: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona temporada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primavera">Primavera</SelectItem>
                    <SelectItem value="verano">Verano</SelectItem>
                    <SelectItem value="otoño">Otoño</SelectItem>
                    <SelectItem value="invierno">Invierno</SelectItem>
                    <SelectItem value="todo el año">Todo el año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="casual, elegante, deportivo, cómodo..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separa las etiquetas con comas
                </p>
              </div>
            </div>

            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleCheckboxChange('featured', checked as boolean)}
                />
                <Label htmlFor="featured">Producto Destacado</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="sale"
                  checked={formData.sale}
                  onCheckedChange={(checked) => handleCheckboxChange('sale', checked as boolean)}
                />
                <Label htmlFor="sale">En Oferta</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? (editingProduct ? 'Actualizando...' : 'Guardando...') : (editingProduct ? 'Actualizar Producto' : 'Guardar Producto')}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsModalOpen(false);
                  resetProductModal();
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

      {/* Modal para crear categorías */}
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