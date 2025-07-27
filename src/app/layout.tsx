
'use client';
import './globals.css';
import { usePathname } from 'next/navigation';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { inter } from '../lib/fonts';

export default function RootLayout(props: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col">
              {!isAdmin && <Navbar />}
              <main className="flex-1">
                {props.children}
              </main>
              {!isAdmin && <Footer />}
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}