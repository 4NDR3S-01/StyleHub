'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Términos de Servicio
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
                <FileText className="h-5 w-5" />
                Introducción
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Bienvenido a StyleHub. Estos Términos de Servicio rigen el uso de nuestro 
                sitio web y servicios. Al acceder o utilizar nuestros servicios, aceptas 
                estar sujeto a estos términos y condiciones.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar 
                nuestros servicios. Te recomendamos leer estos términos cuidadosamente antes 
                de realizar una compra.
              </p>
            </CardContent>
          </Card>

          {/* Definitions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Definiciones
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">"Servicio"</h4>
                  <p className="text-gray-700">Se refiere al sitio web StyleHub y todos los servicios relacionados.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">"Usuario"</h4>
                  <p className="text-gray-700">Cualquier persona que acceda o utilice nuestro servicio.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">"Contenido"</h4>
                  <p className="text-gray-700">Toda la información, texto, imágenes, videos y otros materiales en nuestro sitio.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">"Pedido"</h4>
                  <p className="text-gray-700">Una solicitud de compra de productos a través de nuestro servicio.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Registro de cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Para realizar compras, debes crear una cuenta proporcionando información 
                precisa y completa. Eres responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Mantener la confidencialidad de tu contraseña</li>
                <li>Todas las actividades que ocurran bajo tu cuenta</li>
                <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
                <li>Proporcionar información actualizada y precisa</li>
                <li>Ser mayor de 18 años o tener consentimiento parental</li>
              </ul>
            </CardContent>
          </Card>

          {/* Products and Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Productos y servicios
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Vendemos productos de moda y accesorios. Nos reservamos el derecho de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Modificar o descontinuar productos en cualquier momento</li>
                <li>Limitar la cantidad de productos por pedido</li>
                <li>Rechazar pedidos por cualquier motivo</li>
                <li>Corregir errores en precios o descripciones</li>
                <li>Actualizar información de productos sin previo aviso</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Los precios están en pesos colombianos (COP) e incluyen IVA. 
                Los precios pueden cambiar sin previo aviso.
              </p>
            </CardContent>
          </Card>

          {/* Orders and Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Pedidos y pagos
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold text-gray-900 mb-3">Proceso de pedido:</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Selecciona productos y agrégalos al carrito</li>
                <li>Revisa tu pedido y proporciona información de envío</li>
                <li>Selecciona método de pago y completa la transacción</li>
                <li>Recibirás confirmación por email</li>
              </ul>

              <h4 className="font-semibold text-gray-900 mb-3 mt-6">Métodos de pago:</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Tarjetas de crédito y débito</li>
                <li>PayPal</li>
                <li>Transferencias bancarias</li>
                <li>Pago contra entrega (zonas seleccionadas)</li>
              </ul>

              <h4 className="font-semibold text-gray-900 mb-3 mt-6">Confirmación:</h4>
              <p className="text-gray-700 leading-relaxed">
                Los pedidos se procesan después de confirmar el pago. 
                Te enviaremos actualizaciones sobre el estado de tu pedido.
              </p>
            </CardContent>
          </Card>

          {/* Shipping and Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Envío y entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold text-gray-900 mb-3">Tiempos de envío:</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Envío estándar: 3-5 días hábiles</li>
                <li>Envío express: 1-2 días hábiles</li>
                <li>Los tiempos pueden variar según la ubicación</li>
              </ul>

              <h4 className="font-semibold text-gray-900 mb-3 mt-6">Costos de envío:</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Envío gratuito en pedidos superiores a $100.000</li>
                <li>Envío estándar: $15.000</li>
                <li>Envío express: $25.000</li>
              </ul>

              <h4 className="font-semibold text-gray-900 mb-3 mt-6">Entrega:</h4>
              <p className="text-gray-700 leading-relaxed">
                Los pedidos se entregan en la dirección proporcionada. 
                Es responsabilidad del cliente proporcionar una dirección válida 
                y estar disponible para recibir el pedido.
              </p>
            </CardContent>
          </Card>

          {/* Returns and Refunds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Devoluciones y reembolsos
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h4 className="font-semibold text-gray-900 mb-3">Política de devoluciones:</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Plazo: 30 días desde la recepción</li>
                <li>Productos deben estar en estado original</li>
                <li>Etiquetas y empaque original intactos</li>
                <li>No se aceptan productos personalizados o usados</li>
              </ul>

              <h4 className="font-semibold text-gray-900 mb-3 mt-6">Proceso de devolución:</h4>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Contacta nuestro servicio al cliente</li>
                <li>Proporciona número de pedido y motivo</li>
                <li>Recibirás etiqueta de envío de retorno</li>
                <li>Envía el producto en 7 días</li>
                <li>Procesamos el reembolso en 5-10 días hábiles</li>
              </ol>

              <h4 className="font-semibold text-gray-900 mb-3 mt-6">Reembolsos:</h4>
              <p className="text-gray-700 leading-relaxed">
                Los reembolsos se procesan al método de pago original. 
                Los costos de envío no son reembolsables.
              </p>
            </CardContent>
          </Card>

          {/* User Conduct */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Conducta del usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                Al utilizar nuestro servicio, aceptas no:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Usar el servicio para actividades ilegales</li>
                <li>Intentar acceder a sistemas sin autorización</li>
                <li>Interferir con el funcionamiento del sitio</li>
                <li>Proporcionar información falsa o engañosa</li>
                <li>Violar derechos de propiedad intelectual</li>
                <li>Enviar spam o contenido inapropiado</li>
                <li>Usar bots o scripts automatizados</li>
              </ul>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Propiedad intelectual
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Todo el contenido de nuestro sitio web, incluyendo textos, imágenes, 
                logos, diseños y software, está protegido por derechos de autor y 
                otras leyes de propiedad intelectual. No está permitido copiar, 
                distribuir o modificar este contenido sin autorización expresa.
              </p>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidad y datos
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Tu privacidad es importante para nosotros. Recopilamos y utilizamos 
                tu información personal de acuerdo con nuestra Política de Privacidad. 
                Al utilizar nuestro servicio, aceptas el procesamiento de tus datos 
                según lo descrito en dicha política.
              </p>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Limitación de responsabilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                En la máxima medida permitida por la ley, StyleHub no será responsable por:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Daños indirectos, incidentales o consecuentes</li>
                <li>Pérdida de beneficios o datos</li>
                <li>Interrupciones del servicio</li>
                <li>Errores en información de productos</li>
                <li>Problemas de envío fuera de nuestro control</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Nuestra responsabilidad total no excederá el monto pagado por el producto.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Descargos de responsabilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                El servicio se proporciona "tal como está" sin garantías de ningún tipo. 
                No garantizamos que el servicio sea ininterrumpido, seguro o libre de errores. 
                Los productos se venden sin garantías adicionales más allá de las garantías 
                legales aplicables.
              </p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Terminación
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Podemos suspender o terminar tu acceso al servicio en cualquier momento 
                por violación de estos términos. También puedes cancelar tu cuenta en 
                cualquier momento. Las disposiciones que por su naturaleza deben sobrevivir 
                a la terminación permanecerán en vigor.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Cambios en los términos
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                Los cambios entrarán en vigor inmediatamente después de su publicación. 
                Te notificaremos sobre cambios significativos por email. El uso continuado 
                del servicio constituye aceptación de los términos modificados.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Ley aplicable
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Estos términos se rigen por las leyes de Colombia. Cualquier disputa 
                será resuelta en los tribunales competentes de Bogotá, Colombia. 
                Si alguna disposición es inválida, las demás permanecerán en vigor.
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
                Si tienes preguntas sobre estos términos, contáctanos:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> legal@stylehub.com</p>
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
            <Link href="/legal/politica-privacidad">
              <Button variant="outline">
                Ver política de privacidad
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 