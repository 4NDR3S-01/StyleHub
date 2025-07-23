'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    setIsSubscribed(true);
    setEmail('');
  };

  return (
    <section className="py-16 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Mail size={48} className="mx-auto mb-6 text-amber-400" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stay in Style
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new collections, exclusive offers, and style tips
          </p>

          {isSubscribed ? (
            <div className="max-w-md mx-auto">
              <div className="bg-green-600 text-white px-6 py-3 rounded-full">
                Thank you for subscribing! 🎉
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-6 py-3 rounded-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-full font-semibold transition-colors duration-300"
                >
                  Subscribe
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}