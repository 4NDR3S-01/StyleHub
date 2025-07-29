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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
    if (product.images?.[0]) {
      setImagePreview(product.images[0]);
    }
    setIsModalOpen(true);
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

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
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

  // Helper to validate form data
  const validateFormData = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del producto es requerido',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: 'Error',
        description: 'El precio debe ser mayor a 0',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // Helper to prepare product data
  const prepareProductData = (imageUrl: string | null) => ({
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
    tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : null,
    featured: formData.featured,
    sale: formData.sale
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFormData()) return;

    setSubmitting(true);

    try {
      let imageUrl = null;

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

      const productData = prepareProductData(imageUrl);

      let result;
      if (editingProduct) {
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select();
      } else {
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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Extract product list rendering logic into a variable to avoid nested ternary
  let productListContent;
  if (loading) {
    productListContent = (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Cargando productos...</p>
      </div>
    );
  } else if (products.length === 0) {
    productListContent = (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">No hay productos registrados.</p>
      </div>
    );
  } else {
    productListContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map(prod => (
          <div key={prod.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Imagen del producto */}
            <div className="aspect-square bg-gray-100 relative h-80">
              {prod.images?.[0] ? (
                <img 
                  src={prod.images[0]} 
                  alt={prod.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-lg">Sin imagen</span>
                </div>
              )}
              
              {/* Badges de destacado y oferta */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {prod.featured && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                    Destacado
                  </span>
                )}
                {prod.sale && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                    Oferta
                  </span>
                )}
              </div>
            </div>

            {/* Contenido del card */}
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3 text-lg truncate">{prod.name}</h3>
              
              {/* Precio */}
              <div className="mb-4">
                <span className="text-xl font-bold text-gray-900">${prod.price}</span>
                {prod.original_price && prod.original_price > prod.price && (
                  <span className="text-sm text-gray-500 line-through ml-2">
                    ${prod.original_price}
                  </span>
                )}
              </div>

              {/* Etiquetas */}
              {prod.tags && prod.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {prod.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                  {prod.tags.length > 2 && (
                    <span className="text-sm text-gray-500">+{prod.tags.length - 2}</span>
                  )}
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditProductModal(prod)}
                  className="flex-1 flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 py-3"
                >
                  <Edit size={16} />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteProduct(prod.id)}
                  className="px-4 py-3 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Todos los productos</h1>
        <Button 
          onClick={() => {
            resetProductModal();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg"
        >
          <Plus size={20} />
          Agregar producto
        </Button>
      </div>

      {productListContent}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar producto' : 'Agregar nuevo producto'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del producto</Label>
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
              <Label htmlFor="image">Imagen del producto</Label>
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
                      aria-label="Eliminar imagen"
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
                <Label htmlFor="original_price">Precio original</Label>
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
                <Label htmlFor="featured">Producto destacado</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="sale"
                  checked={formData.sale}
                  onCheckedChange={(checked) => handleCheckboxChange('sale', checked as boolean)}
                />
                <Label htmlFor="sale">En oferta</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {(() => {
                let submitButtonText;
                if (submitting) {
                  submitButtonText = editingProduct ? 'Actualizando...' : 'Guardando...';
                } else {
                  submitButtonText = editingProduct ? 'Actualizar producto' : 'Guardar producto';
                }
                return (
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                    {submitButtonText}
                  </Button>
                );
              })()}
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
    </div>
  );
}