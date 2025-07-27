'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, X, Upload } from 'lucide-react';
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
  sizes?: string[];
  colors?: string[];
  stock: number;
  rating?: number;
  reviews?: number;
  featured: boolean;
  sale: boolean;
}

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    category_id: '',
    sizes: [] as string[],
    colors: [] as string[],
    stock: '',
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

  const handleArrayChange = (field: 'sizes' | 'colors', value: string) => {
    const values = value.split(',').map(v => v.trim()).filter(v => v);
    setFormData(prev => ({ ...prev, [field]: values }));
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

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file);

      if (uploadError) {
        alert('Error al subir la imagen: ' + uploadError.message);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('productos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      alert('Error al subir la imagen: ' + (error?.message || 'Error desconocido'));
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.name.trim()) {
      alert('El nombre del producto es requerido');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }
    
    if (!formData.stock || parseInt(formData.stock) < 0) {
      alert('El stock no puede ser negativo');
      return;
    }

    setSubmitting(true);
    
    try {
      let imageUrl = null;
      
      // Subir imagen a Supabase Storage si hay una seleccionada
      if (selectedImage) {
        imageUrl = await uploadImageToSupabase(selectedImage);
        if (!imageUrl) {
          alert('Error al subir la imagen');
          return;
        }
      }

      // Preparar datos para insertar
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        images: imageUrl ? [imageUrl] : null,
        category_id: formData.category_id || null,
        sizes: formData.sizes.length > 0 ? formData.sizes : null,
        colors: formData.colors.length > 0 ? formData.colors : null,
        stock: parseInt(formData.stock),
        featured: formData.featured,
        sale: formData.sale
      };

      // Insertar producto en la base de datos
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) {
        alert('Error al guardar el producto: ' + error.message);
        return;
      }

      alert('Producto guardado exitosamente!');
      setIsModalOpen(false);
      
      // Resetear formulario
      setFormData({
        name: '',
        description: '',
        price: '',
        original_price: '',
        category_id: '',
        sizes: [],
        colors: [],
        stock: '',
        featured: false,
        sale: false
      });
      setSelectedImage(null);
      setImagePreview(null);
      
      // Recargar productos
      fetchProducts();
      
    } catch (error: any) {
      alert('Error al guardar el producto: ' + (error?.message || 'Error desconocido'));
    } finally {
      setSubmitting(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, original_price, images, stock, featured, sale');
    if (!error && data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Añadir Producto
        </Button>
      </div>

      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Imagen</th>
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
                <td className="p-2">{prod.stock}</td>
                <td className="p-2">{prod.featured ? 'Sí' : 'No'}</td>
                <td className="p-2">{prod.sale ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Añadir Nuevo Producto
              <button
                onClick={() => setIsModalOpen(false)}
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
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="category_id">Categoría *</Label>
              <Select onValueChange={handleSelectChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Hombres</SelectItem>
                  <SelectItem value="women">Mujeres</SelectItem>
                  <SelectItem value="accessories">Accesorios</SelectItem>
                  <SelectItem value="shoes">Zapatos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sizes">Tallas (separadas por comas)</Label>
                <Input
                  id="sizes"
                  name="sizes"
                  value={formData.sizes.join(', ')}
                  onChange={(e) => handleArrayChange('sizes', e.target.value)}
                  placeholder="XS, S, M, L, XL"
                />
              </div>
              
              <div>
                <Label htmlFor="colors">Colores (separados por comas)</Label>
                <Input
                  id="colors"
                  name="colors"
                  value={formData.colors.join(', ')}
                  onChange={(e) => handleArrayChange('colors', e.target.value)}
                  placeholder="Rojo, Azul, Negro"
                />
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
                {submitting ? 'Guardando...' : 'Guardar Producto'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
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