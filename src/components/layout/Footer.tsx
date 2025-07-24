import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">StyleHub</h3>
            <p className="text-gray-300">
              Descubre las últimas tendencias en moda con ropa y accesorios de calidad premium.
            </p>
            <div className="flex space-x-4">
              <Facebook size={20} className="text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Instagram size={20} className="text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Twitter size={20} className="text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Youtube size={20} className="text-gray-400 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h4 className="font-semibold mb-4">Tienda</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/category/women" className="hover:text-white transition-colors">Mujeres</Link></li>
              <li><Link href="/category/men" className="hover:text-white transition-colors">Hombres</Link></li>
              <li><Link href="/category/accessories" className="hover:text-white transition-colors">Accesorios</Link></li>
              <li><Link href="/category/shoes" className="hover:text-white transition-colors">Zapatos</Link></li>
              <li><Link href="/sale" className="hover:text-white transition-colors">Ofertas</Link></li>
            </ul>
          </div>

          {/* Atención al Cliente */}
          <div>
            <h4 className="font-semibold mb-4">Atención al Cliente</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contáctanos</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Información de Envío</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Devoluciones</Link></li>
              <li><Link href="/size-guide" className="hover:text-white transition-colors">Guía de Tallas</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/about" className="hover:text-white transition-colors">Acerca de Nosotros</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Carreras</Link></li>
              <li><Link href="/press" className="hover:text-white transition-colors">Prensa</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Términos de Servicio</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2025 StyleHub. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}