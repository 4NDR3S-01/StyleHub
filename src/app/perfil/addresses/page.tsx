'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  getUserAddresses, 
  createAddress, 
  updateAddress, 
  deleteAddress, 
  setDefaultAddress,
  validateAddress,
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
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  Home,
  Building2,
  ShoppingBag,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

// Hook personalizado para gestionar datos de Ecuador
const useEcuadorianData = () => {
  // Datos ecuatorianos
  const ecuadorianProvinces = [
    'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi',
    'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura', 'Loja',
    'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo', 'Orellana', 'Pastaza',
    'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas', 'Sucumbíos',
    'Tungurahua', 'Zamora Chinchipe'
  ];

  // Mapeo de ciudades a provincias
  const cityToProvince: { [key: string]: string } = {
    // Pichincha
    'Quito': 'Pichincha',
    'Sangolquí': 'Pichincha',
    'Cayambe': 'Pichincha',
    'Machachi': 'Pichincha',
    
    // Guayas
    'Guayaquil': 'Guayas',
    'Durán': 'Guayas',
    'Milagro': 'Guayas',
    'Daule': 'Guayas',
    'Samborondón': 'Guayas',
    'Playas': 'Guayas',
    
    // Azuay
    'Cuenca': 'Azuay',
    'Gualaceo': 'Azuay',
    'Paute': 'Azuay',
    
    // Santo Domingo de los Tsáchilas
    'Santo Domingo': 'Santo Domingo de los Tsáchilas',
    
    // El Oro
    'Machala': 'El Oro',
    'Pasaje': 'El Oro',
    'Santa Rosa': 'El Oro',
    'El Guabo': 'El Oro',
    
    // Manabí
    'Manta': 'Manabí',
    'Portoviejo': 'Manabí',
    'Chone': 'Manabí',
    'Bahía de Caráquez': 'Manabí',
    'Jipijapa': 'Manabí',
    
    // Tungurahua
    'Ambato': 'Tungurahua',
    'Baños': 'Tungurahua',
    'Pelileo': 'Tungurahua',
    
    // Chimborazo
    'Riobamba': 'Chimborazo',
    'Alausí': 'Chimborazo',
    'Guano': 'Chimborazo',
    
    // Loja
    'Loja': 'Loja',
    'Catamayo': 'Loja',
    'Macará': 'Loja',
    
    // Esmeraldas
    'Esmeraldas': 'Esmeraldas',
    'Atacames': 'Esmeraldas',
    'Quinindé': 'Esmeraldas',
    
    // Imbabura
    'Ibarra': 'Imbabura',
    'Otavalo': 'Imbabura',
    'Cotacachi': 'Imbabura',
    
    // Santa Elena
    'La Libertad': 'Santa Elena',
    'Salinas': 'Santa Elena',
    'Santa Elena': 'Santa Elena',
    
    // Los Ríos
    'Babahoyo': 'Los Ríos',
    'Quevedo': 'Los Ríos',
    'Ventanas': 'Los Ríos',
    'Vinces': 'Los Ríos',
    
    // Carchi
    'Tulcán': 'Carchi',
    'Huaca': 'Carchi',
    
    // Bolívar
    'Guaranda': 'Bolívar',
    'San Miguel': 'Bolívar',
    
    // Cañar
    'Azogues': 'Cañar',
    'La Troncal': 'Cañar',
    'Cañar': 'Cañar',
    
    // Cotopaxi
    'Latacunga': 'Cotopaxi',
    'La Maná': 'Cotopaxi',
    'Saquisilí': 'Cotopaxi',
    
    // Morona Santiago
    'Macas': 'Morona Santiago',
    'Gualaquiza': 'Morona Santiago',
    
    // Pastaza
    'Puyo': 'Pastaza',
    'Shell': 'Pastaza',
    
    // Sucumbíos
    'Nueva Loja': 'Sucumbíos',
    'Shushufindi': 'Sucumbíos',
    
    // Napo
    'Tena': 'Napo',
    'Archidona': 'Napo',
    
    // Zamora Chinchipe
    'Zamora': 'Zamora Chinchipe',
    'Yantzaza': 'Zamora Chinchipe',
    
    // Orellana
    'Francisco de Orellana': 'Orellana',
    'Coca': 'Orellana',
    
    // Galápagos
    'Puerto Ayora': 'Galápagos',
    'Puerto Baquerizo Moreno': 'Galápagos'
  };

  // Mapeo de provincias a ciudades
  const provinceToCities: { [key: string]: string[] } = {
    'Pichincha': ['Quito', 'Sangolquí', 'Cayambe', 'Machachi'],
    'Guayas': ['Guayaquil', 'Durán', 'Milagro', 'Daule', 'Samborondón', 'Playas'],
    'Azuay': ['Cuenca', 'Gualaceo', 'Paute'],
    'Santo Domingo de los Tsáchilas': ['Santo Domingo'],
    'El Oro': ['Machala', 'Pasaje', 'Santa Rosa', 'El Guabo'],
    'Manabí': ['Manta', 'Portoviejo', 'Chone', 'Bahía de Caráquez', 'Jipijapa'],
    'Tungurahua': ['Ambato', 'Baños', 'Pelileo'],
    'Chimborazo': ['Riobamba', 'Alausí', 'Guano'],
    'Loja': ['Loja', 'Catamayo', 'Macará'],
    'Esmeraldas': ['Esmeraldas', 'Atacames', 'Quinindé'],
    'Imbabura': ['Ibarra', 'Otavalo', 'Cotacachi'],
    'Santa Elena': ['La Libertad', 'Salinas', 'Santa Elena'],
    'Los Ríos': ['Babahoyo', 'Quevedo', 'Ventanas', 'Vinces'],
    'Carchi': ['Tulcán', 'Huaca'],
    'Bolívar': ['Guaranda', 'San Miguel'],
    'Cañar': ['Azogues', 'La Troncal', 'Cañar'],
    'Cotopaxi': ['Latacunga', 'La Maná', 'Saquisilí'],
    'Morona Santiago': ['Macas', 'Gualaquiza'],
    'Pastaza': ['Puyo', 'Shell'],
    'Sucumbíos': ['Nueva Loja', 'Shushufindi'],
    'Napo': ['Tena', 'Archidona'],
    'Zamora Chinchipe': ['Zamora', 'Yantzaza'],
    'Orellana': ['Francisco de Orellana', 'Coca'],
    'Galápagos': ['Puerto Ayora', 'Puerto Baquerizo Moreno']
  };

  // Obtener todas las ciudades disponibles
  const getAllCities = () => {
    return Object.keys(cityToProvince).sort((a, b) => a.localeCompare(b));
  };

  // Obtener ciudades filtradas por provincia
  const getCitiesByProvince = (province: string) => {
    return provinceToCities[province] || [];
  };

  return {
    ecuadorianProvinces,
    cityToProvince,
    provinceToCities,
    getAllCities,
    getCitiesByProvince
  };
};

