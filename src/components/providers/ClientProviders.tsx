'use client';

import React from 'react';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import AppLayout from '../layout/AppLayout';

interface ClientProvidersProps {
  readonly children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
    </div>;
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <AppLayout>
          {children}
        </AppLayout>
      </WishlistProvider>
    </CartProvider>
  );
}
