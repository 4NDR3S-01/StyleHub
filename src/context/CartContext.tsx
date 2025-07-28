'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem, productos } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: productos; size: string; color: string } }
  | { type: 'REMOVE_ITEM'; payload: string } // formato: "productId-size-color"
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } } // formato: "productId-size-color"
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addToCart: (product: productos, size: string, color: string) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  itemsCount: number;
  totalPrice: number;
} | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(
        item => 
          item.producto.id === action.payload.product.id && 
          item.size === action.payload.size && 
          item.color === action.payload.color
      );

      if (existingItem) {
        // Verificar stock antes de incrementar
        if (existingItem.quantity < action.payload.product.stock) {
          return {
            ...state,
            items: state.items.map(item =>
              item.producto.id === action.payload.product.id &&
              item.size === action.payload.size &&
              item.color === action.payload.color
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          };
        }
        return state; // No modificar si no hay stock
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            producto: action.payload.product,
            quantity: 1,
            size: action.payload.size,
            color: action.payload.color,
          },
        ],
      };

    case 'REMOVE_ITEM':
      const [productId, size, color] = action.payload.split('-');
      return {
        ...state,
        items: state.items.filter(item => {
          if (size === '' && color === '') {
            // Remover todos los items del producto
            return item.producto.id !== productId;
          }
          // Remover item específico por producto, talla y color
          return !(item.producto.id === productId && 
                   item.size === size && 
                   item.color === color);
        }),
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item => {
          const itemKey = `${item.producto.id}-${item.size}-${item.color}`;
          return itemKey === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item;
        }),
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };

    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      };

    case 'OPEN_CART':
      return {
        ...state,
        isOpen: true,
      };

    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false,
      };

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
  });

  const addToCart = (product: productos, size: string, color: string) => {
    // Verificar stock disponible
    const currentQuantity = state.items.find(
      item => item.producto.id === product.id && 
               item.size === size && 
               item.color === color
    )?.quantity || 0;
    
    if (currentQuantity < product.stock) {
      dispatch({ type: 'ADD_ITEM', payload: { product, size, color } });
    } else {
      console.warn('Producto sin stock suficiente');
    }
  };

  const removeFromCart = (productId: string, size?: string, color?: string) => {
    if (size && color) {
      dispatch({ type: 'REMOVE_ITEM', payload: `${productId}-${size}-${color}` });
    } else {
      // Remover todos los items del producto (compatibilidad hacia atrás)
      dispatch({ type: 'REMOVE_ITEM', payload: `${productId}--` });
    }
  };

  const updateQuantity = (productId: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
    } else {
      const itemId = size && color ? `${productId}-${size}-${color}` : productId;
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const openCart = () => {
    dispatch({ type: 'OPEN_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const itemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (total, item) => total + item.producto.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        itemsCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}