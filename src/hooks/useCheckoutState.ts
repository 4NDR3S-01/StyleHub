import { useState, useCallback } from 'react';

export interface CheckoutState {
  orderId: string | null;
  pendingPayment: boolean;
  loading: boolean;
  error: string | null;
}

export interface CheckoutActions {
  setOrderId: (id: string | null) => void;
  setPendingPayment: (pending: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
  handleOrderCreated: (orderId: string) => void;
  handlePaymentCompleted: () => void;
  handleError: (error: string) => void;
}

const initialState: CheckoutState = {
  orderId: null,
  pendingPayment: false,
  loading: false,
  error: null,
};

export function useCheckoutState(): CheckoutState & CheckoutActions {
  const [state, setState] = useState<CheckoutState>(initialState);

  const setOrderId = useCallback((orderId: string | null) => {
    setState(prev => ({ ...prev, orderId }));
  }, []);

  const setPendingPayment = useCallback((pendingPayment: boolean) => {
    setState(prev => ({ ...prev, pendingPayment }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  const handleOrderCreated = useCallback((orderId: string) => {
    setState(prev => ({
      ...prev,
      orderId,
      pendingPayment: true,
      loading: false,
      error: null,
    }));
  }, []);

  const handlePaymentCompleted = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingPayment: false,
      loading: false,
      error: null,
    }));
  }, []);

  const handleError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      loading: false,
      error,
      orderId: null,
      pendingPayment: false,
    }));
  }, []);

  return {
    ...state,
    setOrderId,
    setPendingPayment,
    setLoading,
    setError,
    resetState,
    handleOrderCreated,
    handlePaymentCompleted,
    handleError,
  };
}
