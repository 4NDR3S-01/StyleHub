"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import AddressSelector from '@/components/checkout/AddressSelector';
import CouponInput from '@/components/checkout/CouponInput';
import ShippingMethodSelector from '@/components/checkout/ShippingMethodSelector';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import CheckoutProtectedRoute from '@/components/checkout/CheckoutProtectedRoute';
import { formatPriceSimple } from '@/utils/currency';
import type { Address } from '@/services/address.service';
import type { ShippingMethod } from '@/services/shipping.service';

// Carga dinámica del componente de PayPal solo en cliente
const PayPalPayment = dynamic(() => import('@/components/payments/PayPalPayment'), { ssr: false });
const StripePayment = dynamic(() => import('@/components/payments/StripePayment'), { ssr: false });

interface CouponCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  description?: string;
  maximum_discount?: number;
  minimum_amount?: number;
}

/**
 * Página de checkout mejorada con componentes modulares para direcciones,
 * cupones y métodos de envío integrados con la base de datos.
 */
export default function CheckoutPage() {
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  
  // Estados para los diferentes componentes
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  
  // Estados para el proceso de checkout
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  
  // Calcular subtotal de productos
  const subtotal = state.items.reduce((sum, item) => sum + (item.producto.price * item.quantity), 0);
  
  // Calcular tax (ejemplo: 8.5%)
  const taxAmount = subtotal * 0.085;
  
  // Calcular descuento del cupón
  const calculateCouponDiscount = (): number => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discount_type === 'percentage') {
      const discount = (subtotal * appliedCoupon.discount_value) / 100;
      return appliedCoupon.maximum_discount 
        ? Math.min(discount, appliedCoupon.maximum_discount) 
        : discount;
    } else {
      return Math.min(appliedCoupon.discount_value, subtotal);
    }
  };

  const couponDiscount = calculateCouponDiscount();
  const total = subtotal - couponDiscount + shippingCost;

  // Obtener IDs de categorías y productos para validación de cupones
  const categoryIds = Array.from(new Set(state.items.map(item => 
    item.producto.category_id
  )));
  const productIds = state.items.map(item => item.producto.id);

  const handleCouponApply = (coupon: CouponCode) => {
    setAppliedCoupon(coupon);
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Debes estar autenticado para realizar una compra');
      return;
    }

    if (!selectedPaymentMethod) {
      alert('Selecciona un método de pago');
      return;
    }

    if (!selectedAddress) {
      alert('Selecciona una dirección de envío');
      return;
    }

    setLoading(true);

    try {
      console.log('Items del carrito antes de checkout:', state.items);
      console.log('PaymentData actual:', paymentData);
      console.log('SelectedPaymentMethod actual:', selectedPaymentMethod);
      
      // Determinar el flujo según el tipo de método de pago
      const isNewCard = selectedPaymentMethod === 'new-card' || paymentData?.isNew;
      const isSavedMethod = paymentData?.savedMethodId && !paymentData?.isNew;
      
      // Para métodos guardados (tarjetas o PayPal), procesar directamente
      if (isSavedMethod && paymentData?.type !== 'paypal') {
        await processOrderWithSavedPayment();
        return;
      }
      
      // Para PayPal (nuevo o guardado), manejar el flujo de aprobación
      if (paymentData?.type === 'paypal') {
        await processPayPalFlow();
        return;
      }
      
      // Para nuevas tarjetas, crear orden y mostrar formulario de pago
      if (isNewCard) {
        await createOrderForNewCard();
        return;
      }
      
      // Fallback - procesamiento general
      await processGeneralCheckout();
      
    } catch (error) {
      console.error('Error in checkout:', error);
      alert(`Error al procesar la orden: ${error instanceof Error ? error.message : 'Error desconocido'}. Inténtalo nuevamente.`);
    } finally {
      setLoading(false);
    }
  };

  // Procesar orden con método de pago guardado
  const processOrderWithSavedPayment = async () => {
    const checkoutDataBuilt = buildCheckoutData();
    setCheckoutData(checkoutDataBuilt); // Guardar en el estado
    
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutDataBuilt),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Error al procesar el checkout con método guardado');
    }

    // Pago exitoso con método guardado - limpiar carrito y redirigir
    if (result.orderId) {
      clearCart();
      router.push(`/orden-confirmada?orderId=${result.orderId}&paymentIntent=${result.paymentIntentId}`);
    }
  };

  // Procesar flujo de PayPal
  const processPayPalFlow = async () => {
    const checkoutDataBuilt = buildCheckoutData();
    setCheckoutData(checkoutDataBuilt); // Guardar en el estado
    
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutDataBuilt),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Error al procesar el checkout con PayPal');
    }

    // Redirigir a PayPal para aprobación
    if (result.approvalUrl) {
      window.location.href = result.approvalUrl;
      return;
    }

    // Si ya fue aprobado, proceder con la confirmación
    if (result.orderId) {
      clearCart();
      router.push(`/orden-confirmada?orderId=${result.orderId}&paymentIntent=${result.paymentIntentId}`);
    }
  };

  // Procesar checkout ético para nueva tarjeta: PAGO PRIMERO, ORDEN DESPUÉS
  const createOrderForNewCard = async () => {
    if (!user || !selectedAddress) {
      throw new Error('Usuario y dirección requeridos');
    }
    
    // Construir datos de checkout
    const checkoutDataBuilt = buildCheckoutData();
    setCheckoutData(checkoutDataBuilt); // Guardar en el estado
    
    // Usar el servicio de checkout ético que procesa pago ANTES de crear orden
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...checkoutDataBuilt,
        paymentMethod: {
          type: 'stripe',
          savedMethodId: 'new-card' // Indica que es una nueva tarjeta
        }
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Error al procesar el checkout');
    }

    // Si necesita confirmación en frontend (nueva tarjeta)
    if (result.clientSecret) {
      // Guardar los datos de checkout para usar después de la confirmación
      console.log('💾 Guardando datos de pago:', {
        clientSecret: result.clientSecret ? 'presente' : 'ausente',
        paymentIntentId: result.paymentIntentId,
        checkoutData: checkoutDataBuilt ? 'presente' : 'ausente'
      });
      
      // Guardar en localStorage como backup en caso de que se pierda el estado
      localStorage.setItem(`checkout_${result.paymentIntentId}`, JSON.stringify(checkoutDataBuilt));
      
      setPaymentData({
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        checkoutData: checkoutDataBuilt, // Datos para crear orden después
        type: 'card',
        requiresForm: true
      });
      setPendingPayment(true);
    } else if (result.orderId) {
      // Pago exitoso y orden creada (caso de método guardado)
      clearCart();
      router.push(`/orden-confirmada?orderId=${result.orderId}&paymentIntent=${result.paymentIntentId}`);
    }
  };

  // Procesar checkout general (fallback)
  const processGeneralCheckout = async () => {
    const checkoutDataBuilt = buildCheckoutData();
    setCheckoutData(checkoutDataBuilt); // Guardar en el estado
    
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutDataBuilt),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Error al procesar el checkout');
    }

    if (result.orderId) {
      clearCart();
      router.push(`/orden-confirmada?orderId=${result.orderId}&paymentIntent=${result.paymentIntentId}`);
    }
  };

  // Construir datos de checkout
  const buildCheckoutData = () => {
    if (!selectedAddress) {
      throw new Error('Dirección de envío requerida');
    }
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    return {
      userId: user.id,
      items: state.items.map((item: any) => ({
        id: item.producto.id,
        quantity: item.quantity,
        price: item.producto.price,
        variant_id: item.variant?.id,
        color: item.variant?.color,
        size: item.variant?.size
      })),
      shippingAddress: {
        street: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state || '',
        postal_code: selectedAddress.zip_code || '',
        country: selectedAddress.country,
        name: selectedAddress.name,
        phone: selectedAddress.phone
      },
      paymentMethod: {
        type: paymentData?.type || 'card',
        savedMethodId: paymentData?.savedMethodId !== 'new-card' ? paymentData?.savedMethodId : undefined
      },
      total,
      subtotal,
      shipping: shippingCost,
      tax: taxAmount,
      couponCode: appliedCoupon?.code,
      couponDiscount: couponDiscount
    };
  };

  if (state.items.length === 0) {
    return (
      <CheckoutProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h1>
            <p className="text-gray-600 mb-6">Agrega algunos productos antes de proceder al checkout</p>
            <a
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continuar comprando
            </a>
          </div>
        </div>
      </CheckoutProtectedRoute>
    );
  }

  if (orderId && pendingPayment && paymentData?.type !== 'paypal') {
    return (
      <CheckoutProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Orden creada exitosamente!</h1>
            <p className="text-gray-600 mb-6">
              Tu orden #{orderId} ha sido procesada. Recibirás un email de confirmación pronto.
            </p>
            <a
              href="/perfil/orders"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-4"
            >
              Ver mis órdenes
            </a>
            <a
              href="/"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Seguir comprando
            </a>
          </div>
        </div>
      </CheckoutProtectedRoute>
    );
  }

  return (
    <CheckoutProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna izquierda: Formularios */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Dirección de envío */}
            {user && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <AddressSelector
                  user={user}
                  selectedAddress={selectedAddress}
                  onAddressSelect={setSelectedAddress}
                />
              </div>
            )}

            {/* Método de envío */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <ShippingMethodSelector
                subtotal={subtotal}
                selectedShipping={selectedShipping}
                onShippingSelect={setSelectedShipping}
                onShippingCostChange={setShippingCost}
              />
            </div>

            {/* Cupones */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {user && (
                <CouponInput
                  userId={user.id}
                  subtotal={subtotal}
                  categoryIds={categoryIds}
                  productIds={productIds}
                  appliedCoupon={appliedCoupon}
                  onCouponApply={handleCouponApply}
                  onCouponRemove={handleCouponRemove}
                />
              )}
            </div>

            {/* Método de pago */}
            <PaymentMethodSelector
              selectedMethod={selectedPaymentMethod}
              onMethodSelect={(methodId, type) => {
                setSelectedPaymentMethod(methodId);
              }}
              onPaymentDataChange={(data) => {
                setPaymentData(data);
              }}
            />

            {/* Mostrar información del método seleccionado */}
            {selectedPaymentMethod && paymentData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">Método de pago seleccionado</h4>
                    <p className="text-sm text-blue-700">
                      {(() => {
                        if (paymentData.isNew && paymentData.type === 'card') {
                          return 'Se te redirigirá al formulario de pago seguro de Stripe para ingresar los datos de tu tarjeta.';
                        }
                        if (paymentData.isNew && paymentData.type === 'paypal') {
                          return 'Se te redirigirá a PayPal para completar el pago con tu cuenta.';
                        }
                        if (paymentData.savedMethodId && !paymentData.isNew) {
                          let method = 'método guardado';
                          if (paymentData.cardBrand) {
                            method = `tarjeta ${paymentData.cardBrand} terminada en ${paymentData.cardLastFour}`;
                          } else if (paymentData.paypalEmail) {
                            method = `cuenta de PayPal (${paymentData.paypalEmail})`;
                          }
                          return `Se procesará el pago automáticamente usando tu ${method}.`;
                        }
                        return 'Método de pago configurado correctamente.';
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha: Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">Resumen del pedido</h3>
              
              {/* Productos */}
              <div className="space-y-3 mb-6">
                {state.items.map((item) => (
                  <div key={`${item.producto.id}-${item.variant?.id || 'no-variant'}`} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.producto.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.variant?.size && `Talla: ${item.variant.size}`}
                        {item.variant?.size && item.variant?.color && ' • '}
                        {item.variant?.color && `Color: ${item.variant.color}`}
                      </p>
                      <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPriceSimple(item.producto.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total de Productos</span>
                  <span>{formatPriceSimple(subtotal)}</span>
                </div>
                
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento ({appliedCoupon?.code})</span>
                    <span>-{formatPriceSimple(couponDiscount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>Envío</span>
                  <span>
                    {shippingCost === 0 ? 'GRATIS' : formatPriceSimple(shippingCost)}
                  </span>
                </div>
                
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPriceSimple(total)}</span>
                </div>
              </div>

              {/* Botón de pago y formularios */}
              <div className="mt-6">
                {/* Extraer la lógica de renderizado de pago en una variable */}
                {(() => {
                  if (pendingPayment && paymentData) {
                    let paymentComponent;
                    if (paymentData?.type === 'paypal') {
                      paymentComponent = (
                        <PayPalPayment
                          orderId={orderId!}
                          amount={total}
                          checkoutData={checkoutData}
                          onSuccess={(result) => {
                            console.log('Pago PayPal exitoso:', result);
                            clearCart();
                            window.location.href = `/orden-confirmada?orderId=${result.orderId}`;
                          }}
                          onError={(error) => {
                            console.error('Error en pago PayPal:', error);
                            setPendingPayment(false);
                            setOrderId(null);
                          }}
                          savePaymentMethod={true}
                        />
                      );
                    } else if (paymentData?.type === 'card' && paymentData?.requiresForm && paymentData?.clientSecret) {
                      // Nuevo flujo ético: usar clientSecret, NO orderId
                      paymentComponent = (
                        <StripePayment
                          clientSecret={paymentData.clientSecret}
                          total={total}
                          customerEmail={user?.email || ''}
                          userId={user?.id}
                          savePaymentMethod={true}
                          onSuccess={async (paymentIntent) => {
                            console.log('Pago exitoso, creando orden...', paymentIntent);
                            
                            // AHORA sí crear la orden porque el pago fue exitoso
                            try {
                              console.log('💳 Pago exitoso, verificando datos...');
                              console.log('paymentData completo:', paymentData);
                              console.log('paymentData.checkoutData:', paymentData.checkoutData);
                              
                              // Intentar obtener checkoutData del estado o localStorage
                              let checkoutDataToUse = paymentData.checkoutData;
                              
                              if (!checkoutDataToUse) {
                                console.log('⚠️ checkoutData no encontrado en estado, intentando localStorage...');
                                const storedData = localStorage.getItem(`checkout_${paymentIntent.id}`);
                                if (storedData) {
                                  checkoutDataToUse = JSON.parse(storedData);
                                  console.log('✅ Datos recuperados de localStorage');
                                }
                              }
                              
                              if (!checkoutDataToUse) {
                                console.error('❌ checkoutData es undefined en ambos lugares!');
                                alert('Error: No se encontraron los datos de checkout. Contacta soporte.');
                                return;
                              }

                              console.log('📦 Enviando datos para crear orden:', {
                                paymentIntentId: paymentIntent.id,
                                checkoutData: checkoutDataToUse
                              });

                              const response = await fetch('/api/checkout/confirm-stripe-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  paymentIntentId: paymentIntent.id,
                                  checkoutData: checkoutDataToUse
                                })
                              });
                              
                              const result = await response.json();
                              console.log('📋 Respuesta del servidor:', result);
                              
                              if (result.success) {
                                // Limpiar localStorage
                                localStorage.removeItem(`checkout_${paymentIntent.id}`);
                                clearCart();
                                window.location.href = `/orden-confirmada?orderId=${result.orderId}&paymentIntent=${paymentIntent.id}`;
                              } else {
                                console.error('Error creando orden:', result.error);
                                alert(`Pago exitoso pero error al crear orden: ${result.error}. Contacta soporte.`);
                              }
                            } catch (error) {
                              console.error('Error confirmando orden:', error);
                              alert('Pago exitoso pero error al procesar orden. Contacta soporte.');
                            }
                          }}
                          onError={(error) => {
                            console.error('Error en el pago:', error);
                            setPendingPayment(false);
                            setPaymentData(null);
                          }}
                        />
                      );
                    } else {
                      paymentComponent = (
                        <div className="text-center">
                          <p className="text-gray-600">Procesando pago con método guardado...</p>
                        </div>
                      );
                    }
                    return <div className="space-y-4">{paymentComponent}</div>;
                  } else {
                    // Determinar el texto del botón según el método de pago
                    const getButtonText = () => {
                      if (loading) return 'Procesando...';
                      
                      if (paymentData?.isNew && paymentData?.type === 'card') {
                        return `Continuar al pago - ${formatPriceSimple(total)}`;
                      }
                      
                      if (paymentData?.isNew && paymentData?.type === 'paypal') {
                        return `Pagar con PayPal - ${formatPriceSimple(total)}`;
                      }
                      
                      if (paymentData?.savedMethodId && !paymentData?.isNew) {
                        let method = 'método guardado';
                        if (paymentData?.cardBrand) {
                          method = `${paymentData.cardBrand} ••••${paymentData.cardLastFour}`;
                        } else if (paymentData?.paypalEmail) {
                          method = `PayPal (${paymentData.paypalEmail})`;
                        }
                        return `Pagar con ${method} - ${formatPriceSimple(total)}`;
                      }
                      
                      return `Crear orden - ${formatPriceSimple(total)}`;
                    };

                    return (
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !user || !selectedAddress || !selectedShipping || !selectedPaymentMethod}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {getButtonText()}
                      </button>
                    );
                  }
                })()}
              </div>

              {/* Información adicional */}
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p>✓ Pago seguro con encriptación SSL</p>
                <p>✓ Política de devolución</p>
                <p>✓ Envío con seguimiento incluido</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </CheckoutProtectedRoute>
  );
}
