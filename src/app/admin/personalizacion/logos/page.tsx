'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageIcon, UploadIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  getBrandingSettings,
  saveBrandingSettings,
  uploadPersonalizationImage,
  type BrandingSettings
} from '@/services/personalization.service';

export default function LogosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandingData, setBrandingData] = useState<BrandingSettings>({
    main_logo: '',
    favicon: '',
    footer_logo: '',
    email_logo: '',
    brand_name: 'StyleHub',
    tagline: 'Tu estilo, nuestra pasión',
    description: 'Descubre las últimas tendencias en moda y estilo'
  });

  useEffect(() => {
    loadBrandingSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBrandingSettings = async () => {
    try {
      const data = await getBrandingSettings();
      if (data) {
        setBrandingData(data);
      }
    } catch (error) {
      console.error('Error loading branding settings:', error);
      toast.error('Error al cargar la configuración de marca');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (logoType: keyof BrandingSettings, file: File) => {
    if (!['main_logo', 'favicon', 'footer_logo', 'email_logo'].includes(logoType as string)) {
      return;
    }
    setLoading(true);
    try {
      const imageUrl = await uploadPersonalizationImage(file, logoType as string);
      if (imageUrl) {
        setBrandingData(prev => ({
          ...prev,
          [logoType]: imageUrl
        }));
        toast.success(`${logoType.replace('_', ' ')} actualizado correctamente`);
      } else {
        throw new Error('No se pudo subir la imagen');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (logoType: keyof BrandingSettings, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede ser mayor a 5MB');
        return;
      }
      handleLogoUpload(logoType, file);
    }
  };

  const handleRemoveLogo = (logoType: keyof BrandingSettings) => {
    setBrandingData(prev => ({
      ...prev,
      [logoType]: ''
    }));
    toast.success(`${logoType.replace('_', ' ')} eliminado`);
  };

  const handleInputChange = (field: keyof BrandingSettings, value: string) => {
    setBrandingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBrandingSettings({
        main_logo: brandingData.main_logo,
        favicon: brandingData.favicon,
        footer_logo: brandingData.footer_logo,
        email_logo: brandingData.email_logo,
        brand_name: brandingData.brand_name,
        tagline: brandingData.tagline,
        description: brandingData.description
      });
      toast.success('Configuración de marca guardada correctamente');
    } catch (error) {
      console.error('Error saving branding settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const logoConfigs = [
    {
      key: 'main_logo' as keyof BrandingSettings,
      title: 'Logo Principal',
      description: 'Logo principal del sitio web (recomendado: 200x60px)',
      placeholder: '/logo-main.png'
    },
    {
      key: 'favicon' as keyof BrandingSettings,
      title: 'Favicon',
      description: 'Icono que aparece en la pestaña del navegador (16x16px)',
      placeholder: '/favicon.ico'
    },
    {
      key: 'footer_logo' as keyof BrandingSettings,
      title: 'Logo del Footer',
      description: 'Logo que aparece en el pie de página (150x50px)',
      placeholder: '/logo-footer.png'
    },
    {
      key: 'email_logo' as keyof BrandingSettings,
      title: 'Logo para Emails',
      description: 'Logo usado en las plantillas de correo (180x60px)',
      placeholder: '/logo-email.png'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Logos y Branding</h1>
        <p className="text-gray-600">Gestiona los logos y la identidad visual de tu marca</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon size={20} />
            Gestión de Logos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {logoConfigs.map((config) => (
              <div key={config.key} className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">{config.title}</Label>
                  <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {brandingData[config.key] ? (
                    <div className="relative">
                      <img
                        src={brandingData[config.key]}
                        alt={config.title}
                        className="max-w-full max-h-32 mx-auto object-contain"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveLogo(config.key)}
                      >
                        <TrashIcon size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No hay imagen</p>
                      <Input
                        id={`file-${config.key}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(config.key, e)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById(`file-${config.key}`)?.click()}
                        className="flex items-center gap-2"
                      >
                        <UploadIcon size={14} />
                        Subir Imagen
                      </Button>
                    </div>
                  )}
                </div>
                {brandingData[config.key] && (
                  <div className="flex gap-2">
                    <Input
                      id={`file-${config.key}-replace`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(config.key, e)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById(`file-${config.key}-replace`)?.click()}
                      className="flex items-center gap-2 flex-1"
                    >
                      <UploadIcon size={14} />
                      Cambiar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveLogo(config.key)}
                    >
                      <TrashIcon size={14} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de Marca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="brand-name">Nombre de la Marca</Label>
              <Input
                id="brand-name"
                value={brandingData.brand_name}
                onChange={(e) => handleInputChange('brand_name', e.target.value)}
                placeholder="StyleHub"
              />
            </div>
            <div>
              <Label htmlFor="tagline">Eslogan</Label>
              <Input
                id="tagline"
                value={brandingData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="Tu estilo, nuestra pasión"
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={brandingData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descubre las últimas tendencias en moda y estilo"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista Previa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3">Header del Sitio</h4>
              <div className="flex items-center justify-between bg-white p-4 border rounded">
                <div className="flex items-center gap-3">
                  {brandingData.main_logo ? (
                    <img src={brandingData.main_logo} alt="Logo" className="h-8 object-contain" />
                  ) : (
                    <div className="h-8 w-20 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">Logo</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{brandingData.brand_name}</h3>
                    <p className="text-sm text-gray-600">{brandingData.tagline}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3">Footer del Sitio</h4>
              <div className="bg-gray-800 text-white p-4 rounded">
                <div className="flex items-start justify-between">
                  <div>
                    {brandingData.footer_logo ? (
                      <img src={brandingData.footer_logo} alt="Footer Logo" className="h-6 object-contain mb-2" />
                    ) : (
                      <div className="h-6 w-16 bg-gray-600 rounded mb-2 flex items-center justify-center">
                        <span className="text-xs">Logo</span>
                      </div>
                    )}
                    <h4 className="font-semibold">{brandingData.brand_name}</h4>
                    <p className="text-sm text-gray-300 mt-1">{brandingData.description}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3">Plantilla de Email</h4>
              <div className="bg-white border rounded p-4">
                <div className="text-center mb-4">
                  {brandingData.email_logo ? (
                    <img src={brandingData.email_logo} alt="Email Logo" className="h-8 object-contain mx-auto" />
                  ) : (
                    <div className="h-8 w-20 bg-gray-200 rounded mx-auto flex items-center justify-center">
                      <span className="text-xs text-gray-500">Logo</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-center">{brandingData.brand_name}</h3>
                <p className="text-sm text-gray-600 text-center mt-1">{brandingData.tagline}</p>
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm">Contenido del email...</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}
