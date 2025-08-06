// Importación de componentes principales de la página de inicio
import HeroPrincipal from '../components/home/HeroPrincipal';
import FeaturedProducts from '../components/home/FeaturedProducts';
import Categories from '../components/home/Categories';
import Newsletter from '../components/home/Newsletter';
import Testimonials from '../components/home/Testimonios';

/**
 * Página principal de StyleHub
 * Estructura la landing page con todos los componentes principales
 * en el orden de importancia visual y de experiencia de usuario
 */
export default function Home() {
  return (
    <>
      {/* Sección hero principal - Primera impresión del usuario */}
      <HeroPrincipal />
      
      {/* Categorías principales - Navegación rápida por productos */}
      <Categories />
      
      {/* Productos destacados - Showcase de los mejores productos */}
      <FeaturedProducts />
      
      {/* Testimonios de clientes - Social proof y confianza */}
      <Testimonials />
      
      {/* Newsletter - Captura de leads y engagement */}
      <Newsletter />
    </>
  );
}