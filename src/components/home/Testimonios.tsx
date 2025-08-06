'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { getApprovedTestimonials } from '@/services/testimonial.service';
import { getApprovedReviewsForTestimonials } from '@/services/review.service';

interface Testimonial {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  text: string;
  created_at: string;
  product_name?: string; // Para reseñas de productos
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTestimonials() {
      try {
        // Combinar testimonios tradicionales y reseñas aprobadas
        const [testimonialsData, reviewsData] = await Promise.all([
          getApprovedTestimonials(3),
          getApprovedReviewsForTestimonials(3)
        ]);
        
        // Combinar y ordenar por fecha
        const allTestimonials = [...testimonialsData, ...reviewsData]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6); // Mostrar máximo 6
          
        setTestimonials(allTestimonials);
      } catch (error) {
        console.error('Error loading testimonials:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTestimonials();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg mb-4">
              Lo Que Dicen Nuestros Clientes
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              No solo confíes en nuestra palabra - escucha a nuestros clientes satisfechos
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-lg animate-pulse">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="flex">
                      {[...Array(5)].map((_, starIdx) => (
                        <div key={`placeholder-star-${i}-${starIdx}`} className="w-4 h-4 bg-gray-200 rounded mr-1"></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null; // Don't show testimonials section if no testimonials
  }

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg mb-4">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            No solo confíes en nuestra palabra - escucha a nuestros clientes satisfechos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.avatar || '/default-avatar.png'}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.png';
                  }}
                />
                <div>
                  <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                  {testimonial.product_name && (
                    <p className="text-xs text-slate-500">Dejo una reseña a: {testimonial.product_name}</p>
                  )}
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={`${testimonial.id}-star-${i}`} size={16} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 italic">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}