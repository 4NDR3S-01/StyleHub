'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { subscribeToNewsletter } from '@/services/newsletter.service';
import { toast } from 'sonner';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Por favor ingresa tu email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    setIsSubscribing(true);
    
    try {
      await subscribeToNewsletter(email.trim().toLowerCase());
      setIsSubscribed(true);
      setEmail('');
      toast.success('¡Gracias por suscribirte! Te mantendremos informado sobre las últimas novedades.');
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      toast.error(error.message || 'Error al suscribirse. Intenta nuevamente.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <section className="py-16 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Mail size={48} className="mx-auto mb-6 text-red-500 drop-shadow-lg" />
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg mb-4">
            Mantente con Estilo
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Suscríbete a nuestro boletín y sé el primero en conocer las nuevas colecciones, ofertas exclusivas y consejos de estilo
          </p>

          {isSubscribed ? (
            <div className="max-w-md mx-auto">
              <div className="bg-green-600 text-white px-6 py-3 rounded-full">
                ¡Gracias por suscribirte! 🎉
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ingresa tu email"
                  required
                  disabled={isSubscribing}
                  className="flex-1 px-6 py-3 rounded-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="bg-[#ff6f61] hover:bg-[#d7263d] disabled:bg-gray-500 text-white px-8 py-3 rounded-full font-semibold transition-colors duration-300 shadow-lg border border-[#ff6f61] disabled:cursor-not-allowed"
                >
                  {isSubscribing ? 'Suscribiendo...' : 'Suscribirse'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}