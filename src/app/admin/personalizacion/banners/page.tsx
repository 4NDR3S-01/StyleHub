'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageIcon, PlusIcon, EditIcon, TrashIcon, UploadIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  getBanners,
  saveBanner,
  updateBanner,
  deleteBanner,
  uploadPersonalizationImage,
  type Banner
} from '@/services/personalization.service';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState<Partial<Banner>>({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    link: '',
    button_text: '',
    position: 'hero',
    active: true,
    start_date: '',
    end_date: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error loading banners:', error);
      toast.error('Error al cargar los banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.title?.trim()) {
      toast.error('El título es requerido');
      return;
    }

    if (!bannerForm.image && !imageFile) {
      toast.error('La imagen es requerida');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = bannerForm.image || '';

      if (imageFile) {
        const uploadedUrl = await uploadPersonalizationImage(imageFile, 'banners');
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          throw new Error('Error al subir la imagen');
        }
      }

      const bannerData: Omit<Banner, 'id' | 'created_at' | 'updated_at'> = {
        title: bannerForm.title!,
        subtitle: bannerForm.subtitle || '',
        description: bannerForm.description || '',
        image: imageUrl,
        link: bannerForm.link || '',
        button_text: bannerForm.button_text || '',
        position: bannerForm.position as 'hero' | 'top' | 'middle' | 'bottom',
        active: bannerForm.active || true,
        start_date: bannerForm.start_date || undefined,
        end_date: bannerForm.end_date || undefined
      };

      if (editingBanner) {
        await updateBanner(editingBanner.id!, bannerData);
        toast.success('Banner actualizado correctamente');
      } else {
        await saveBanner(bannerData);
        toast.success('Banner creado correctamente');
      }

      await loadBanners();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Error al guardar el banner');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBanner = async (banner: Banner) => {
    if (confirm(`¿Estás seguro de eliminar el banner "${banner.title}"?`)) {
      setLoading(true);
      try {
        await deleteBanner(banner.id!);
        await loadBanners();
        toast.success('Banner eliminado correctamente');
      } catch (error) {
        console.error('Error deleting banner:', error);
        toast.error('Error al eliminar el banner');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      image: banner.image,
      link: banner.link,
      button_text: banner.button_text,
      position: banner.position,
      active: banner.active,
      start_date: banner.start_date?.split('T')[0] || '',
      end_date: banner.end_date?.split('T')[0] || ''
    });
    setImagePreview(banner.image);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setBannerForm({
      title: '',
      subtitle: '',
      description: '',
      image: '',
      link: '',
      button_text: '',
      position: 'hero',
      active: true,
      start_date: '',
      end_date: ''
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('La imagen no puede ser mayor a 10MB');
        return;
      }

      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const getPositionLabel = (position: string) => {
    const labels = {
      hero: 'Hero Principal',
      top: 'Parte Superior',
      middle: 'Parte Media',
      bottom: 'Parte Inferior'
    };
    return labels[position as keyof typeof labels] || position;
  };

  const getStatusBadge = (banner: Banner) => {
    const now = new Date();
    const startDate = banner.start_date ? new Date(banner.start_date) : null;
    const endDate = banner.end_date ? new Date(banner.end_date) : null;

    if (!banner.active) {
      return <Badge variant="destructive">Inactivo</Badge>;
    }

    if (startDate && now < startDate) {
      return <Badge variant="secondary">Programado</Badge>;
    }

    if (endDate && now > endDate) {
      return <Badge variant="outline">Expirado</Badge>;
    }

    return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>;
  };

  if (loading && banners.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners y Promociones</h1>
          <p className="text-gray-600">Gestiona los banners promocionales de tu tienda</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <PlusIcon size={16} />
          Crear Banner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon size={20} />
            Banners Actuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay banners creados. Crea tu primer banner promocional.
            </p>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-24 object-cover rounded"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-lg">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="text-sm text-gray-600 mt-1">{banner.subtitle}</p>
                      )}
                      {banner.description && (
                        <p className="text-xs text-gray-500 mt-2">{banner.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(banner)}
                        <Badge variant="outline">{getPositionLabel(banner.position)}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditBanner(banner)}
                      >
                        <EditIcon size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteBanner(banner)}
                      >
                        <TrashIcon size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Editar Banner' : 'Crear Nuevo Banner'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nueva Colección Primavera"
                />
              </div>

              <div>
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Hasta 50% de descuento"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={bannerForm.description}
                onChange={(e) => setBannerForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descubre las últimas tendencias de la temporada"
                rows={2}
              />
            </div>

            <div>
              <Label>Imagen del Banner *</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setBannerForm(prev => ({ ...prev, image: '' }));
                      }}
                    >
                      <TrashIcon size={14} />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Arrastra una imagen o haz clic para seleccionar</p>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="flex items-center gap-2"
                    >
                      <UploadIcon size={16} />
                      Seleccionar Imagen
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="link">Enlace (URL)</Label>
                <Input
                  id="link"
                  value={bannerForm.link}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="/category/new-collection"
                />
              </div>

              <div>
                <Label htmlFor="button_text">Texto del Botón</Label>
                <Input
                  id="button_text"
                  value={bannerForm.button_text}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, button_text: e.target.value }))}
                  placeholder="Ver Colección"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="position">Posición</Label>
                <Select
                  value={bannerForm.position}
                  onValueChange={(value) => setBannerForm(prev => ({ ...prev, position: value as Banner['position'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar posición" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero Principal</SelectItem>
                    <SelectItem value="top">Parte Superior</SelectItem>
                    <SelectItem value="middle">Parte Media</SelectItem>
                    <SelectItem value="bottom">Parte Inferior</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start_date">Fecha de Inicio</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={bannerForm.start_date}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="end_date">Fecha de Fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={bannerForm.end_date}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={bannerForm.active}
                onCheckedChange={(checked) => setBannerForm(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active">Banner activo</Label>
            </div>

            {imagePreview && (
              <div>
                <Label>Vista Previa</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <div className="text-center text-white p-4">
                        <h3 className="text-2xl font-bold mb-2">{bannerForm.title || 'Título del Banner'}</h3>
                        {bannerForm.subtitle && (
                          <p className="text-lg mb-2">{bannerForm.subtitle}</p>
                        )}
                        {bannerForm.description && (
                          <p className="text-sm opacity-90 mb-4">{bannerForm.description}</p>
                        )}
                        {bannerForm.button_text && (
                          <button className="px-6 py-2 bg-red-600 text-white rounded font-medium">
                            {bannerForm.button_text}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBanner} disabled={loading}>
              {editingBanner ? 'Actualizar' : 'Crear'} Banner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
