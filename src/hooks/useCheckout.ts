import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CartItem, User } from '@/types';
import { useCart } from '@/context/CartContext';
import { PaymentService, CheckoutSessionData } from '@/services/payment.service';

// Esquema de validación
const checkoutSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres'),
  state: z.string().min(2, 'El estado debe tener al menos 2 caracteres'),
  zipCode: z.string().min(4, 'El código postal debe tener al menos 4 caracteres'),
  country: z.string().min(2, 'El país debe tener al menos 2 caracteres'),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  saveInfo: z.boolean().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface UseCheckoutProps {
  cartItems: CartItem[];
  user: User | null;
}

export function useCheckout({ cartItems, user }: UseCheckoutProps) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { clearCart } = useCart();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
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
    },
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/\D/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches?.[0] || '';
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

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/\D/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  const validateCardNumber = (cardNumber: string) => {
    const num = cardNumber.replace(/\s/g, '');
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num.charAt(i), 10);
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  };

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

      const checkoutData: CheckoutSessionData = {
        cartItems: cartItems,
        email: data.email,
        userId: user.id,
        customerData: {
          name: `${data.firstName} ${data.lastName}`,
          phone: data.phone,
          address: {
            line1: data.address,
            city: data.city,
            state: data.state,
            postal_code: data.zipCode,
            country: data.country || 'CO',
          },
        },
        metadata: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      };

      await PaymentService.processPayment(checkoutData);
      
    } catch (error) {
      console.error('Error procesando pago:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      const shippingFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'];
      form.trigger(shippingFields as any).then((isValid: boolean) => {
        if (isValid) setStep(2);
      });
    } else if (step === 2) {
      setStep(3);
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
