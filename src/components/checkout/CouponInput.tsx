'use client';

import { useState } from 'react';
import { Ticket, X, AlertCircle, CheckCircle } from 'lucide-react';
import { validateCoupon } from '@/services/coupon.service';
import { formatPriceSimple } from '@/utils/currency';

interface CouponCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  description?: string;
  maximum_discount?: number;
  minimum_amount?: number;
}

interface CouponInputProps {
  readonly userId: string;
  readonly subtotal: number;
  readonly categoryIds?: string[];
  readonly productIds?: string[];
  readonly appliedCoupon: CouponCode | null;
  readonly onCouponApply: (coupon: CouponCode) => void;
  readonly onCouponRemove: () => void;
}

export default function CouponInput({
  userId,
  subtotal,
  categoryIds = [],
  productIds = [],
  appliedCoupon,
  onCouponApply,
  onCouponRemove
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDiscount = (coupon: CouponCode) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% de descuento`;
    } else {
      return `${formatPriceSimple(coupon.discount_value)} de descuento`;
    }
  };

  const calculateDiscount = (coupon: CouponCode, amount: number): number => {
    if (coupon.discount_type === 'percentage') {
      const discount = (amount * coupon.discount_value) / 100;
      return coupon.maximum_discount ? Math.min(discount, coupon.maximum_discount) : discount;
    } else {
      return Math.min(coupon.discount_value, amount);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setValidating(true);
    setError(null);

    try {
      const validation = await validateCoupon(
        couponCode.trim(),
        userId,
        {
          subtotal,
          userId,
          cartItems: [],
          isFirstPurchase: false
        },
        categoryIds,
        productIds
      );

      if (validation.valid && validation.coupon) {
        // Mapear solo los tipos básicos de cupón
        const mappedCoupon = {
          id: validation.coupon.id,
          code: validation.coupon.code,
          discount_type: validation.coupon.discount_type === 'percentage' ? 'percentage' as const : 'fixed' as const,
          discount_value: validation.coupon.discount_value,
          description: validation.coupon.description,
          maximum_discount: validation.coupon.maximum_discount,
          minimum_amount: validation.coupon.minimum_amount
        };
        onCouponApply(mappedCoupon);
        setCouponCode('');
        setError(null);
      } else {
        setError(validation.error || 'Cupón no válido');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setError('Error al validar el cupón. Inténtalo nuevamente.');
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemove();
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  return (
    <div className="space-y-4">
      {/* Cupón aplicado */}
      {appliedCoupon && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-green-100 rounded">
              <CheckCircle size={16} className="text-green-600" />
            </div>
            <div>
              <div className="font-medium text-green-800">
                Cupón "{appliedCoupon.code}" aplicado
              </div>
              <div className="text-sm text-green-600">
                {formatDiscount(appliedCoupon)}
                {appliedCoupon.description && ` - ${appliedCoupon.description}`}
              </div>
              <div className="text-sm font-medium text-green-800">
                Ahorras: {formatPriceSimple(calculateDiscount(appliedCoupon, subtotal))}
              </div>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="p-1 text-green-600 hover:text-green-800"
            title="Remover cupón"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input para cupón */}
      {!appliedCoupon && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ticket size={16} className="text-gray-500" />
            <span className="text-sm font-medium">¿Tienes un cupón de descuento?</span>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyPress}
                placeholder="Ingresa tu código de cupón"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || validating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {validating ? 'Validando...' : 'Aplicar'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Información adicional */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Los cupones se aplican sobre el total de productos</p>
            <p>• Solo se puede usar un cupón por pedido</p>
            <p>• Algunos cupones tienen restricciones por categoría o producto</p>
          </div>
        </div>
      )}
    </div>
  );
}
