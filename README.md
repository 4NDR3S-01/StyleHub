# 🛍️ StyleHub - Tienda de Moda Online

**StyleHub** es una plataforma de e-commerce moderna y completa especializada en moda, desarrollada con Next.js 15, React 19, TypeScript y Supabase. Ofrece una experiencia de compra integral tanto para clientes como administradores.

![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.3-cyan)
![Stripe](https://img.shields.io/badge/Stripe-Payments-purple)
![SonarQube](https://img.shields.io/badge/SonarQube-Quality-orange)

## 🌟 Características Principales

### 👤 Funcionalidades de Usuario
- **Autenticación completa** con Supabase (registro, login, verificación de email)
- **Catálogo de productos** organizado por categorías (Mujeres, Hombres, Zapatos, Accesorios)
- **Carrito de compras** persistente con gestión de cantidades
- **Lista de deseos** para guardar productos favoritos
- **Sistema de búsqueda** avanzado con filtros por precio, categoría, marca
- **Sistema de reseñas** y calificaciones verificadas
- **Checkout seguro** con múltiples métodos de pago (Stripe, PayPal)
- **Gestión de direcciones** de envío y facturación
- **Historial de pedidos** completo
- **Perfil de usuario** editable
- **Newsletter** y notificaciones

### 🛡️ Panel de Administración
- **Dashboard** con métricas y analytics en tiempo real
- **Gestión de productos** (CRUD completo, variantes, stock)
- **Gestión de categorías** y subcategorías
- **Administración de pedidos** con tracking y estados
- **Gestión de usuarios** y roles
- **Sistema de cupones** y descuentos
- **Gestión de reseñas** y moderación
- **Personalización de la tienda** (temas, colores, logos)
- **Configuración de banners** y contenido promocional
- **Gestión de métodos de envío** y pago
- **Analytics avanzados** y reportes

### 🎨 Personalización
- **Sistema de temas** dinámico
- **Branding personalizable** (logos, colores, tipografías)
- **Banners configurables** para promociones
- **Footer y enlaces** personalizables
- **Redes sociales** integradas

### 💰 E-commerce Completo
- **Múltiples métodos de pago** (Stripe, PayPal)
- **Cálculo automático** de impuestos y envío
- **Sistema de cupones** con reglas avanzadas
- **Gestión de inventario** en tiempo real
- **Notificaciones de stock bajo**
- **Abandono de carrito** tracking

## 🛠️ Tecnologías

### Frontend
- **Next.js 15** - Framework React con SSR y App Router
- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de CSS utility-first
- **Radix UI** - Componentes primitivos accesibles
- **Lucide React** - Iconografía moderna
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

### Backend & Base de Datos
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos relacional
- **Row Level Security (RLS)** - Seguridad a nivel de fila
- **Real-time subscriptions** - Actualizaciones en tiempo real

### Pagos & Servicios
- **Stripe** - Procesamiento principal de pagos con tarjeta
- **PayPal** - Método de pago alternativo
- **Supabase Storage** - Almacenamiento de archivos
- **Supabase Auth** - Autenticación

### Desarrollo & Testing
- **Jest** - Framework de testing
- **Testing Library** - Utilidades de testing
- **ESLint** - Linting de código
- **SonarQube** - Análisis de calidad de código y seguridad
- **PostCSS** - Procesamiento de CSS

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm, yarn o pnpm
- Cuenta de Supabase
- Cuentas de Stripe y PayPal (opcional)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/4NDR3S-01/StyleHub.git
cd StyleHub/project
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
# o
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Completar el archivo `.env.local` con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_tu_stripe_key
STRIPE_SECRET_KEY=sk_test_tu_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret

# PayPal (opcional)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=tu_paypal_client_id
PAYPAL_CLIENT_SECRET=tu_paypal_secret

# Aplicación
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_URL=https://tu-dominio.com
```

4. **Configurar la base de datos**
```bash
# Ejecutar el script SQL en tu proyecto de Supabase
# El archivo está en: script/STYLEHUB_PRODUCTION_DATABASE.sql
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Servidor de producción
npm run lint         # Linting del código

# Testing
npm run test         # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run test:coverage # Cobertura de tests

# Análisis de Código
npm run sonar        # Análisis con SonarQube (requiere configuración)
npm run lint:fix     # Corregir problemas de linting automáticamente
```

## 📁 Estructura del Proyecto

```
project/
├── src/                    # Código fuente
│   ├── app/                    # App Router de Next.js
│   │   ├── admin/             # Panel de administración
│   │   ├── api/               # API Routes
│   │   ├── category/          # Páginas de categorías
│   │   ├── checkout/          # Proceso de compra
│   │   └── ...
│   ├── components/            # Componentes reutilizables
│   │   ├── admin/            # Componentes del admin
│   │   ├── auth/             # Componentes de autenticación
│   │   ├── cart/             # Carrito de compras
│   │   ├── ui/               # Componentes UI base
│   │   └── ...
│   ├── context/              # Context Providers
│   ├── hooks/                # Custom Hooks
│   ├── lib/                  # Utilidades y configuraciones
│   ├── services/             # Servicios de API
│   ├── types/                # Definiciones de TypeScript
│   └── utils/                # Funciones utilitarias
├── script/                   # Scripts de base de datos
├── __tests__/               # Tests
├── sonar-project.properties  # Configuración de SonarQube
└── ...
```

## 🗄️ Base de Datos

La base de datos incluye 27+ tablas organizadas en:

- **Gestión de usuarios** y autenticación
- **Catálogo de productos** con variantes y stock
- **Sistema de pedidos** completo
- **Carritos y listas de deseos**
- **Reseñas y calificaciones**
- **Cupones y descuentos**
- **Personalización** de la tienda
- **Analytics y tracking**
- **Notificaciones**
- **Newsletter y comunicaciones**

### Características de Seguridad
- **Row Level Security (RLS)** habilitado
- **Políticas de acceso** granulares
- **Autenticación JWT** con Supabase
- **Validación de datos** en frontend y backend
- **Análisis de seguridad** con SonarQube
- **Monitoreo de vulnerabilidades** continuo

## 🎯 Funcionalidades Principales

### 🛒 E-commerce Core
- Catálogo de productos con imágenes múltiples
- Variantes de producto (tallas, colores)
- Gestión de inventario en tiempo real
- Carrito persistente entre sesiones
- Checkout con cálculo de envío e impuestos
- Múltiples métodos de pago

### 📊 Analytics
- Tracking de páginas vistas
- Analytics de productos
- Seguimiento de carritos abandonados
- Métricas de ventas
- Reportes de actividad de usuarios

### 🎨 Personalización
- Temas de color personalizables
- Logos y branding dinámico
- Banners promocionales
- Configuración de footer
- Redes sociales integradas

### 🔐 Seguridad
- Autenticación robusta con Supabase
- Verificación de email
- Reset de contraseñas
- Roles de usuario (cliente/admin)
- Protección CSRF y XSS

## 🌐 Deployment

### Vercel (Recomendado)
1. Fork del repositorio
2. Conectar con Vercel
3. Configurar variables de entorno
4. Deploy automático

### Docker
```bash
# Construir imagen
docker build -t stylehub .

# Ejecutar contenedor
docker run -p 3000:3000 stylehub
```

### Manual
```bash
# Construir para producción
npm run build

# Iniciar servidor
npm start
```

## 🧪 Testing

El proyecto incluye tests comprehensivos:

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 🔍 Análisis de Código con SonarQube

El proyecto está configurado con **SonarQube** para análisis continuo de calidad y seguridad del código.

### Configuración SonarQube

El proyecto incluye configuración para SonarQube Cloud:

- **Proyecto**: `4NDR3S-01_StyleHub`
- **Organización**: `4ndr3s-01`
- **Archivo de configuración**: `sonar-project.properties`

### Características del Análisis

- **Detección de bugs** y vulnerabilidades de seguridad
- **Code smells** y problemas de mantenibilidad
- **Cobertura de código** de tests
- **Duplicación de código**
- **Métricas de complejidad**
- **Análisis de seguridad** (Security Hotspots)

### Badges de Calidad

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=4NDR3S-01_StyleHub&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=4NDR3S-01_StyleHub)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=4NDR3S-01_StyleHub&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=4NDR3S-01_StyleHub)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=4NDR3S-01_StyleHub&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=4NDR3S-01_StyleHub)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=4NDR3S-01_StyleHub&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=4NDR3S-01_StyleHub)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=4NDR3S-01_StyleHub&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=4NDR3S-01_StyleHub)

### Integración CI/CD

Para integrar SonarQube en tu pipeline CI/CD:

```yaml
# GitHub Actions example
- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## 📈 Performance

- **Lighthouse Score**: 95+ en todas las métricas
- **Core Web Vitals** optimizados
- **Lazy loading** de imágenes
- **Code splitting** automático
- **Caching** estratégico
- **Optimización de imágenes** con Next.js
- **Calidad de código** monitoreada con SonarQube
- **Security Score**: A+ en análisis de seguridad

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Andrés** - [4NDR3S-01](https://github.com/4NDR3S-01)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Radix UI](https://www.radix-ui.com/) - Componentes primitivos
- [Stripe](https://stripe.com/) - Procesamiento de pagos

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

- 📧 Email: williamcabrera20@hotmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/4NDR3S-01/StyleHub/issues)
- 📖 Documentación: [Wiki del proyecto](../../wiki)

---

⭐ Si este proyecto te ha sido útil, ¡considera darle una estrella en GitHub!
