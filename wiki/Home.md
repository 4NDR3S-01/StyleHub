# 🛍️ StyleHub - Wiki

## Descripción General
StyleHub es una plataforma de e-commerce moderna desarrollada con Next.js y TypeScript, enfocada en la venta de productos de moda y accesorios, con integración de pagos seguros y personalización de experiencia de usuario.

## Características Principales
- Catálogo de productos y categorías dinámicas
- Carrito de compras y wishlist
- Checkout seguro con Stripe y PayPal
- Gestión de usuarios y autenticación
- Panel de administración para productos, usuarios y pedidos
- Personalización de la experiencia de usuario
- Newsletter y notificaciones
- Seguridad y cumplimiento de mejores prácticas (SonarQube, validaciones, etc.)

## Instalación y Configuración
1. Clona el repositorio y ejecuta `npm install`
2. Configura las variables de entorno (`.env.local`) para Stripe, Supabase, etc.
3. Ejecuta el proyecto con `npm run dev`
4. Opcional: Configura SonarQube/SonarCloud para análisis de calidad

## Estructura del Proyecto
- `/src/app`: Páginas y rutas principales (Next.js)
- `/src/components`: Componentes reutilizables de UI y lógica
- `/src/services`: Lógica de negocio y acceso a datos
- `/src/context`: Contextos globales de React
- `/src/utils`: Utilidades y helpers
- `/script`: Scripts SQL y de migración

## Seguridad
- Validación robusta de entradas y formularios
- Integración con SonarQube/SonarCloud para análisis estático
- Cumplimiento de mejores prácticas de seguridad en backend y frontend

## Contribución
- Lee el archivo `CONTRIBUTING.md` para guías de estilo y flujo de trabajo
- Abre issues para reportar bugs o sugerir mejoras
- Haz pull requests para nuevas funcionalidades o correcciones

## Licencia
MIT License. Consulta el archivo `SECURITY.md` para más detalles.

## Contacto y Soporte
¿Dudas o problemas? Escribe a williamcabrera20@hotmail.com
