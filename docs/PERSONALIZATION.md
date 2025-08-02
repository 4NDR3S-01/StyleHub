# Sistema de Personalización - StyleHub

## Descripción General

El sistema de personalización permite a los administradores configurar la apariencia visual y el contenido de la tienda StyleHub, incluyendo temas, colores, logos, banners, footer y redes sociales.

## Estructura del Sistema

### 1. Base de Datos

#### Tablas Principales:
- `theme_settings`: Configuración de temas y colores
- `branding_settings`: Logos y configuración de marca
- `banners`: Banners promocionales
- `footer_settings`: Configuración del pie de página
- `footer_links`: Enlaces del footer
- `social_media`: Redes sociales

#### Seguridad:
- Row Level Security (RLS) habilitado
- Políticas de lectura pública
- Políticas de administración solo para admins
- Función `is_admin()` para verificar permisos

### 2. Servicios TypeScript

#### Archivo: `/src/services/personalization.service.ts`

**Tipos principales:**
- `ThemeSettings`: Configuración de temas
- `BrandingSettings`: Configuración de marca
- `Banner`: Banners promocionales
- `FooterSettings`: Configuración del footer
- `FooterLink`: Enlaces del footer
- `SocialMedia`: Redes sociales

**Funciones principales:**
- `getActiveTheme()`: Obtiene el tema activo
- `getThemes()`: Lista todos los temas
- `saveTheme()`: Guarda un nuevo tema
- `activateTheme()`: Activa un tema específico
- `getBrandingSettings()`: Obtiene configuración de marca
- `getActiveBanners()`: Obtiene banners activos
- `uploadPersonalizationImage()`: Sube imágenes

### 3. Hooks y Contexto

#### Hook: `/src/hooks/usePersonalization.ts`
- `usePersonalization()`: Hook principal para datos de personalización
- `useTheme()`: Hook específico para temas
- `useBanners()`: Hook específico para banners

#### Contexto: `/src/context/PersonalizationContext.tsx`
- `PersonalizationProvider`: Proveedor de contexto
- `usePersonalizationContext()`: Hook del contexto
- `useThemeCSS()`: Hook para aplicar CSS del tema

### 4. Componentes de Administración

#### Dashboard Principal: `/src/components/admin/PersonalizationOverview.tsx`
- Resumen del estado de personalización
- Navegación a secciones específicas
- Estadísticas de configuración

#### Páginas de Administración:
- `/admin/personalizacion/`: Dashboard principal
- `/admin/personalizacion/temas/`: Gestión de temas
- `/admin/personalizacion/logos/`: Gestión de branding
- `/admin/personalizacion/banners/`: Gestión de banners
- `/admin/personalizacion/footer/`: Configuración del footer

## Instalación y Configuración

### 1. Migración de Base de Datos

```bash
# Ejecutar el script de migración
psql -h <host> -U <usuario> -d <base_datos> -f script/personalization-migration.sql
```

### 2. Configuración en la Aplicación

El sistema se integra automáticamente en el layout principal:

```tsx
// En layout.tsx
<PersonalizationProvider>
  <YourApp />
</PersonalizationProvider>
```

### 3. Uso en Componentes

```tsx
// Obtener tema activo
const { theme } = usePersonalizationContext();

// Obtener configuración de marca
const { branding } = usePersonalizationContext();

// Aplicar CSS del tema
const { applyThemeCSS } = useThemeCSS();
```

## Funcionalidades Principales

### 1. Gestión de Temas
- Crear temas personalizados
- Seleccionar colores (primario, secundario, acento, etc.)
- Activar/desactivar temas
- Previsualización en tiempo real

### 2. Configuración de Marca
- Subir logos (principal, favicon, footer, email)
- Configurar nombre de marca y tagline
- Descripción de la empresa

### 3. Banners Promocionales
- Crear banners para diferentes posiciones
- Configurar fechas de inicio y fin
- Enlaces y botones de acción
- Estado activo/inactivo

### 4. Configuración del Footer
- Información de la empresa
- Enlaces organizados por categorías
- Configuración de newsletter
- Enlaces a redes sociales

## API Reference

### Temas

```typescript
// Obtener tema activo
const theme = await getActiveTheme();

// Guardar nuevo tema
const newTheme = await saveTheme({
  name: 'Mi Tema',
  colors: {
    primary: '#dc2626',
    secondary: '#f59e0b',
    // ...
  }
});

// Activar tema
await activateTheme(themeId);
```

### Branding

```typescript
// Obtener configuración de marca
const branding = await getBrandingSettings();

// Guardar configuración
const newBranding = await saveBrandingSettings({
  brand_name: 'StyleHub',
  tagline: 'Tu estilo, nuestra pasión',
  description: 'Descripción de la marca'
});
```

### Banners

```typescript
// Obtener banners activos
const banners = await getActiveBanners('hero');

// Guardar nuevo banner
const banner = await saveBanner({
  title: 'Banner Promocional',
  image: 'url-imagen',
  position: 'hero',
  active: true
});
```

## Seguridad

### Row Level Security (RLS)
- Lectura pública para todos los datos de personalización
- Escritura solo para usuarios con rol 'admin'
- Función `is_admin()` para verificar permisos

### Validaciones
- Verificación de tipos TypeScript
- Validación de formatos de imagen
- Sanitización de URLs

## Troubleshooting

### Errores Comunes

1. **Error: "La tabla users debe existir"**
   - Solución: Ejecutar primero `bd.sql` antes de `personalization-migration.sql`

2. **Error: "No se pueden cargar los datos de personalización"**
   - Verificar que las políticas RLS estén configuradas
   - Comprobar que el usuario tenga permisos

3. **Imágenes no se cargan**
   - Verificar configuración de Supabase Storage
   - Comprobar bucket 'productos' existe y es público

### Logs y Depuración

```typescript
// Habilitar logs detallados
localStorage.setItem('personalization-debug', 'true');

// Verificar estado del contexto
console.log('Personalization Context:', usePersonalizationContext());
```

## Roadmap

### Funcionalidades Futuras
- [ ] Editor visual de temas
- [ ] Importar/exportar configuraciones
- [ ] Temas por temporada
- [ ] A/B testing de banners
- [ ] Personalización por categorías
- [ ] API REST para integraciones externas

## Contribución

1. Fork el repositorio
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este sistema es parte del proyecto StyleHub y está sujeto a los mismos términos de licencia.
