'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Truck,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { ShippingMethod } from '@/types';
import * as shippingService from '@/services/shipping.service';
import { formatPriceSimple } from '@/utils/currency';

export default function ShippingMethodsPage() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost: 0,
    delivery_time: '',
    free_shipping_threshold: 0,
    active: true
  });

  useEffect(() => {
    loadShippingMethods();
  }, []);

  const loadShippingMethods = async () => {
    try {
      setLoading(true);
      const methods = await shippingService.getAllShippingMethods();
      setShippingMethods(methods);
    } catch (error) {
      console.error('Error loading shipping methods:', error);
      toast.error('Error al cargar métodos de envío');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (method?: ShippingMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        description: method.description || '',
        cost: method.cost,
        delivery_time: method.delivery_time || '',
        free_shipping_threshold: method.free_shipping_threshold || 0,
        active: method.active
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        description: '',
        cost: 0,
        delivery_time: '',
        free_shipping_threshold: 0,
        active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMethod(null);
    setFormData({
      name: '',
      description: '',
      cost: 0,
      delivery_time: '',
      free_shipping_threshold: 0,
      active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMethod) {
        // Actualizar método existente
        await shippingService.updateShippingMethod(editingMethod.id, formData);
        toast.success('Método de envío actualizado correctamente');
      } else {
        // Crear nuevo método
        await shippingService.createShippingMethod(formData);
        toast.success('Método de envío creado correctamente');
      }
      
      handleCloseDialog();
      loadShippingMethods();
    } catch (error) {
      console.error('Error saving shipping method:', error);
      toast.error('Error al guardar método de envío');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este método de envío?')) {
      return;
    }

    try {
      await shippingService.deleteShippingMethod(id);
      toast.success('Método de envío eliminado correctamente');
      loadShippingMethods();
    } catch (error) {
      console.error('Error deleting shipping method:', error);
      toast.error('Error al eliminar método de envío');
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await shippingService.updateShippingMethod(id, { active });
      toast.success(`Método de envío ${active ? 'activado' : 'desactivado'} correctamente`);
      loadShippingMethods();
    } catch (error) {
      console.error('Error updating shipping method status:', error);
      toast.error('Error al actualizar estado del método de envío');
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Métodos de Envío</h1>
          <p className="text-gray-600">Configura los métodos de envío disponibles para tus clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Método
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? 'Editar Método de Envío' : 'Nuevo Método de Envío'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Método</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Envío Express"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del método de envío"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Costo (USD)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Ejemplo: $5.50, $12.99, $25.00
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_time">Tiempo de Entrega</Label>
                  <Input
                    id="delivery_time"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                    placeholder="Ej: 2-3 días hábiles"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="free_shipping_threshold">Umbral para Envío Gratis (USD)</Label>
                <Input
                  id="free_shipping_threshold"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.free_shipping_threshold}
                  onChange={(e) => setFormData({ ...formData, free_shipping_threshold: Number(e.target.value) })}
                  placeholder="0 = Sin envío gratis"
                />
                <p className="text-xs text-gray-500">
                  Si el total del pedido supera este monto, el envío será gratuito. Ejemplo: $50.00 = envío gratis sobre $50. Deja en 0 para desactivar.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Método activo</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingMethod ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de métodos de envío */}
      <div className="grid gap-4">
        {shippingMethods.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay métodos de envío</h3>
              <p className="text-gray-600 text-center mb-4">
                Crea tu primer método de envío para que los clientes puedan seleccionar opciones de entrega.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Método
              </Button>
            </CardContent>
          </Card>
        ) : (
          shippingMethods.map((method) => (
            <Card key={method.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{method.name}</h3>
                      <Badge variant={method.active ? 'default' : 'secondary'}>
                        {method.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    
                    {method.description && (
                      <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">Costo:</span>
                        <span className="text-gray-600">
                          {method.cost === 0 ? 'Gratis' : formatPriceSimple(method.cost)}
                        </span>
                      </div>
                      
                      {method.delivery_time && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{method.delivery_time}</span>
                        </div>
                      )}
                      
                      {method.free_shipping_threshold && method.free_shipping_threshold > 0 && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            Gratis desde {formatPriceSimple(method.free_shipping_threshold)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Switch
                      checked={method.active}
                      onCheckedChange={(checked) => handleToggleActive(method.id, checked)}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(method)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Estadísticas */}
      {shippingMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Métodos de Envío</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{shippingMethods.length}</div>
                <div className="text-sm text-gray-600">Total Métodos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {shippingMethods.filter(m => m.active).length}
                </div>
                <div className="text-sm text-gray-600">Métodos Activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {shippingMethods.filter(m => m.cost === 0).length}
                </div>
                <div className="text-sm text-gray-600">Métodos Gratuitos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {shippingMethods.filter(m => m.free_shipping_threshold && m.free_shipping_threshold > 0).length}
                </div>
                <div className="text-sm text-gray-600">Con Envío Gratis</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
