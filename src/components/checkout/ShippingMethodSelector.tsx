'use client';

import { useState, useEffect, useCallback } from 'react';
import { Truck, Clock, Package } from 'lucide-react';
import { getActiveShippingMethods, calculateShippingCost, type ShippingMethod } from '@/services/shipping.service';
import { formatPriceSimple } from '@/utils/currency';

interface ShippingMethodSelectorProps {
  readonly subtotal: number;
  readonly selectedShipping: ShippingMethod | null;
  readonly onShippingSelect: (method: ShippingMethod) => void;
  readonly onShippingCostChange: (cost: number) => void;
}

export default function ShippingMethodSelector({
  subtotal,
  selectedShipping,
  onShippingSelect,
  onShippingCostChange
}: ShippingMethodSelectorProps) {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [shippingCosts, setShippingCosts] = useState<Record<string, number>>({});

  // Función para calcular costos estabilizada con useCallback
  const calculateCosts = useCallback(() => {
    const costs: Record<string, number> = {};
    
    for (const method of shippingMethods) {
      try {
        const cost = calculateShippingCost(method, subtotal);
        costs[method.id] = cost;
      } catch (error) {
        console.error(`Error calculating cost for ${method.name}:`, error);
        costs[method.id] = method.price;
      }
    }
    
    setShippingCosts(costs);
  }, [shippingMethods, subtotal]);

  useEffect(() => {
    loadShippingMethods();
  }, []);

  useEffect(() => {
    if (shippingMethods.length > 0) {
      calculateCosts();
    }
  }, [shippingMethods, subtotal, calculateCosts]);

  useEffect(() => {
    if (selectedShipping) {
      const cost = shippingCosts[selectedShipping.id] || 0;
      onShippingCostChange(cost);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShipping, shippingCosts]); // Excluimos onShippingCostChange para evitar bucle infinito

  const loadShippingMethods = async () => {
    try {
      setLoading(true);
      const methods = await getActiveShippingMethods();
      setShippingMethods(methods);
      
      // Seleccionar el primer método por defecto si no hay ninguno seleccionado
      if (!selectedShipping && methods.length > 0) {
        onShippingSelect(methods[0]);
      }
    } catch (error) {
      console.error('Error loading shipping methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedDelivery = (method: ShippingMethod): string => {
    return method.estimated_days || '3-5 días laborables';
  };

  const isFreeShipping = (method: ShippingMethod): boolean => {
    return method.free_over_amount !== undefined && 
           method.free_over_amount !== null && 
           subtotal >= method.free_over_amount;
  };

  const getShippingIcon = (methodName: string) => {
    const name = methodName.toLowerCase();
    if (name.includes('express') || name.includes('rápido')) {
      return <Clock size={20} className="text-orange-500" />;
    } else if (name.includes('standard') || name.includes('estándar')) {
      return <Truck size={20} className="text-blue-500" />;
    } else {
      return <Package size={20} className="text-gray-500" />;
    }
  };

  const handleMethodSelect = (method: ShippingMethod) => {
    onShippingSelect(method);
  };

  const handleKeyDown = (event: React.KeyboardEvent, method: ShippingMethod) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleMethodSelect(method);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Método de envío</h3>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (shippingMethods.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Método de envío</h3>
        <div className="text-center py-6 text-gray-500">
          <Package size={48} className="mx-auto mb-2 text-gray-300" />
          <p>No hay métodos de envío disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Método de envío</h3>
      
      <div className="space-y-3">
        {shippingMethods.map((method) => {
          const cost = shippingCosts[method.id] || 0;
          const isFree = isFreeShipping(method);
          const isSelected = selectedShipping?.id === method.id;
          
          return (
            <button
              key={method.id}
              type="button"
              className={`w-full text-left p-4 border rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleMethodSelect(method)}
              onKeyDown={(e) => handleKeyDown(e, method)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => handleMethodSelect(method)}
                      className="text-blue-600"
                    />
                    {getShippingIcon(method.name)}
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900">
                      {method.name}
                    </div>
                    {method.description && (
                      <div className="text-sm text-gray-600">
                        {method.description}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                      Entrega estimada: {getEstimatedDelivery(method)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {isFree ? (
                    <div>
                      <div className="text-sm line-through text-gray-400">
                        {formatPriceSimple(method.price)}
                      </div>
                      <div className="font-medium text-green-600">
                        ¡GRATIS!
                      </div>
                      <div className="text-xs text-green-600">
                        Envío gratis por compra mínima
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium text-gray-900">
                      {formatPriceSimple(cost)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Información adicional de envío gratis */}
              {!isFree && method.free_over_amount && method.free_over_amount > subtotal && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  💡 Añade {formatPriceSimple(method.free_over_amount - subtotal)} más 
                  para obtener envío gratis con {method.name}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Información general */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium mb-1">Información de envío:</p>
        <ul className="space-y-1">
          <li>• Los tiempos de entrega son estimados y pueden variar</li>
          <li>• Los envíos se procesan de lunes a viernes</li>
          <li>• Recibirás un código de seguimiento una vez despachado</li>
          <li>• El envío gratis aplica según el monto mínimo de cada método</li>
        </ul>
      </div>
    </div>
  );
}
