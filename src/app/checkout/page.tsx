"use client"

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createOrder } from '@/services/order.service';
import { recordCouponUsage } from '@/services/coupon.service';
import { loadStripe } from '@stripe/stripe-js';
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
  
  // Estados para los diferentes componentes
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  
  // Estados para el proceso de checkout
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState(false);
  
  // Calcular subtotal de productos
  const subtotal = state.items.reduce((sum, item) => sum + (item.producto.price * item.quantity), 0);
  
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

  const handleSubmit = async () => {
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

    if (!selectedAddress) {
      alert('Por favor selecciona una dirección de envío');
      return;
    }

    if (state.items.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setLoading(true);

    try {
      // Mapear el tipo de pago correctamente
      const paymentMethod = paymentData.type === 'card' ? 'stripe' : paymentData.type === 'paypal' ? 'paypal' : 'stripe';
      
      console.log('Creating order with:', {
        userId: user.id,
        itemsCount: state.items.length,
        addressInfo: {
          street: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state || '',
          zip: selectedAddress.zip_code || '',
          country: selectedAddress.country
        },
        paymentMethod
      });
      
      const order = await createOrder(
        user.id,
        state.items,
        {
          street: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state || '',
          zip: selectedAddress.zip_code || '',
          country: selectedAddress.country
        },
        paymentMethod,
        shippingCost,
        0.19 // 19% IVA (impuesto)
      );
      setOrderId(order.id);

      // Registrar uso del cupón si se aplicó uno
      if (appliedCoupon) {
        await recordCouponUsage(
          appliedCoupon.id,
          user.id,
          order.id,
          couponDiscount
        );
      }

      // Limpiar carrito al completar la orden
      clearCart();

      // Si es un método guardado, procesarlo directamente
      if (paymentData.savedMethodId) {
        if (paymentData.type === 'card') {
          await handleSavedCardPayment(order, paymentData.externalId);
        } else if (paymentData.type === 'paypal') {
          await handleSavedPayPalPayment(order, paymentData.externalId);
        }
      } else {
        // Para nuevos métodos, mostrar formulario de pago
        setPendingPayment(true);
      }
      
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert(`Error al procesar la orden: ${error instanceof Error ? error.message : 'Error desconocido'}. Inténtalo nuevamente.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSavedCardPayment = async (order: any, paymentMethodId: string) => {
    try {
      // Procesar pago con método guardado usando nuestro endpoint
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'usd',
          payment_method_id: paymentMethodId,
          customer_id: user?.email, // O usar customer ID si existe
          save_payment_method: false // Ya está guardado
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      const { client_secret, payment_intent_id } = data;

      // Confirmar el pago inmediatamente
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) throw new Error('Stripe no disponible');

      const { error: confirmError } = await stripe.confirmCardPayment(client_secret);
      
      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Redirigir a página de éxito
      window.location.href = `/orden-confirmada?orderId=${order.id}&paymentIntent=${payment_intent_id}`;
      
    } catch (error: any) {
      console.error('Error processing saved card payment:', error);
      alert('Error al procesar el pago: ' + error.message);
      setPendingPayment(false);
      setOrderId(null);
    }
  };

  const handleSavedPayPalPayment = async (order: any, paypalMethodId: string) => {
    try {
      // Para métodos de PayPal guardados, redirigir al proceso de PayPal
      // Nota: PayPal no permite pagos automáticos con métodos guardados como Stripe
      // Necesitamos iniciar un nuevo flujo de PayPal
      
      const response = await fetch('/api/payments/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'USD',
          order_id: order.id,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear orden de PayPal');
      }

      // Redirigir al usuario a PayPal para completar el pago
      if (data.approval_url) {
        window.location.href = data.approval_url;
      } else {
        throw new Error('No se recibió URL de aprobación de PayPal');
      }
      
    } catch (error: any) {
      console.error('Error processing saved PayPal payment:', error);
      alert('Error al procesar el pago con PayPal: ' + error.message);
      setPendingPayment(false);
      setOrderId(null);
    }
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
                  if (orderId && pendingPayment) {
                    let paymentComponent;
                    if (paymentData?.type === 'paypal') {
                      paymentComponent = (
                        <PayPalPayment
                          orderId={orderId}
                          amount={total}
                          onSuccess={(paymentData) => {
                            console.log('Pago PayPal exitoso:', paymentData);
                            window.location.href = `/orden-confirmada?orderId=${orderId}`;
                          }}
                          onError={(error) => {
                            console.error('Error en pago PayPal:', error);
                            setPendingPayment(false);
                            setOrderId(null);
                          }}
                          savePaymentMethod={true}
                        />
                      );
                    } else if (paymentData?.type === 'card' && !paymentData?.savedMethodId) {
                      paymentComponent = (
                        <StripePayment
                          orderId={orderId}
                          total={total}
                          customerEmail={user?.email || ''}
                          userId={user?.id}
                          savePaymentMethod={true}
                          onSuccess={(paymentIntent) => {
                            console.log('Pago exitoso:', paymentIntent);
                            window.location.href = `/orden-confirmada?orderId=${orderId}`;
                          }}
                          onError={(error) => {
                            console.error('Error en el pago:', error);
                            setPendingPayment(false);
                            setOrderId(null);
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
                    return (
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !user || !selectedAddress || !selectedShipping || !selectedPaymentMethod}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? 'Procesando...' : `Crear orden - ${formatPriceSimple(total)}`}
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
