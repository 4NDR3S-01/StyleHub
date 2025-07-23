import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    rating: 5,
    text: '¡Calidad y estilo increíbles! He pedido varios artículos y siempre superan mis expectativas. El servicio al cliente también es excepcional.',
  },
  {
    id: 2,
    name: 'Michael Chen',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    rating: 5,
    text: 'StyleHub se ha convertido en mi primera opción para moda premium. Los materiales son de primera y el ajuste siempre es perfecto. ¡Muy recomendado!',
  },
  {
    id: 3,
    name: 'Emily Davis',
    avatar: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    rating: 5,
    text: 'Me encanta la variedad y calidad de los productos. Envío rápido y devoluciones fáciles hacen que comprar aquí sea una delicia. ¡Mi guardarropa nunca se ha visto mejor!',
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
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
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                  <div className="flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} className="text-amber-400 fill-current" />
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