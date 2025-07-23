import Hero from '@/components/home/Hero';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import Categories from '@/components/home/Categories';
import Newsletter from '@/components/home/Newsletter';
import Testimonials from '@/components/home/Testimonials';

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <Testimonials />
      <Newsletter />
    </>
  );
}