import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CartItem, User } from '@/types';
import { useCart } from '@/context/CartContext';
import { OrderService, PaymentService } from '@/services/order.service';

// Esquema de validación
const checkoutSchema = z.object({
  // Información de envío
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  
  // Dirección
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().min(2, 'El estado/provincia es requerido'),
  zipCode: z.string().min(5, 'El código postal debe tener al menos 5 caracteres'),
  country: z.string().min(2, 'El país es requerido'),
  
  // Información de pago
  cardNumber: z.string()
    .min(16, 'El número de tarjeta debe tener 16 dígitos')
    .max(19, 'Número de tarjeta inválido')
    .regex(/^[0-9\s]+$/, 'Solo se permiten números'),
  cardHolder: z.string().min(2, 'El nombre del titular es requerido'),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Formato inválido (MM/YY)'),
  cvv: z.string()
    .min(3, 'CVV debe tener al menos 3 dígitos')
    .max(4, 'CVV debe tener máximo 4 dígitos')
    .regex(/^[0-9]+$/, 'Solo se permiten números'),
  
  // Opciones adicionales
  saveInfo: z.boolean().default(false),
  sameAsShipping: z.boolean().default(true),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface UseCheckoutProps {
  user: User | null;
  cartItems: CartItem[];
}

export function useCheckout({ user, cartItems }: UseCheckoutProps) {
  const { clearCart } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: user?.name || '',
      lastName: user?.lastname || '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Colombia',
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      saveInfo: false,
      sameAsShipping: true,
    },
  });

  // Formatear número de tarjeta
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Formatear fecha de expiración
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Validar número de tarjeta usando algoritmo de Luhn
  const validateCardNumber = (cardNumber: string) => {
    const num = cardNumber.replace(/\s/g, '');
    let sum = 0;
    let alternate = false;
    
    for (let i = num.length - 1; i >= 0; i--) {
      let n = parseInt(num.charAt(i), 10);
      
      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }
      
      sum += n;
      alternate = !alternate;
    }
    
    return (sum % 10) === 0;
  };

  // Detectar tipo de tarjeta
  const detectCardType = (cardNumber: string) => {
    const num = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    if (/^6/.test(num)) return 'discover';
    
    return 'unknown';
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);
    
    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar número de tarjeta
      if (!validateCardNumber(data.cardNumber)) {
        throw new Error('Número de tarjeta inválido');
      }

      // Calcular totales
      const totals = OrderService.calculateTotals(cartItems);

      // Procesar pago
      const paymentResult = await PaymentService.processPayment(totals.total, {
        cardNumber: data.cardNumber,
        cardHolder: data.cardHolder,
        expiryDate: data.expiryDate,
        cvv: data.cvv
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Error procesando el pago');
      }

      // Crear orden en la base de datos
      const orderData = {
        user_id: user.id,
        items: cartItems,
        shipping_info: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        payment_info: {
          method: 'credit_card',
          lastFour: data.cardNumber.slice(-4),
        },
        subtotal: totals.subtotal,
        shipping_cost: totals.shipping,
        tax: totals.tax,
        total: totals.total,
      };

      const order = await OrderService.createOrder(orderData);
      
      // Limpiar carrito y redirigir
      clearCart();
      toast.success('¡Pago procesado exitosamente!');
      router.push(`/orden-confirmada?orderId=${order.id}`);
      
    } catch (error) {
      console.error('Error procesando pago:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Validar información de envío
      const shippingFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
      form.trigger(shippingFields as any).then(isValid => {
        if (isValid) setStep(2);
      });
    } else if (step === 2) {
      // Validar información de pago
      const paymentFields = ['cardNumber', 'cardHolder', 'expiryDate', 'cvv'];
      form.trigger(paymentFields as any).then(isValid => {
        if (isValid) setStep(3);
      });
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return {
    form,
    step,
    isProcessing,
    onSubmit,
    nextStep,
    prevStep,
    formatCardNumber,
    formatExpiryDate,
    validateCardNumber,
    detectCardType,
  };
}
