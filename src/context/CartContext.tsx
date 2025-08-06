'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  producto: {
    id: string;
    name: string;
    price: number;
    original_price?: number;
    images: string[];
    category_id: string;
    brand?: string;
    gender?: string;
  };
  variant?: {
    id: string;
    color: string;
    size: string;
    stock: number;
  };
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const CartContext = createContext<{
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  itemsCount: number;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id
      );

      if (existingItemIndex > -1) {
        // Item already exists, update quantity
        const updatedItems = [...state.items];
        const newQuantity = updatedItems[existingItemIndex].quantity + action.payload.quantity;
        
        // Check stock limit
        const maxStock = action.payload.variant?.stock || 10;
        if (newQuantity > maxStock) {
          toast.error(`Solo hay ${maxStock} unidades disponibles`);
          return state;
        }
        
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity,
        };
        
        toast.success('Cantidad actualizada en el carrito');
        return { ...state, items: updatedItems };
      } else {
        // New item
        toast.success('Producto agregado al carrito');
        return { ...state, items: [...state.items, action.payload] };
      }
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      toast.success('Producto removido del carrito');
      return { ...state, items: updatedItems };
    }

    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item => {
        if (item.id === action.payload.id) {
          // Check stock limit
          const maxStock = item.variant?.stock || 10;
          if (action.payload.quantity > maxStock) {
            toast.error(`Solo hay ${maxStock} unidades disponibles`);
            return item;
          }
          
          if (action.payload.quantity <= 0) {
            return null; // Remove item if quantity is 0 or negative
          }
          
          return { ...item, quantity: action.payload.quantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];

      return { ...state, items: updatedItems };
    }

    case 'CLEAR_CART':
      toast.success('Carrito vaciado');
      return { ...state, items: [] };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'SET_CART':
      return { ...state, items: action.payload };

    case 'LOAD_CART':
      return { ...state, items: action.payload };

    default:
      return state;
  }
};

const CART_STORAGE_KEY = 'stylehub_cart';

const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return [];
  }
};

const saveCartToStorage = (items: CartItem[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

export function CartProvider({ children }: { readonly children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
  });

  // Load cart from storage on mount
  useEffect(() => {
    const savedCart = loadCartFromStorage();
    if (savedCart.length > 0) {
      dispatch({ type: 'LOAD_CART', payload: savedCart });
    }
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    saveCartToStorage(state.items);
  }, [state.items]);

  const addItem = (item: CartItem) => {
    // Validate item
    if (!item.producto?.id || !item.producto?.name || !item.producto?.price) {
      toast.error('Producto inválido');
      return;
    }

    if (item.quantity <= 0) {
      toast.error('Cantidad debe ser mayor a 0');
      return;
    }

    // Check stock
    if (item.variant && item.quantity > item.variant.stock) {
      toast.error(`Solo hay ${item.variant.stock} unidades disponibles`);
      return;
    }

    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: id });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  // Calculate totals
  const subtotal = state.items.reduce(
    (sum, item) => sum + (item.producto.price * item.quantity),
    0
  );

  const tax = subtotal * 0.12; // 12% IVA Ecuador
  const shipping = subtotal >= 50 ? 0 : 5; // Free shipping over $50 USD
  const total = subtotal + tax + shipping;

  const itemsCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(() => ({
    state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    itemsCount,
    total,
    subtotal,
    tax,
    shipping,
  }), [state, itemsCount, total, subtotal, tax, shipping]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}