import { useState } from 'react';

interface CheckoutError {
  message: string;
  type: 'validation' | 'payment' | 'network' | 'order';
  field?: string;
}

export function useCheckoutError() {
  const [error, setError] = useState<CheckoutError | null>(null);

  const setValidationError = (message: string, field?: string) => {
    setError({
      message,
      type: 'validation',
      field
    });
  };

  const setPaymentError = (message: string) => {
    setError({
      message,
      type: 'payment'
    });
  };

  const setNetworkError = (message: string = 'Error de conexión. Por favor, intenta de nuevo.') => {
    setError({
      message,
      type: 'network'
    });
  };

  const setOrderError = (message: string) => {
    setError({
      message,
      type: 'order'
    });
  };

  const clearError = () => {
    setError(null);
  };

  const hasError = error !== null;

  return {
    error,
    hasError,
    setValidationError,
    setPaymentError,
    setNetworkError,
    setOrderError,
    clearError
  };
}
