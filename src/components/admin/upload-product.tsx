'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  parent_name?: string;
}

interface ProductVariant {
  color: string;
  size: string;
  stock: number;
  image?: string;
}

interface ProductData {
  name: string;
  description: string;
  price: number;
  original_price?: number;
  images: string[];
  category_id: string;
  brand: string;
  gender: string;
  material: string;
  tags: string[];
  featured: boolean;
  sale: boolean;
}

export default function UploadProduct() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [currentTag, setCurrentTag] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [currentVariant, setCurrentVariant] = useState<ProductVariant>({
    color: '',
    size: '',
    stock: 0,
    image: ''
  });

  const [productData, setProductData] = useState<ProductData>({
    name: '',
    description: '',
    price: 0,
    original_price: 0,
    images: [],
    category_id: '',
    brand: '',
    gender: '',
    material: '',
    tags: [],
    featured: false,
    sale: false
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Obtener todas las categorías con información del padre
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id, name, slug, parent_id,
          parent:categories!parent_id(name)
        `)
        .order('name');

      if (error) throw error;
      
      // Mapear los datos para incluir el nombre del padre
      const categoriesWithParent = (data || []).map(cat => ({
        ...cat,
        parent_name: cat.parent ? (cat.parent as any).name : null
      }));
      
      setCategories(categoriesWithParent);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive"
      });
    }
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const updateImageUrl = (index: number, url: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = url;
    setImageUrls(newUrls);
  };

  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls.length ? newUrls : ['']);
  };

  const addTag = () => {
    if (currentTag.trim() && !productData.tags.includes(currentTag.trim())) {
      setProductData({
        ...productData,
        tags: [...productData.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProductData({
      ...productData,
      tags: productData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addVariant = () => {
    if (currentVariant.color && currentVariant.size) {
      setVariants([...variants, { ...currentVariant }]);
      setCurrentVariant({ color: '', size: '', stock: 0, image: '' });
    }
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar datos
      if (!productData.name || !productData.description || !productData.price || !productData.category_id) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      // Filtrar URLs de imágenes válidas
      const validImages = imageUrls.filter(url => url.trim() !== '');
      if (validImages.length === 0) {
        throw new Error('Agrega al menos una imagen del producto');
      }

      // Crear el producto
      const productToInsert = {
        ...productData,
        images: validImages,
        original_price: productData.sale ? productData.original_price : null
      };

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([productToInsert])
        .select()
        .single();

      if (productError) throw productError;

      // Insertar variantes si existen
      if (variants.length > 0) {
        const variantsToInsert = variants.map(variant => ({
          ...variant,
          product_id: product.id
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;
      }

      toast({
        title: "¡Éxito!",
        description: `Producto "${product.name}" creado correctamente en la categoría seleccionada`,
      });

      // Resetear formulario
      setProductData({
        name: '',
        description: '',
        price: 0,
        original_price: 0,
        images: [],
        category_id: '',
        brand: '',
        gender: '',
        material: '',
        tags: [],
        featured: false,
        sale: false
      });
      setImageUrls(['']);
      setVariants([]);
      setCurrentTag('');

    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nuevo Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={productData.name}
                  onChange={(e) => setProductData({...productData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={productData.brand}
                  onChange={(e) => setProductData({...productData, brand: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={productData.description}
                onChange={(e) => setProductData({...productData, description: e.target.value})}
                required
              />
            </div>

            {/* Precios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Precio (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="25.09"
                  value={productData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setProductData({...productData, price: 0});
                    } else {
                      // Redondear a 2 decimales para evitar problemas de precisión
                      const numValue = Math.round(parseFloat(value) * 100) / 100;
                      setProductData({...productData, price: numValue});
                    }
                  }}
                  required
                />
                <small className="text-gray-500">Ejemplo: 25.09 para $25.09 USD</small>
              </div>
              <div>
                <Label htmlFor="original_price">Precio Original (USD) - Si está en oferta</Label>
                <Input
                  id="original_price"
                  type="number"
                  step="0.01"
                  placeholder="30.00"
                  value={productData.original_price || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setProductData({...productData, original_price: undefined});
                    } else {
                      // Redondear a 2 decimales para evitar problemas de precisión
                      const numValue = Math.round(parseFloat(value) * 100) / 100;
                      setProductData({...productData, original_price: numValue});
                    }
                  }}
                />
                <small className="text-gray-500">Solo si el producto está en descuento</small>
              </div>
              <div className="flex items-center space-x-4 pt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={productData.sale}
                    onChange={(e) => setProductData({...productData, sale: e.target.checked})}
                    className="mr-2"
                  />{' '}
                  En Oferta
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={productData.featured}
                    onChange={(e) => setProductData({...productData, featured: e.target.checked})}
                    className="mr-2"
                  />{' '}
                  Destacado
                </label>
              </div>
            </div>

            {/* Categoría y detalles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Select 
                  value={productData.category_id} 
                  onValueChange={(value) => {
                    console.log('Categoría seleccionada:', value);
                    setProductData({...productData, category_id: value});
                  }}
                >
                  <SelectTrigger className={!productData.category_id ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.parent_name 
                          ? `${category.parent_name} > ${category.name}` 
                          : category.name
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!productData.category_id && (
                  <small className="text-red-500">Selecciona una categoría</small>
                )}
              </div>
              <div>
                <Label htmlFor="gender">Género</Label>
                <Select value={productData.gender} onValueChange={(value) => setProductData({...productData, gender: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="unisex">Unisex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={productData.material}
                  onChange={(e) => setProductData({...productData, material: e.target.value})}
                />
              </div>
            </div>

            {/* Imágenes */}
            <div>
              <Label>Imágenes del Producto *</Label>
              <div className="space-y-2">
                {imageUrls.map((url, index) => (
                  <div key={url || `image-${index}`} className="flex gap-2">
                    <Input
                      placeholder="URL de la imagen"
                      value={url}
                      onChange={(e) => updateImageUrl(index, e.target.value)}
                    />
                    {imageUrls.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeImageUrl(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImageUrl}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar otra imagen
                </Button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Etiquetas</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Agregar etiqueta"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {productData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Variantes */}
            <div>
              <Label>Variantes del Producto</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                <Input
                  placeholder="Color"
                  value={currentVariant.color}
                  onChange={(e) => setCurrentVariant({...currentVariant, color: e.target.value})}
                />
                <Input
                  placeholder="Talla"
                  value={currentVariant.size}
                  onChange={(e) => setCurrentVariant({...currentVariant, size: e.target.value})}
                />
                <Input
                  placeholder="Stock"
                  type="number"
                  value={currentVariant.stock}
                  onChange={(e) => setCurrentVariant({...currentVariant, stock: parseInt(e.target.value)})}
                />
                <Button type="button" onClick={addVariant}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {variants.map((variant, index) => (
                  <div
                    key={`${variant.color}-${variant.size}-${variant.stock}-${variant.image || ''}`}
                    className="flex items-center gap-2 p-2 border rounded"
                  >
                    <span>{variant.color}</span>
                    <span>-</span>
                    <span>{variant.size}</span>
                    <span>-</span>
                    <span>Stock: {variant.stock}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeVariant(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creando producto...' : 'Crear Producto'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
