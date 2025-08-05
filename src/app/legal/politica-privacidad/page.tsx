'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Política de Privacidad
          </h1>
          <p className="text-lg text-gray-600">
            Última actualización: {new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Introducción
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                En StyleHub, nos comprometemos a proteger tu privacidad y tus datos personales. 
                Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y 
                protegemos tu información cuando utilizas nuestro sitio web y servicios.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Al utilizar nuestros servicios, aceptas las prácticas descritas en esta política. 
                Si no estás de acuerdo con alguna parte de esta política, te recomendamos no 
                utilizar nuestros servicios.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información que recopilamos
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold text-gray-900 mb-3">Información personal que proporcionas:</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Nombre completo y apellidos</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Dirección de envío y facturación</li>
                <li>Información de pago (procesada de forma segura por nuestros proveedores de pago)</li>
                <li>Información de la cuenta y preferencias</li>
              </ul>

              <h4 className="font-semibold text-gray-900 mb-3 mt-6">Información que recopilamos automáticamente:</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Dirección IP y ubicación geográfica</li>
                <li>Información del navegador y dispositivo</li>
                <li>Páginas visitadas y tiempo de navegación</li>
                <li>Cookies y tecnologías similares</li>
                <li>Datos de uso y analíticas</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Cómo utilizamos tu información
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Utilizamos tu información para los siguientes propósitos:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Procesar y completar tus pedidos</li>
                <li>Proporcionar servicio al cliente y soporte</li>
                <li>Enviar confirmaciones de pedido y actualizaciones de estado</li>
                <li>Comunicar ofertas especiales y promociones (con tu consentimiento)</li>
                <li>Mejorar nuestros productos y servicios</li>
                <li>Prevenir fraudes y garantizar la seguridad</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Personalizar tu experiencia de compra</li>
              </ul>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compartir información
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                No vendemos, alquilamos ni compartimos tu información personal con terceros, 
                excepto en las siguientes circunstancias:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Proveedores de servicios:</strong> Compartimos información con proveedores 
                de pago, servicios de envío y otros socios comerciales necesarios para completar tu pedido.</li>
                <li><strong>Cumplimiento legal:</strong> Podemos divulgar información cuando sea requerido 
                por ley o para proteger nuestros derechos y seguridad.</li>
                <li><strong>Con tu consentimiento:</strong> Solo compartimos información adicional con 
                tu consentimiento explícito.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Seguridad de datos
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Encriptación SSL/TLS para todas las transmisiones de datos</li>
                <li>Almacenamiento seguro en servidores protegidos</li>
                <li>Acceso restringido a información personal</li>
                <li>Monitoreo regular de seguridad</li>
                <li>Actualizaciones regulares de sistemas de seguridad</li>
              </ul>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cookies y tecnologías similares
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Recordar tus preferencias y configuración</li>
                <li>Analizar el uso del sitio web</li>
                <li>Mejorar la funcionalidad y rendimiento</li>
                <li>Proporcionar contenido personalizado</li>
                <li>Garantizar la seguridad de la sesión</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Puedes controlar las cookies a través de la configuración de tu navegador, 
                aunque esto puede afectar la funcionalidad del sitio.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Tus derechos
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Tienes los siguientes derechos respecto a tu información personal:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Acceso:</strong> Solicitar una copia de tu información personal</li>
                <li><strong>Rectificación:</strong> Corregir información inexacta o incompleta</li>
                <li><strong>Eliminación:</strong> Solicitar la eliminación de tu información</li>
                <li><strong>Portabilidad:</strong> Recibir tu información en formato estructurado</li>
                <li><strong>Oposición:</strong> Oponerte al procesamiento de tu información</li>
                <li><strong>Limitación:</strong> Solicitar la limitación del procesamiento</li>
                <li><strong>Retirada del consentimiento:</strong> Retirar el consentimiento en cualquier momento</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Retención de datos
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Conservamos tu información personal solo durante el tiempo necesario para los 
                propósitos para los que fue recopilada, incluyendo obligaciones legales, 
                contables o de informes. Los datos de la cuenta se conservan mientras tu 
                cuenta esté activa y hasta 7 años después de su cierre para cumplir con 
                obligaciones fiscales y legales.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidad de menores
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos 
                intencionalmente información personal de menores de edad. Si eres padre o 
                tutor y crees que tu hijo nos ha proporcionado información personal, 
                contáctanos inmediatamente.
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Transferencias internacionales
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Tu información puede ser transferida y procesada en países diferentes al tuyo. 
                Nos aseguramos de que estas transferencias cumplan con las leyes de protección 
                de datos aplicables y que se implementen las medidas de seguridad adecuadas.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cambios en esta política
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos 
                sobre cualquier cambio significativo por correo electrónico o mediante un 
                aviso prominente en nuestro sitio web. Te recomendamos revisar esta política 
                periódicamente.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Información de contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Si tienes preguntas sobre esta Política de Privacidad o sobre el procesamiento 
                de tus datos personales, contáctanos:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> privacidad@stylehub.com</p>
                <p className="text-gray-700"><strong>Teléfono:</strong> +57 300 123 4567</p>
                <p className="text-gray-700"><strong>Dirección:</strong> Calle 123 #45-67, Bogotá, Colombia</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contacto">
              <Button variant="outline">
                Contactar soporte
              </Button>
            </Link>
            <Link href="/legal/terminos-servicio">
              <Button variant="outline">
                Ver términos de servicio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 