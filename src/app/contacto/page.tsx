'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  HelpCircle,
  Send,
  CheckCircle
} from 'lucide-react';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: 'general' | 'support' | 'sales' | 'technical' | 'other';
}

const faqData = [
  {
    question: "¿Cómo puedo rastrear mi pedido?",
    answer: "Puedes rastrear tu pedido desde tu cuenta en la sección 'Mis Pedidos'. También recibirás actualizaciones por email cuando el estado de tu pedido cambie."
  },
  {
    question: "¿Cuál es la política de devoluciones?",
    answer: "Aceptamos devoluciones dentro de los 30 días posteriores a la compra. Los productos deben estar en su estado original y con todas las etiquetas."
  },
  {
    question: "¿Ofrecen envío gratuito?",
    answer: "Sí, ofrecemos envío gratuito en pedidos superiores a $100.000. Para pedidos menores, el costo de envío es de $15.000."
  },
  {
    question: "¿Cuánto tiempo tarda el envío?",
    answer: "El tiempo de envío estándar es de 3-5 días hábiles dentro de Colombia. Para envíos express (1-2 días) hay un costo adicional."
  },
  {
    question: "¿Puedo cambiar o cancelar mi pedido?",
    answer: "Puedes cancelar tu pedido dentro de las primeras 2 horas después de la compra. Para cambios, contáctanos inmediatamente."
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer: "Aceptamos tarjetas de crédito/débito, PayPal, transferencias bancarias y pagos contra entrega en algunas zonas."
  }
];

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "contacto@stylehub.com",
    description: "Respuesta en 24 horas"
  },
  {
    icon: Phone,
    title: "Teléfono",
    value: "+57 300 123 4567",
    description: "Lun-Vie 8:00 AM - 6:00 PM"
  },
  {
    icon: MapPin,
    title: "Oficina",
    value: "Calle 123 #45-67, Bogotá",
    description: "Colombia"
  },
  {
    icon: Clock,
    title: "Horarios",
    value: "Lunes a Viernes",
    description: "8:00 AM - 6:00 PM"
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSubmitted(true);
    setLoading(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
      });
    }, 3000);
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contáctanos
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Encuentra la información de contacto y envíanos tu consulta.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Envíanos un mensaje
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      ¡Mensaje enviado!
                    </h3>
                    <p className="text-gray-600">
                      Gracias por contactarnos. Te responderemos en las próximas 24 horas.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre completo *
                        </label>
                        <Input
                          required
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="tu@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asunto *
                      </label>
                      <Input
                        required
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="¿En qué podemos ayudarte?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de consulta
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">Consulta general</option>
                        <option value="support">Soporte técnico</option>
                        <option value="sales">Ventas</option>
                        <option value="technical">Problemas técnicos</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mensaje *
                      </label>
                      <Textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Describe tu consulta en detalle..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send size={16} />
                      )}
                      {loading ? 'Enviando...' : 'Enviar mensaje'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contactInfo.map((info) => (
                <Card key={info.title}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <info.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{info.title}</h3>
                        <p className="text-gray-900">{info.value}</p>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Soporte rápido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Chat en vivo</p>
                      <p className="text-sm text-gray-600">Disponible 24/7</p>
                    </div>
                    <Badge variant="secondary">En línea</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">WhatsApp</p>
                      <p className="text-sm text-gray-600">Respuesta inmediata</p>
                    </div>
                    <Badge variant="secondary">+57 300 123 4567</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Preguntas frecuentes
            </h2>
            <p className="text-gray-600">
              Encuentra respuestas rápidas a las preguntas más comunes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqData.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              ¿Necesitas ayuda urgente?
            </h3>
            <p className="text-blue-100 mb-6">
              Para problemas urgentes, contáctanos directamente por teléfono o WhatsApp
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" className="flex items-center gap-2">
                <Phone size={16} />
                Llamar ahora
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <MessageCircle size={16} />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 