'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  PaletteIcon, 
  ImageIcon, 
  SettingsIcon, 
  LinkIcon,
  ShareIcon,
  MonitorIcon,
  Truck
} from 'lucide-react';
import { usePersonalizationContext } from '@/context/PersonalizationContext';

interface PersonalizationOverviewProps {
  readonly onNavigate?: (section: string) => void;
}

export default function PersonalizationOverview({ onNavigate }: PersonalizationOverviewProps) {
  const { theme, branding, footer, footerLinks, socialMedia, banners, loading, refreshData } = usePersonalizationContext();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      refreshData();
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error refreshing personalization data:', error);
      toast.error('Error al actualizar los datos');
    } finally {
      setRefreshing(false);
    }
  };

  const sections = [
    {
      id: 'temas',
      title: 'Temas y Colores',
      description: 'Personaliza los colores y el estilo visual',
      icon: PaletteIcon,
      status: theme ? 'Configurado' : 'No configurado',
      statusColor: theme ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
      data: theme ? `Tema activo: ${theme.name}` : 'Sin tema activo'
    },
    {
      id: 'logos',
      title: 'Logos y Branding',
      description: 'Gestiona logos, nombre de marca y taglines',
      icon: ImageIcon,
      status: branding ? 'Configurado' : 'No configurado',
      statusColor: branding ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
      data: branding ? `Marca: ${branding.brand_name}` : 'Sin configuración de marca'
    },
    {
      id: 'banners',
      title: 'Banners Promocionales',
      description: 'Administra banners y promociones destacadas',
      icon: MonitorIcon,
      status: banners.length > 0 ? 'Configurado' : 'No configurado',
      statusColor: banners.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
      data: `${banners.length} banner(s) activo(s)`
    },
    {
      id: 'metodos-envio',
      title: 'Métodos de Envío',
      description: 'Configura opciones de envío y tarifas',
      icon: Truck,
      status: 'Disponible',
      statusColor: 'bg-blue-100 text-blue-800',
      data: 'Gestionar métodos de envío'
    },
    {
      id: 'footer',
      title: 'Footer y Enlaces',
      description: 'Configura el pie de página y enlaces importantes',
      icon: LinkIcon,
      status: footer || footerLinks.length > 0 ? 'Configurado' : 'No configurado',
      statusColor: footer || footerLinks.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
      data: `${footerLinks.length} enlace(s) configurado(s)`
    },
    {
      id: 'social',
      title: 'Redes Sociales',
      description: 'Gestiona enlaces a redes sociales',
      icon: ShareIcon,
      status: socialMedia.length > 0 ? 'Configurado' : 'No configurado',
      statusColor: socialMedia.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
      data: `${socialMedia.length} red(es) social(es) configurada(s)`
    },
    {
      id: 'configuracion',
      title: 'Configuración General',
      description: 'Ajustes generales del sistema',
      icon: SettingsIcon,
      status: 'Disponible',
      statusColor: 'bg-blue-100 text-blue-800',
      data: 'Configuraciones del sistema'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personalización</h1>
          <p className="text-gray-600">Gestiona la apariencia y configuración de tu tienda</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card 
              key={section.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onNavigate?.(section.id)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {section.title}
                </CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {section.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className={section.statusColor}>
                      {section.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {section.data}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumen del estado */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{theme ? '1' : '0'}</div>
              <div className="text-sm text-gray-600">Tema Activo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{banners.length}</div>
              <div className="text-sm text-gray-600">Banners Activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{footerLinks.length}</div>
              <div className="text-sm text-gray-600">Enlaces Footer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{socialMedia.length}</div>
              <div className="text-sm text-gray-600">Redes Sociales</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