// Componente para renderizar la información de tipo de dirección
const AddressTypeSelector = ({ 
  addressType, 
  onTypeChange 
}: { 
  addressType: string; 
  onTypeChange: (type: 'home' | 'office' | 'other') => void; 
}) => {
  const addressTypes = [
    { value: 'home', label: 'Casa', icon: Home },
    { value: 'office', label: 'Oficina', icon: Building2 },
    { value: 'other', label: 'Otro', icon: MapPin }
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-gray-700">Tipo de dirección</Label>
      <div className="grid grid-cols-3 gap-3">
        {addressTypes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onTypeChange(value as any)}
            className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
              addressType === value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
            }`}
          >
            <Icon className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Componente para el selector de provincia
const ProvinceSelector = ({
  formData,
  ecuadorianProvinces,
  handleProvinceChange,
  getCitiesByProvince,
  cityToProvince
}: {
  formData: CreateAddressData;
  ecuadorianProvinces: string[];
  handleProvinceChange: (province: string) => void;
  getCitiesByProvince: (province: string) => string[];
  cityToProvince: { [key: string]: string };
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="state" className="text-sm font-semibold text-gray-700">
        Provincia
      </Label>
      <Select value={formData.state} onValueChange={handleProvinceChange}>
        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
          <SelectValue placeholder="Selecciona provincia" />
        </SelectTrigger>
        <SelectContent>
          {ecuadorianProvinces.map((province: string) => (
            <SelectItem key={province} value={province}>{province}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {formData.state && getCitiesByProvince(formData.state).length > 0 && (
        <p className="text-xs text-gray-500">
          {getCitiesByProvince(formData.state).length} ciudades disponibles
        </p>
      )}
      {formData.city && formData.state && cityToProvince[formData.city] && 
       cityToProvince[formData.city] !== formData.state && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-amber-600">⚠️</span>
          <span className="text-amber-600">
            {formData.city} pertenece a {cityToProvince[formData.city]}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleProvinceChange(cityToProvince[formData.city])}
            className="h-5 px-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Corregir
          </Button>
        </div>
      )}
    </div>
  );
};

// Componente para el selector de ciudad
const CitySelector = ({
  formData,
  setFormData,
  availableCities,
  showCustomCity,
  setShowCustomCity,
  cityToProvince,
  handleCityChange,
  handleCustomCityChange
}: {
  formData: CreateAddressData;
  setFormData: React.Dispatch<React.SetStateAction<CreateAddressData>>;
  availableCities: string[];
  showCustomCity: boolean;
  setShowCustomCity: React.Dispatch<React.SetStateAction<boolean>>;
  cityToProvince: { [key: string]: string };
  handleCityChange: (city: string) => void;
  handleCustomCityChange: (city: string) => void;
}) => {
  if (showCustomCity) {
    return (
      <>
        <div className="flex gap-2">
          <Input
            value={formData.city}
            onChange={(e) => handleCustomCityChange(e.target.value)}
            placeholder="Escribe tu ciudad"
            className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCustomCity(false);
              setFormData(prev => ({ ...prev, city: '' }));
            }}
            className="px-3"
          >
            ↩️
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Escribiendo ciudad personalizada
        </p>
      </>
    );
  }

  return (
    <>
      <Select value={formData.city} onValueChange={handleCityChange}>
        <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
          <SelectValue placeholder="Selecciona tu ciudad" />
        </SelectTrigger>
        <SelectContent>
          {availableCities.length === 0 ? (
            <SelectItem value="" disabled>
              {formData.state ? 'No hay ciudades registradas para esta provincia' : 'Cargando ciudades...'}
            </SelectItem>
          ) : (
            availableCities.map((city: string) => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))
          )}
          <div className="px-2 py-1">
            <div className="h-px bg-gray-200"></div>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomCity(true)}
            className="w-full px-2 py-1 text-left text-xs text-blue-600 hover:bg-blue-50 rounded"
          >
            ✏️ Escribir otra ciudad
          </button>
        </SelectContent>
      </Select>
      {formData.state && cityToProvince[formData.city] && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-green-600">✅</span>
          <span className="text-gray-600">Ciudad y provincia coinciden</span>
        </div>
      )}
    </>
  );
};

// Hook para manejar la lógica de formulario de direcciones
const useAddressForm = (user: any, addresses: Address[]) => {
  const [formData, setFormData] = useState<CreateAddressData>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Ecuador',
    is_default: false
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: user?.name ? `${user.name} ${user.lastname || ''}`.trim() : '',
      phone: user?.phone || '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Ecuador',
      is_default: addresses.length === 0
    });
  }, [user, addresses.length]);

  return { formData, setFormData, resetForm };
};

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addressType, setAddressType] = useState<'home' | 'office' | 'other'>('home');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showCustomCity, setShowCustomCity] = useState(false);

  const { ecuadorianProvinces, cityToProvince, getAllCities, getCitiesByProvince } = useEcuadorianData();
  const { formData, setFormData, resetForm } = useAddressForm(user, addresses);

  // Manejar cambio de ciudad
  const handleCityChange = (city: string) => {
    setFormData(prev => ({ 
      ...prev, 
      city,
      state: cityToProvince[city] || prev.state
    }));
    setShowCustomCity(false);
  };

  // Manejar entrada manual de ciudad
  const handleCustomCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
  };

  // Manejar cambio de provincia
  const handleProvinceChange = (province: string) => {
    const citiesInProvince = getCitiesByProvince(province);
    setAvailableCities(citiesInProvince);
    
    setFormData(prev => ({ 
      ...prev, 
      state: province,
      city: citiesInProvince.includes(prev.city) ? prev.city : ''
    }));
  };

  // Inicializar ciudades disponibles
  useEffect(() => {
    const cities = formData.state ? getCitiesByProvince(formData.state) : getAllCities();
    setAvailableCities(cities);
  }, [formData.state]);

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
      const cities = address.state ? getCitiesByProvince(address.state) : getAllCities();
      setAvailableCities(cities);
    } else {
      setEditingAddress(null);
      setAddressType('home');
      setAvailableCities(getAllCities());
      setShowCustomCity(false);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAddress(null);
    setAddressType('home');
    setAvailableCities(getAllCities());
    setShowCustomCity(false);
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

    setSubmitting(true);
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, user.id, formData);
        toast.success('✅ Dirección actualizada correctamente');
      } else {
        await createAddress(user.id, formData);
        toast.success('✅ Nueva dirección guardada exitosamente');
      }
      
      handleCloseDialog();
      loadAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('❌ Error al guardar dirección. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!user) return;

    setDeleting(addressId);
    try {
      await deleteAddress(addressId, user.id);
      toast.success('✅ Dirección eliminada correctamente');
      loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('❌ Error al eliminar dirección');
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;

    try {
      await setDefaultAddress(addressId, user.id);
      toast.success('✅ Dirección establecida como predeterminada');
      loadAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('❌ Error al establecer dirección predeterminada');
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'office':
        return <Building2 className="h-5 w-5 text-blue-600" />;
      case 'other':
        return <MapPin className="h-5 w-5 text-purple-600" />;
      default:
        return <Home className="h-5 w-5 text-green-600" />;
    }
  };

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case 'office':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'other':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="bg-white rounded-full p-6 mx-auto mb-6 w-24 h-24 shadow-lg">
              <ShoppingBag className="h-12 w-12 text-blue-600 mx-auto" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestiona tus direcciones</h2>
            <p className="text-gray-600 mb-8 text-lg">Inicia sesión para administrar tus direcciones de envío y mejorar tu experiencia de compra</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Iniciar sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <div className="relative">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <ShoppingBag className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Cargando tus direcciones...</p>
            <p className="mt-2 text-gray-500">Preparando tu información de envío</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header mejorado */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Mis Direcciones</h1>
              <p className="text-gray-600 text-lg">
                Gestiona tus direcciones de envío para una experiencia de compra más rápida
              </p>
            </div>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Dirección
            </Button>
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total de direcciones</p>
                    <p className="text-2xl font-bold text-gray-900">{addresses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Star className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dirección principal</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {addresses.find(a => a.is_default)?.name || 'No definida'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Envíos realizados</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lista de direcciones mejorada */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {addresses.length === 0 ? (
            <div className="col-span-full">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="text-center py-16">
                  <div className="bg-gray-100 rounded-full p-8 mx-auto mb-6 w-24 h-24">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">¡Agrega tu primera dirección!</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Guarda tus direcciones para que tus compras lleguen más rápido y sin complicaciones.
                  </p>
                  <Button 
                    onClick={() => handleOpenDialog()}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar Primera Dirección
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            addresses.map((address) => (
              <Card 
                key={address.id} 
                className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden group"
              >
                {/* Indicador de dirección predeterminada */}
                {address.is_default && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-green-400 text-white px-3 py-1 text-xs font-medium">
                    <Star className="h-3 w-3 inline mr-1" />
                    Principal
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getAddressTypeIcon('home')}
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {address.name}
                        </CardTitle>
                        <Badge 
                          variant="secondary" 
                          className={`mt-1 text-xs ${getAddressTypeColor('home')}`}
                        >
                          Casa
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(address)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        disabled={deleting === address.id}
                        className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                      >
                        {deleting === address.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-r-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Información de la dirección */}
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 text-sm leading-relaxed">{address.address}</p>
                    </div>
                    <p className="text-gray-600 text-sm pl-6">
                      {address.city}{address.state && `, ${address.state}`}
                      {address.zip_code && ` ${address.zip_code}`}
                    </p>
                    <p className="text-gray-600 text-sm pl-6 font-medium">{address.country}</p>
                    
                    {address.phone && (
                      <div className="flex items-center space-x-2 pl-6">
                        <span className="text-xs">📞</span>
                        <span className="text-gray-600 text-sm">{address.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-3" />
                  
                  {/* Acciones y metadata */}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      Creada {new Date(address.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        className="h-7 text-xs hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                      >
                        <StarOff className="h-3 w-3 mr-1" />
                        Hacer principal
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Formulario de dirección mejorado */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {editingAddress 
                  ? 'Actualiza los datos de tu dirección de envío'
                  : 'Agrega una nueva dirección para tus compras'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              {/* Tipo de dirección */}
              <AddressTypeSelector 
                addressType={addressType} 
                onTypeChange={setAddressType} 
              />

              {/* Información personal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Nombre completo *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Juan Pérez García"
                    required
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+593 99 123 4567"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dirección principal */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                  Dirección completa *
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Av. Amazonas N39-123 y Arízaga, Edificio Torres del Norte, Piso 5"
                  required
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Incluye calle, número, apartamento o casa
                </p>
              </div>

              {/* Ubicación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                    Ciudad *
                  </Label>
                  
                  <CitySelector
                    formData={formData}
                    setFormData={setFormData}
                    availableCities={availableCities}
                    showCustomCity={showCustomCity}
                    setShowCustomCity={setShowCustomCity}
                    cityToProvince={cityToProvince}
                    handleCityChange={handleCityChange}
                    handleCustomCityChange={handleCustomCityChange}
                  />
                  
                  {formData.state && (
                    <p className="text-xs text-gray-500">
                      Provincia: {formData.state}
                    </p>
                  )}
                </div>

                <ProvinceSelector
                  formData={formData}
                  ecuadorianProvinces={ecuadorianProvinces}
                  handleProvinceChange={handleProvinceChange}
                  getCitiesByProvince={getCitiesByProvince}
                  cityToProvince={cityToProvince}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zip_code" className="text-sm font-semibold text-gray-700">
                    Código Postal
                  </Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="170150"
                    maxLength={6}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-semibold text-gray-700">
                    País
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled
                  />
                </div>
              </div>

              {/* Opciones adicionales */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="is_default" className="text-sm text-gray-700 cursor-pointer">
                    Establecer como dirección principal
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Esta será tu dirección predeterminada para futuras compras
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-3 pt-6 border-t">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2" />
                      {editingAddress ? 'Actualizando...' : 'Guardando...'}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {editingAddress ? 'Actualizar Dirección' : 'Guardar Dirección'}
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseDialog}
                  disabled={submitting}
                  className="px-6"
                >
                  <X className="h-4 w-4 mr-2" />
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