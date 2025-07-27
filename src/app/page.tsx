import HeroPrincipal from '../components/home/HeroPrincipal';
import FeaturedProducts from '../components/home/FeaturedProducts';
import Categories from '../components/home/Categories';
import Newsletter from '../components/home/Newsletter';
import Testimonials from '../components/home/Testimonios';

export default function Home() {
  return (
    <>
      <HeroPrincipal />
      <Categories />
      <FeaturedProducts />
      <Testimonials />
      <Newsletter />
    </>
  );
}