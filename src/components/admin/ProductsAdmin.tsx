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
import { getSubcategories } from '@/services/category.service';
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
  material?: string;
  season?: string;
  tags?: string[];
  featured: boolean;
  sale: boolean;
  sku?: string;
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
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; parent_name?: string }[]>([]);
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
    material: '',
    season: '',
    tags: '',
    featured: false,
    sale: false,
    sku: ''
  });

  // Estado para variantes
  const [variants, setVariants] = useState<{
    id?: string;
    color: string;
    size: string;
    stock: number;
    image?: string;
    imageFile?: File | null;
    imagePreview?: string | null;
    sku?: string;
    price_adjustment?: number;
  }[]>([]);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [variantForm, setVariantForm] = useState({
    color: '',
    size: '',
    stock: '',
    imageFile: null as File | null,
    imagePreview: null as string | null,
    sku: '',
    price_adjustment: ''
  });
  const [variantError, setVariantError] = useState<string | null>(null);

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

  const openEditProductModal = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      original_price: product.original_price ? product.original_price.toString() : '',
      category_id: product.category_id || '',
      brand: product.brand || '',
      material: product.material || '',
      season: product.season || '',
      tags: product.tags ? product.tags.join(', ') : '',
      featured: product.featured,
      sale: product.sale,
      sku: product.sku || ''
    });
    if (product.images?.[0]) {
      setImagePreview(product.images[0]);
    }
    // Cargar variantes del producto
    const { data: variantData } = await supabase
      .from('product_variants')
      .select('id, color, size, stock, image, sku, price_adjustment')
      .eq('product_id', product.id);
    setVariants(
      (variantData || []).map((v: any) => ({
        id: v.id,
        color: v.color,
        size: v.size,
        stock: v.stock,
        image: v.image,
        imageFile: null,
        imagePreview: v.image || null,
        sku: v.sku || '',
        price_adjustment: v.price_adjustment || 0
      }))
    );
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
      material: '',
      season: '',
      tags: '',
      featured: false,
      sale: false,
      sku: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    setVariants([]);
    setVariantForm({ 
      color: '', 
      size: '', 
      stock: '', 
      imageFile: null, 
      imagePreview: null,
      sku: '',
      price_adjustment: ''
    });
    setEditingVariantIndex(null);
  };
  // Subir imagen de variante a Supabase
  const uploadVariantImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `variant-${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `variants/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('productos')
        .getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (error: any) {
      toast({
        title: 'Error al subir la imagen de la variante',
        description: error?.message || 'Error desconocido',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Manejo de formulario de variante
  const handleVariantInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVariantForm(prev => ({ ...prev, [name]: value }));
  };
  const handleVariantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVariantForm(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setVariantForm(prev => ({ ...prev, imagePreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleAddOrEditVariant = () => {
    setVariantError(null);
    if (!variantForm.color.trim() || !variantForm.size.trim() || !variantForm.stock.trim()) {
      setVariantError('Completa color, talla y stock para la variante.');
      toast({
        title: 'Error en variante',
        description: 'Completa color, talla y stock para la variante.',
        variant: 'destructive',
      });
      return;
    }
    const stockNum = parseInt(variantForm.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setVariantError('El stock debe ser un número mayor o igual a 0.');
      toast({
        title: 'Error en variante',
        description: 'El stock debe ser un número mayor o igual a 0.',
        variant: 'destructive',
      });
      return;
    }

    const priceAdjustment = variantForm.price_adjustment ? parseFloat(variantForm.price_adjustment) : 0;
    if (isNaN(priceAdjustment)) {
      setVariantError('El ajuste de precio debe ser un número válido.');
      toast({
        title: 'Error en variante',
        description: 'El ajuste de precio debe ser un número válido.',
        variant: 'destructive',
      });
      return;
    }

    // Prevención de duplicados (color + talla)
    const isDuplicate = variants.some((v, i) =>
      v.color.trim().toLowerCase() === variantForm.color.trim().toLowerCase() &&
      v.size.trim().toLowerCase() === variantForm.size.trim().toLowerCase() &&
      (editingVariantIndex === null || i !== editingVariantIndex)
    );
    if (isDuplicate) {
      setVariantError('Ya existe una variante con ese color y talla.');
      toast({
        title: 'Variante duplicada',
        description: 'Ya existe una variante con ese color y talla.',
        variant: 'destructive',
      });
      return;
    }
    const newVariant = {
      color: variantForm.color,
      size: variantForm.size,
      stock: stockNum,
      imageFile: variantForm.imageFile,
      imagePreview: variantForm.imagePreview,
      sku: variantForm.sku,
      price_adjustment: priceAdjustment
    };
    if (editingVariantIndex !== null) {
      setVariants(prev => prev.map((v, i) => (i === editingVariantIndex ? { ...v, ...newVariant } : v)));
      setEditingVariantIndex(null);
      toast({
        title: 'Variante actualizada',
        description: 'La variante fue actualizada correctamente.',
        variant: 'default',
      });
    } else {
      setVariants(prev => [...prev, newVariant]);
      toast({
        title: 'Variante agregada',
        description: 'La variante fue agregada correctamente.',
        variant: 'default',
      });
    }
    setVariantForm({ 
      color: '', 
      size: '', 
      stock: '', 
      imageFile: null, 
      imagePreview: null,
      sku: '',
      price_adjustment: ''
    });
  };
  const handleEditVariant = (idx: number) => {
    const v = variants[idx];
    setVariantForm({
      color: v.color,
      size: v.size,
      stock: v.stock.toString(),
      imageFile: v.imageFile || null,
      imagePreview: v.imagePreview || v.image || null,
      sku: v.sku || '',
      price_adjustment: v.price_adjustment?.toString() || ''
    });
    setEditingVariantIndex(idx);
    setVariantError(null);
    toast({
      title: 'Editando variante',
      description: `Editando variante ${v.color} / ${v.size}`,
      variant: 'default',
    });
  };
  const handleDeleteVariant = (idx: number) => {
    const v = variants[idx];
    setVariants(prev => prev.filter((_, i) => i !== idx));
    setEditingVariantIndex(null);
    setVariantForm({ 
      color: '', 
      size: '', 
      stock: '', 
      imageFile: null, 
      imagePreview: null,
      sku: '',
      price_adjustment: ''
    });
    setVariantError(null);
    toast({
      title: 'Variante eliminada',
      description: `Variante ${v.color} / ${v.size} eliminada correctamente.`,
      variant: 'default',
    });
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
    material: formData.material || null,
    season: formData.season || null,
    tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : null,
    featured: formData.featured,
    sale: formData.sale,
    sku: formData.sku || null
  });

  // Helper to upload product image and return URL or null
  const handleProductImageUpload = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    const imageUrl = await uploadImageToSupabase(selectedImage);
    if (!imageUrl) {
      toast({
        title: 'Error al subir la imagen',
        description: 'No se pudo obtener la URL de la imagen',
        variant: 'destructive',
      });
    }
    return imageUrl;
  };

  // Helper to save or update product and return productId or null
  const saveOrUpdateProduct = async (productData: any): Promise<{ productId: string | null, error: any }> => {
    let result;
    let productId = editingProduct?.id || null;
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
      if (result.data?.[0]) {
        productId = result.data[0].id;
      }
    }
    return { productId, error: result.error };
  };

  // Helper to save variants for a product
  const saveProductVariants = async (productId: string) => {
    // Eliminar variantes existentes si es edición
    if (editingProduct) {
      await supabase.from('product_variants').delete().eq('product_id', productId);
    }
    for (const v of variants) {
      let variantImageUrl = v.image;
      if (v.imageFile) {
        variantImageUrl = (await uploadVariantImageToSupabase(v.imageFile)) ?? undefined;
      }
      
      // Generar SKU automático si no se proporciona
      const variantSku = v.sku || `${formData.sku || formData.name.replace(/\s+/g, '')}-${v.color}-${v.size}`.toUpperCase();
      
      await supabase.from('product_variants').insert({
        product_id: productId,
        color: v.color,
        size: v.size,
        stock: v.stock,
        image: variantImageUrl ?? undefined,
        sku: variantSku,
        price_adjustment: v.price_adjustment || 0
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFormData()) return;
    setSubmitting(true);
    try {
      const imageUrl = await handleProductImageUpload();
      if (selectedImage && !imageUrl) {
        setSubmitting(false);
        return;
      }
      const productData = prepareProductData(imageUrl);
      const { productId, error } = await saveOrUpdateProduct(productData);
      if (error) {
        toast({
          title: `Error al ${editingProduct ? 'actualizar' : 'guardar'} el producto`,
          description: error.message,
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }
      if (productId) {
        await saveProductVariants(productId);
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
      .select('id, name, description, price, original_price, images, brand, material, season, tags, featured, sale, sku, categories(name, parent_id, categories!parent_id(name))')
      .order('created_at', { ascending: false });
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  const fetchSubcategories = async () => {
    try {
      const data = await getSubcategories();
      setSubcategories(data);
    } catch (e) {
      // No toast para evitar ruido visual
      console.error('Error fetching subcategories:', e);
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

  useEffect(() => {
    fetchProducts();
    fetchSubcategories();
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
              <Label htmlFor="category_id">Subcategoría *</Label>
              <Select onValueChange={handleSelectChange} value={formData.category_id} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una subcategoría" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.parent_name && `${sub.parent_name} > `}{sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="Código único del producto"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="todo_año">Todo el año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            {/* Variantes y stock */}
            <div>
              <Label>Variantes y stock</Label>
              <div className="space-y-2 mt-2">
                <div className="grid grid-cols-6 gap-2">
                  <Input
                    name="color"
                    value={variantForm.color}
                    onChange={handleVariantInputChange}
                    placeholder="Color"
                  />
                  <Input
                    name="size"
                    value={variantForm.size}
                    onChange={handleVariantInputChange}
                    placeholder="Talla"
                  />
                  <Input
                    name="stock"
                    type="number"
                    min="0"
                    value={variantForm.stock}
                    onChange={handleVariantInputChange}
                    placeholder="Stock"
                  />
                  <Input
                    name="sku"
                    value={variantForm.sku}
                    onChange={handleVariantInputChange}
                    placeholder="SKU variante"
                  />
                  <Input
                    name="price_adjustment"
                    type="number"
                    step="0.01"
                    value={variantForm.price_adjustment}
                    onChange={handleVariantInputChange}
                    placeholder="Ajuste $"
                  />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleVariantImageChange}
                      className="block w-full text-xs"
                    />
                    {variantForm.imagePreview && (
                      <img src={variantForm.imagePreview} alt="Variante" className="w-10 h-10 object-cover mt-1 rounded" />
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Button type="button" size="sm" onClick={handleAddOrEditVariant} aria-label={editingVariantIndex !== null ? 'Actualizar variante' : 'Agregar variante'}>
                    {editingVariantIndex !== null ? 'Actualizar variante' : 'Agregar variante'}
                  </Button>
                  {editingVariantIndex !== null && (
                    <Button type="button" size="sm" variant="outline" onClick={() => {
                      setEditingVariantIndex(null);
                      setVariantForm({ 
                        color: '', 
                        size: '', 
                        stock: '', 
                        imageFile: null, 
                        imagePreview: null,
                        sku: '',
                        price_adjustment: ''
                      });
                      setVariantError(null);
                    }} aria-label="Cancelar edición de variante">
                      Cancelar edición
                    </Button>
                  )}
                  {variantError && (
                    <span className="text-xs text-red-600 ml-2">{variantError}</span>
                  )}
                </div>
                {/* Lista de variantes */}
                {variants.length > 0 && (
                  <div className="mt-2 border rounded p-2 bg-gray-50">
                    <div className="grid grid-cols-7 gap-2 font-semibold text-xs text-gray-600 mb-1">
                      <span>Color</span>
                      <span>Talla</span>
                      <span>Stock</span>
                      <span>SKU</span>
                      <span>Ajuste $</span>
                      <span>Imagen</span>
                      <span>Acciones</span>
                    </div>
                    {variants.map((v, idx) => (
                      <div
                        key={v.id ?? `${v.color}-${v.size}`}
                        className="grid grid-cols-7 gap-2 items-center border-b last:border-b-0 py-1"
                      >
                        <span className="text-sm">{v.color}</span>
                        <span className="text-sm">{v.size}</span>
                        <span className="text-sm">{v.stock}</span>
                        <span className="text-xs text-gray-600">{v.sku || '-'}</span>
                        <span className="text-sm">{v.price_adjustment ? `$${v.price_adjustment}` : '$0'}</span>
                        <span>{v.imagePreview || v.image ? <img src={v.imagePreview || v.image} alt="Variante" className="w-8 h-8 object-cover rounded" /> : '-'}</span>
                        <span className="flex gap-1">
                          <Button type="button" size="sm" variant="outline" onClick={() => handleEditVariant(idx)} aria-label={`Editar variante ${v.color} ${v.size}`}>Editar</Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => handleDeleteVariant(idx)} aria-label={`Eliminar variante ${v.color} ${v.size}`}>×</Button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* ...botones de acción... */}
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