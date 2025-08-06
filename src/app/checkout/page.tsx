"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { CheckoutService, CheckoutData } from '@/services/checkout.service';
import dynamic from 'next/dynamic';
import AddressSelector from '@/components/checkout/AddressSelector';
import CouponInput from '@/components/checkout/CouponInput';
import ShippingMethodSelector from '@/components/checkout/ShippingMethodSelector';
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector';
import CheckoutProtectedRoute from '@/components/checkout/CheckoutProtectedRoute';
import CheckoutStatus from '@/components/checkout/CheckoutStatus';
import { formatPriceSimple } from '@/utils/currency';
import type { Address } from '@/services/address.service';
import type { ShippingMethod } from '@/services/shipping.service';

// Carga dinámica de componentes de pago
const PayPalPayment = dynamic(() => import('@/components/payments/PayPalPayment'), { ssr: false });
const StripePayment = dynamic(() => import('@/components/payments/StripePayment'), { ssr: false });

interface CouponCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  maximum_discount?: number;
  minimum_amount?: number;
}

/**
 * Página de checkout con flujo correcto:
 * 1. Validar datos del checkout
 * 2. Proceder al pago
 * 3. Crear orden solo después del pago exitoso
 */
export default function CheckoutPage() {
  const { state, clearCart } = useCart();
  const { user } = useAuth();
  
  // Estados principales del checkout
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Estados del proceso de pago
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Estados de finalización
  const [orderComplete, setOrderComplete] = useState(false);
  const [finalOrderId, setFinalOrderId] = useState<string | null>(null);

  // Calcular totales
  const subtotal = state.items.reduce((sum, item) => sum + (item.producto.price * item.quantity), 0);
  
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

  // Obtener IDs para validación de cupones
  const categoryIds = Array.from(new Set(state.items.map(item => item.producto.category_id)));
  const productIds = state.items.map(item => item.producto.id);

  const handleCouponApply = (coupon: CouponCode) => {
    setAppliedCoupon(coupon);
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
  };

  /**
   * Paso 1: Preparar datos del checkout y mostrar formulario de pago
   */
  const handlePrepareCheckout = async () => {
    if (!user) {
      alert('Debes iniciar sesión para continuar');
      return;
    }

    if (!selectedAddress) {
      alert('Por favor selecciona una dirección de envío');
      return;
    }

    if (!selectedShipping) {
      alert('Por favor selecciona un método de envío');
      return;
    }

    if (!selectedPaymentMethod || !paymentData) {
      alert('Por favor selecciona un método de pago');
      return;
    }

    if (state.items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      // Preparar datos del checkout
      const checkoutInfo: CheckoutData = {
        userId: user.id,
        userEmail: user.email || '',
        items: state.items,
        address: {
          street: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state || '',
          zip: selectedAddress.zip_code || '',
          country: selectedAddress.country
        },
        shippingCost,
        coupon: appliedCoupon,
        couponDiscount,
        total
      };

      // Validar datos antes de proceder
      const validation = CheckoutService.validateCheckoutData(checkoutInfo);
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      console.log('✅ Datos validados correctamente, mostrando formulario de pago...');
      
      // Almacenar datos y mostrar formulario de pago
      setCheckoutData(checkoutInfo);
      setShowPaymentForm(true);

    } catch (error) {
      console.error('❌ Error preparando checkout:', error);
      setPaymentError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Paso 2: Procesar pago exitoso con Stripe
   */
  const handleStripePaymentSuccess = async (paymentIntent: any) => {
    if (!checkoutData) {
      setPaymentError('Datos del checkout no disponibles');
      return;
    }

    setPaymentProcessing(true);
    console.log('💳 Procesando pago exitoso con Stripe...');

    try {
      const result = await CheckoutService.processStripeCheckout(checkoutData, paymentIntent);
      
      if (result.success && result.orderId) {
        console.log('✅ Checkout completado exitosamente');
        setFinalOrderId(result.orderId);
        setOrderComplete(true);
        
        // Limpiar carrito solo después del éxito completo
        clearCart();
        
        // Redirigir después de un momento
        setTimeout(() => {
          window.location.href = `/orden-confirmada?orderId=${result.orderId}`;
        }, 2000);
      } else {
        throw new Error(result.error || 'Error procesando el checkout');
      }
    } catch (error) {
      console.error('❌ Error en checkout con Stripe:', error);
      setPaymentError(error instanceof Error ? error.message : 'Error procesando el pago');
    } finally {
      setPaymentProcessing(false);
    }
  };

  /**
   * Paso 2: Procesar pago exitoso con PayPal
   */
  const handlePayPalPaymentSuccess = async (paypalData: any) => {
    if (!checkoutData) {
      setPaymentError('Datos del checkout no disponibles');
      return;
    }

    setPaymentProcessing(true);
    console.log('💙 Procesando pago exitoso con PayPal...');

    try {
      const result = await CheckoutService.processPayPalCheckout(checkoutData, paypalData);
      
      if (result.success && result.orderId) {
        console.log('✅ Checkout completado exitosamente');
        setFinalOrderId(result.orderId);
        setOrderComplete(true);
        
        // Limpiar carrito solo después del éxito completo
        clearCart();
        
        // Redirigir después de un momento
        setTimeout(() => {
          window.location.href = `/orden-confirmada?orderId=${result.orderId}`;
        }, 2000);
      } else {
        throw new Error(result.error || 'Error procesando el checkout');
      }
    } catch (error) {
      console.error('❌ Error en checkout con PayPal:', error);
      setPaymentError(error instanceof Error ? error.message : 'Error procesando el pago');
    } finally {
      setPaymentProcessing(false);
    }
  };

  /**
   * Manejar errores de pago
   */
  const handlePaymentError = (error: string) => {
    console.error('❌ Error en el pago:', error);
    setPaymentError(error);
    setPaymentProcessing(false);
  };

  // Si el carrito está vacío
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

  // Si el pedido está completo
  if (orderComplete && finalOrderId) {
    return (
      <CheckoutProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Pago exitoso!</h1>
            <p className="text-gray-600 mb-6">
              Tu orden #{finalOrderId} ha sido creada correctamente. Recibirás un email de confirmación pronto.
            </p>
            <div className="text-sm text-gray-500">
              <p>Serás redirigido automáticamente...</p>
            </div>
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
          
          {/* Estado del checkout */}
          <CheckoutStatus 
            orderId={finalOrderId}
            pendingPayment={showPaymentForm && !orderComplete}
            error={paymentError}
            paymentType={paymentData?.type}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Formularios de checkout */}
            <div className="lg:col-span-2 space-y-8">
              
              {!showPaymentForm ? (
                <>
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
                </>
              ) : (
                /* Formulario de pago */
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    {paymentData?.type === 'paypal' ? '💙 Completar pago con PayPal' : '💳 Completar pago con tarjeta'}
                  </h2>
                  
                  {paymentProcessing && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-blue-800">Procesando tu pago y creando la orden...</p>
                    </div>
                  )}

                  {paymentError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 font-medium">Error en el pago</p>
                      <p className="text-red-700 text-sm mt-1">{paymentError}</p>
                      <button
                        onClick={() => {
                          setPaymentError(null);
                          setShowPaymentForm(false);
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                      >
                        Volver a intentar
                      </button>
                    </div>
                  )}

                  {!paymentProcessing && !paymentError && (
                    <>
                      {paymentData?.type === 'paypal' ? (
                        <PayPalPayment
                          orderId={`temp-${Date.now()}`}
                          amount={total}
                          onSuccess={handlePayPalPaymentSuccess}
                          onError={handlePaymentError}
                          savePaymentMethod={true}
                        />
                      ) : (
                        <StripePayment
                          orderId={`temp-${Date.now()}`}
                          total={total}
                          customerEmail={user?.email || ''}
                          userId={user?.id}
                          savePaymentMethod={true}
                          onSuccess={handleStripePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Resumen del pedido */}
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
                          Cantidad: {item.quantity}
                          {item.variant?.size && ` • Talla: ${item.variant.size}`}
                          {item.variant?.color && ` • Color: ${item.variant.color}`}
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {formatPriceSimple(item.producto.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totales */}
                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPriceSimple(subtotal)}</span>
                  </div>
                  
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento ({appliedCoupon?.code})</span>
                      <span>-{formatPriceSimple(couponDiscount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
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

                {/* Botón de acción */}
                <div className="mt-6">
                  {!showPaymentForm ? (
                    <button
                      onClick={handlePrepareCheckout}
                      disabled={loading || !user || !selectedAddress || !selectedShipping || !selectedPaymentMethod}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Preparando...
                        </div>
                      ) : (
                        `Proceder al pago - ${formatPriceSimple(total)}`
                      )}
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        🔒 Completa el pago para finalizar tu orden
                      </p>
                      <button
                        onClick={() => setShowPaymentForm(false)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        ← Volver al checkout
                      </button>
                    </div>
                  )}
                </div>

                {/* Información adicional */}
                <div className="mt-4 text-xs text-gray-500 space-y-1">
                  <p>✓ Pago seguro con encriptación SSL</p>
                  <p>✓ Política de devolución de 30 días</p>
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