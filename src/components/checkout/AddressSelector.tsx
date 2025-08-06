'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Phone } from 'lucide-react';
import { getUserAddresses, createAddress, deleteAddress, setDefaultAddress } from '@/services/address.service';
import type { Address, CreateAddressData } from '@/services/address.service';
import type { User } from '@/types';

// Hook personalizado para gestionar datos de Ecuador (igual al de la página de direcciones)
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

interface AddressSelectorProps {
  readonly user: User;
  readonly selectedAddress: Address | null;
  readonly onAddressSelect: (address: Address) => void;
}

export default function AddressSelector({ user, selectedAddress, onAddressSelect }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showCustomCity, setShowCustomCity] = useState(false);

  const { ecuadorianProvinces, cityToProvince, getAllCities, getCitiesByProvince } = useEcuadorianData();
  
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

  // Funciones para manejar cambios de provincia y ciudad
  const handleCityChange = (city: string) => {
    setFormData(prev => ({ 
      ...prev, 
      city,
      state: cityToProvince[city] || prev.state
    }));
    setShowCustomCity(false);
  };

  const handleCustomCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
  };

  const handleProvinceChange = (province: string) => {
    const citiesInProvince = getCitiesByProvince(province);
    setAvailableCities(citiesInProvince);
    
    setFormData(prev => ({ 
      ...prev, 
      state: province,
      city: citiesInProvince.includes(prev.city) ? prev.city : ''
    }));
  };

  // Inicializar formulario con datos del usuario
  const initializeForm = () => {
    setFormData({
      name: '',
      phone: user.phone || '', // Pre-rellenar con el teléfono del usuario
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Ecuador',
      is_default: false
    });
    setShowCustomCity(false);
    setAvailableCities(getAllCities());
  };

  // Inicializar ciudades disponibles
  useEffect(() => {
    const cities = formData.state ? getCitiesByProvince(formData.state) : getAllCities();
    setAvailableCities(cities);
  }, [formData.state]); // Solo depende del estado de formData.state

  useEffect(() => {
    loadAddresses();
  }, [user.id]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await getUserAddresses(user.id);
      setAddresses(data);
      
      // Seleccionar la dirección por defecto si no hay ninguna seleccionada
      if (!selectedAddress && data.length > 0) {
        const defaultAddr = data.find(addr => addr.is_default) || data[0];
        onAddressSelect(defaultAddr);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // No manejar city y state aquí, se manejan con las funciones especializadas
    if (name === 'city' || name === 'state') {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingAddress) {
        // Implementar actualización de dirección
        console.log('Función de actualización pendiente de implementar');
        alert('Función de edición aún no implementada');
        return;
      } else {
        const newAddress = await createAddress(user.id, formData);
        setAddresses(prev => [newAddress, ...prev]);
        
        // Si es la primera dirección o está marcada como default, seleccionarla
        if (addresses.length === 0 || formData.is_default) {
          onAddressSelect(newAddress);
        }
      }

      // Resetear formulario
      initializeForm();
      setShowForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Error al guardar la dirección');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;

    try {
      await deleteAddress(addressId, user.id);
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      
      // Si se eliminó la dirección seleccionada, seleccionar otra
      if (selectedAddress?.id === addressId) {
        const remaining = addresses.filter(addr => addr.id !== addressId);
        if (remaining.length > 0) {
          onAddressSelect(remaining[0]);
        }
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Error al eliminar la dirección');
    }
  };

  const handleAddressClick = (address: Address) => {
    onAddressSelect(address);
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId, user.id);
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        is_default: addr.id === addressId
      })));
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Error al establecer dirección predeterminada');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dirección de envío</h3>
        <div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Dirección de envío</h3>
        <button
          onClick={() => {
            if (!showForm) {
              initializeForm(); // Inicializar formulario con datos del usuario
            }
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus size={16} />
          Nueva dirección
        </button>
      </div>

      {/* Lista de direcciones */}
      <div className="space-y-3">
        {addresses.map((address) => (
          <label
            key={address.id}
            className={`w-full p-4 border rounded-lg transition-colors cursor-pointer block ${
              selectedAddress?.id === address.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            aria-label={`Seleccionar dirección de ${address.name} en ${address.city}`}
          >
            <input
              type="radio"
              name="selectedAddress"
              value={address.id}
              checked={selectedAddress?.id === address.id}
              onChange={() => handleAddressClick(address)}
              className="sr-only"
            />
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={16} className="text-gray-500" />
                  <span className="font-medium">{address.name}</span>
                  {address.is_default && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Principal
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {address.address}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  {address.city}, {address.state} {address.zip_code}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  {address.country}
                </p>
                {address.phone && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Phone size={14} />
                    {address.phone}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {!address.is_default && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSetDefault(address.id);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Hacer principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(address.id);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </label>
        ))}
      </div>

      {addresses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No tienes direcciones guardadas</p>
          <p className="text-sm">Agrega una dirección para continuar</p>
        </div>
      )}

      {/* Formulario para nueva dirección */}
      {showForm && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-4">
            {editingAddress ? 'Editar dirección' : 'Nueva dirección'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="address-name" className="block text-sm font-medium mb-1">
                  Nombre para la dirección *
                </label>
                <input
                  type="text"
                  id="address-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Casa, Oficina"
                  className="w-full border rounded-lg p-2"
                />
              </div>
              
              <div>
                <label htmlFor="address-phone" className="block text-sm font-medium mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="address-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Ej: +57 300 123 4567"
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address-street" className="block text-sm font-medium mb-1">
                Dirección completa *
              </label>
              <input
                type="text"
                id="address-street"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="Calle, número, apartamento, etc."
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selector de Ciudad */}
              <div>
                <label htmlFor="address-city" className="block text-sm font-medium mb-1">
                  Ciudad *
                </label>
                {showCustomCity ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleCustomCityChange(e.target.value)}
                      placeholder="Escribe tu ciudad"
                      className="flex-1 border rounded-lg p-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomCity(false);
                        setFormData(prev => ({ ...prev, city: '' }));
                      }}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      ↩️
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full border rounded-lg p-2"
                      required
                    >
                      <option value="">Selecciona tu ciudad</option>
                      {availableCities.length === 0 ? (
                        <option value="" disabled>
                          {formData.state ? 'No hay ciudades para esta provincia' : 'Selecciona provincia primero'}
                        </option>
                      ) : (
                        availableCities.map((city: string) => (
                          <option key={city} value={city}>{city}</option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCustomCity(true)}
                      className="w-full mt-1 text-xs text-blue-600 hover:text-blue-700 text-left"
                    >
                      ✏️ Escribir otra ciudad
                    </button>
                  </>
                )}
                {formData.city && cityToProvince[formData.city] && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Ciudad válida para {cityToProvince[formData.city]}
                  </p>
                )}
              </div>
              
              {/* Selector de Provincia */}
              <div>
                <label htmlFor="address-state" className="block text-sm font-medium mb-1">
                  Provincia *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  required
                >
                  <option value="">Selecciona provincia</option>
                  {ecuadorianProvinces.map((province: string) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                {formData.state && getCitiesByProvince(formData.state).length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getCitiesByProvince(formData.state).length} ciudades disponibles
                  </p>
                )}
                {formData.city && formData.state && cityToProvince[formData.city] && 
                 cityToProvince[formData.city] !== formData.state && (
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="text-amber-600">⚠️</span>
                    <span className="text-amber-600">
                      {formData.city} pertenece a {cityToProvince[formData.city]}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleProvinceChange(cityToProvince[formData.city])}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Corregir
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="address-zip" className="block text-sm font-medium mb-1">
                  Código postal
                </label>
                <input
                  type="text"
                  id="address-zip"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                  placeholder="170150"
                  maxLength={6}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label htmlFor="address-country" className="block text-sm font-medium mb-1">
                  País *
                </label>
                <input
                  type="text"
                  id="address-country"
                  value={formData.country}
                  className="w-full border rounded-lg p-2 bg-gray-50"
                  disabled
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="address-default"
                name="is_default"
                checked={formData.is_default}
                onChange={handleInputChange}
                className="rounded"
              />
              <label htmlFor="address-default" className="text-sm">
                Establecer como dirección principal
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Guardar dirección'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAddress(null);
                  setShowCustomCity(false);
                  setAvailableCities(getAllCities());
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
