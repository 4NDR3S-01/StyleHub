'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getUserAddresses, 
  createAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress,
  validateAddress,
  formatAddress,
  type Address,
  type CreateAddressData
} from '@/services/address.service';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Badge, 
  Separator 
} from '@/components/ui/badge';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  Home,
  Building,
  User
} from 'lucide-react';
import { toast } from 'sonner';

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<CreateAddressData>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Colombia',
    is_default: false
  });

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getUserAddresses(user.id);
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Error al cargar direcciones');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Colombia',
      is_default: false
    });
    setEditingAddress(null);
  };

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        name: address.name,
        phone: address.phone || '',
        address: address.address,
        city: address.city,
        state: address.state || '',
        zip_code: address.zip_code || '',
        country: address.country,
        is_default: address.is_default
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes iniciar sesión para gestionar direcciones');
      return;
    }

    // Validar datos
    const validation = validateAddress(formData);
    if (!validation.isValid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, user.id, formData);
        toast.success('Dirección actualizada correctamente');
      } else {
        await createAddress(user.id, formData);
        toast.success('Dirección creada correctamente');
      }
      
      handleCloseDialog();
      loadAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Error al guardar dirección');
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!user) return;

    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      return;
    }

    try {
      await deleteAddress(addressId, user.id);
      toast.success('Dirección eliminada correctamente');
      loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Error al eliminar dirección');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;

    try {
      await setDefaultAddress(addressId, user.id);
      toast.success('Dirección establecida como predeterminada');
      loadAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Error al establecer dirección predeterminada');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso requerido</h2>
            <p className="text-gray-600 mb-6">Debes iniciar sesión para gestionar tus direcciones</p>
            <Button onClick={() => window.location.href = '/login'}>
              Iniciar sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 text-lg">Cargando direcciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Direcciones</h1>
          <p className="text-gray-600">Gestiona tus direcciones de envío</p>
        </div>

        {/* Add Address Button */}
        <div className="mb-6">
          <Button 
            onClick={() => handleOpenDialog()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Nueva Dirección
          </Button>
        </div>

        {/* Addresses List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes direcciones</h3>
              <p className="text-gray-600 mb-4">Agrega tu primera dirección de envío</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Dirección
              </Button>
            </div>
          ) : (
            addresses.map((address) => (
              <Card key={address.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{address.name}</CardTitle>
                      {address.is_default && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Star className="h-3 w-3 mr-1" />
                          Predeterminada
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-gray-700">{address.address}</p>
                    <p className="text-gray-600">
                      {address.city}, {address.state} {address.zip_code}
                    </p>
                    <p className="text-gray-600">{address.country}</p>
                    {address.phone && (
                      <p className="text-gray-600">📞 {address.phone}</p>
                    )}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Creada el {new Date(address.created_at).toLocaleDateString()}
                    </span>
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        <StarOff className="h-4 w-4 mr-1" />
                        Establecer como predeterminada
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Address Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Calle 123 #45-67"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Bogotá"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Departamento</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Cundinamarca"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zip_code">Código Postal</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="110111"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Colombia"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_default">Establecer como dirección predeterminada</Label>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingAddress ? 'Actualizar' : 'Crear'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 