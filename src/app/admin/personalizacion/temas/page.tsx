'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaletteIcon, CheckIcon, EditIcon, TrashIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getThemes, 
  getActiveTheme, 
  saveTheme, 
  updateTheme, 
  activateTheme, 
  deleteTheme,
  type ThemeSettings,
  type ThemeColors 
} from '@/services/personalization.service';

export default function TemasPage() {
  const [themes, setThemes] = useState<ThemeSettings[]>([]);
  const [activeTheme, setActiveTheme] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeSettings | null>(null);
  const [customTheme, setCustomTheme] = useState<{
    name: string;
    colors: ThemeColors;
  }>({
    name: '',
    colors: {
      primary: '#dc2626',
      secondary: '#f59e0b',
      accent: '#10b981',
      neutral: '#6b7280',
      background: '#ffffff',
      text: '#111827'
    }
  });

  // Función para obtener el label del color
  const getColorLabel = (key: string): string => {
    const labels: Record<string, string> = {
      primary: 'Primario',
      secondary: 'Secundario',
      accent: 'Acento',
      neutral: 'Neutral',
      background: 'Fondo',
      text: 'Texto'
    };
    return labels[key] || key;
  };

  const predefinedThemes = [
    {
      id: 'default',
      name: 'StyleHub Clásico',
      colors: {
        primary: '#dc2626',
        secondary: '#f59e0b',
        accent: '#10b981',
        neutral: '#6b7280',
        background: '#ffffff',
        text: '#111827'
      }
    },
    {
      id: 'dark',
      name: 'Elegante Oscuro',
      colors: {
        primary: '#ef4444',
        secondary: '#f59e0b',
        accent: '#06b6d4',
        neutral: '#374151',
        background: '#1f2937',
        text: '#f9fafb'
      }
    },
    {
      id: 'modern',
      name: 'Moderno Azul',
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        neutral: '#64748b',
        background: '#ffffff',
        text: '#0f172a'
      }
    },
    {
      id: 'nature',
      name: 'Verde Natural',
      colors: {
        primary: '#059669',
        secondary: '#d97706',
        accent: '#7c3aed',
        neutral: '#6b7280',
        background: '#f9fafb',
        text: '#065f46'
      }
    }
  ];

  useEffect(() => {
    loadThemes();
    loadActiveTheme();
  }, []);

  const loadThemes = async () => {
    try {
      const data = await getThemes();
      setThemes(data);
    } catch (error) {
      console.error('Error loading themes:', error);
      toast.error('Error al cargar los temas');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveTheme = async () => {
    try {
      const data = await getActiveTheme();
      setActiveTheme(data);
    } catch (error) {
      console.error('Error loading active theme:', error);
    }
  };

  const handleSaveTheme = async () => {
    if (!customTheme.name.trim()) {
      toast.error('Por favor ingresa un nombre para el tema');
      return;
    }

    setLoading(true);
    try {
      if (editingTheme) {
        await updateTheme(editingTheme.id!, {
          name: customTheme.name,
          colors: customTheme.colors
        });
        toast.success('Tema actualizado correctamente');
      } else {
        await saveTheme({
          name: customTheme.name,
          colors: customTheme.colors,
          is_active: false,
          is_default: false
        });
        toast.success('Tema guardado correctamente');
      }
      
      await loadThemes();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('Error al guardar el tema');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTheme = async (theme: ThemeSettings) => {
    setLoading(true);
    try {
      await activateTheme(theme.id!);
      await loadActiveTheme();
      await loadThemes();
      toast.success(`Tema "${theme.name}" aplicado correctamente`);
      
      // Aplicar tema al documento
      applyThemeToDocument(theme.colors);
    } catch (error) {
      console.error('Error activating theme:', error);
      toast.error('Error al aplicar el tema');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTheme = async (theme: ThemeSettings) => {
    if (theme.is_active) {
      toast.error('No puedes eliminar el tema activo');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el tema "${theme.name}"?`)) {
      setLoading(true);
      try {
        await deleteTheme(theme.id!);
        await loadThemes();
        toast.success('Tema eliminado correctamente');
      } catch (error) {
        console.error('Error deleting theme:', error);
        toast.error('Error al eliminar el tema');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditTheme = (theme: ThemeSettings) => {
    setEditingTheme(theme);
    setCustomTheme({
      name: theme.name,
      colors: theme.colors
    });
    setIsModalOpen(true);
  };

  const handleApplyPredefinedTheme = async (predefinedTheme: any) => {
    try {
      const existingTheme = themes.find(t => t.name === predefinedTheme.name);
      if (existingTheme) {
        await handleActivateTheme(existingTheme);
      } else {
        const newTheme = await saveTheme({
          name: predefinedTheme.name,
          colors: predefinedTheme.colors,
          is_active: true,
          is_default: false
        });
        await handleActivateTheme(newTheme);
      }
    } catch (error) {
      console.error('Error applying predefined theme:', error);
      toast.error('Error al aplicar el tema');
    }
  };

  const resetForm = () => {
    setEditingTheme(null);
    setCustomTheme({
      name: '',
      colors: {
        primary: '#dc2626',
        secondary: '#f59e0b',
        accent: '#10b981',
        neutral: '#6b7280',
        background: '#ffffff',
        text: '#111827'
      }
    });
  };

  const applyThemeToDocument = (colors: ThemeColors) => {
    const root = document.documentElement;
    
    // Convertir hex a HSL para compatibilidad con Tailwind CSS variables
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // Aplicar colores como variables CSS
    root.style.setProperty('--primary', hexToHsl(colors.primary));
    root.style.setProperty('--secondary', hexToHsl(colors.secondary));
    root.style.setProperty('--accent', hexToHsl(colors.accent));
    root.style.setProperty('--background', hexToHsl(colors.background));
    root.style.setProperty('--foreground', hexToHsl(colors.text));
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  if (loading && themes.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Temas</h1>
          <p className="text-gray-600">Personaliza los colores y la apariencia de tu tienda</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <PlusIcon size={16} />
          Crear Tema Personalizado
        </Button>
      </div>

      {/* Tema Activo */}
      {activeTheme && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckIcon size={20} className="text-green-600" />
              Tema Activo: {activeTheme.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-4">
              {Object.entries(activeTheme.colors).map(([key, color]) => (
                <div key={key} className="text-center">
                  <div 
                    className="w-16 h-16 rounded-lg mx-auto mb-2 border-2 border-gray-200"
                    style={{ backgroundColor: color }}
                  ></div>
                  <p className="text-sm font-medium capitalize">{key}</p>
                  <p className="text-xs text-gray-500">{color}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Temas Predefinidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaletteIcon size={20} />
            Temas Predefinidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {predefinedThemes.map((theme) => (
              <div key={theme.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{theme.name}</h3>
                  {activeTheme?.name === theme.name && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Activo
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {Object.entries(theme.colors).map(([key, color]) => (
                    <div key={key} className="text-center">
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: color }}
                        title={`${key}: ${color}`}
                      ></div>
                    </div>
                  ))}
                </div>
                <Button 
                  size="sm" 
                  className="w-full"
                  variant={activeTheme?.name === theme.name ? "secondary" : "default"}
                  onClick={() => handleApplyPredefinedTheme(theme)}
                  disabled={loading}
                >
                  {activeTheme?.name === theme.name ? 'Activo' : 'Aplicar'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Temas Personalizados */}
      <Card>
        <CardHeader>
          <CardTitle>Temas Personalizados</CardTitle>
        </CardHeader>
        <CardContent>
          {themes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay temas personalizados. Crea tu primer tema personalizado.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {themes.map((theme) => (
                <div key={theme.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{theme.name}</h3>
                    <div className="flex items-center gap-2">
                      {theme.is_active && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Activo
                        </Badge>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditTheme(theme)}
                      >
                        <EditIcon size={14} />
                      </Button>
                      {!theme.is_active && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeleteTheme(theme)}
                        >
                          <TrashIcon size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-2 mb-3">
                    {Object.entries(theme.colors).map(([key, color]) => (
                      <div key={key} className="text-center">
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: color }}
                          title={`${key}: ${color}`}
                        ></div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    variant={theme.is_active ? "secondary" : "default"}
                    onClick={() => handleActivateTheme(theme)}
                    disabled={loading || theme.is_active}
                  >
                    {theme.is_active ? 'Activo' : 'Aplicar'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear/editar tema */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTheme ? 'Editar Tema' : 'Crear Tema Personalizado'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Nombre del tema */}
            <div>
              <Label htmlFor="theme-name">Nombre del Tema</Label>
              <Input
                id="theme-name"
                value={customTheme.name}
                onChange={(e) => setCustomTheme(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Mi tema personalizado"
              />
            </div>

            {/* Editor de colores */}
            <div>
              <Label>Colores del Tema</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {Object.entries(customTheme.colors).map(([key, color]) => (
                  <div key={key}>
                    <Label htmlFor={`color-${key}`} className="capitalize">
                      {getColorLabel(key)}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id={`color-${key}`}
                        type="color"
                        value={color}
                        onChange={(e) => setCustomTheme(prev => ({
                          ...prev,
                          colors: { ...prev.colors, [key]: e.target.value }
                        }))}
                        className="w-12 h-10 p-1 rounded border"
                      />
                      <Input
                        value={color}
                        onChange={(e) => setCustomTheme(prev => ({
                          ...prev,
                          colors: { ...prev.colors, [key]: e.target.value }
                        }))}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vista previa */}
            <div>
              <Label>Vista Previa</Label>
              <div 
                className="border rounded-lg p-4 mt-2"
                style={{ backgroundColor: customTheme.colors.background, color: customTheme.colors.text }}
              >
                <div className="space-y-3">
                  <h3 style={{ color: customTheme.colors.primary }} className="text-lg font-semibold">
                    Título Principal
                  </h3>
                  <div className="flex space-x-2">
                    <button 
                      className="px-4 py-2 rounded font-medium"
                      style={{ 
                        backgroundColor: customTheme.colors.primary, 
                        color: customTheme.colors.background 
                      }}
                    >
                      Botón Primario
                    </button>
                    <button 
                      className="px-4 py-2 rounded border font-medium"
                      style={{ 
                        borderColor: customTheme.colors.secondary, 
                        color: customTheme.colors.secondary 
                      }}
                    >
                      Botón Secundario
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <span 
                      className="px-2 py-1 rounded text-sm font-medium"
                      style={{ backgroundColor: customTheme.colors.accent, color: customTheme.colors.background }}
                    >
                      Badge Acento
                    </span>
                    <span 
                      className="px-2 py-1 rounded border text-sm"
                      style={{ borderColor: customTheme.colors.neutral, color: customTheme.colors.neutral }}
                    >
                      Badge Neutral
                    </span>
                  </div>
                  <p style={{ color: customTheme.colors.text }}>
                    Este es un ejemplo de cómo se verá el texto con los colores seleccionados.
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTheme} disabled={loading}>
                {editingTheme ? 'Actualizar' : 'Guardar'} Tema
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
