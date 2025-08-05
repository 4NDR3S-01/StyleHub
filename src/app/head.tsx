export default function Head() {
  return (
    <>
      <title>StyleHub - Tu Tienda de Moda Online | Ropa, Accesorios y Más</title>
      <meta name="description" content="StyleHub - Descubre las últimas tendencias en moda. Ropa, accesorios y calzado para hombres y mujeres. Envío gratis en pedidos superiores a $100.000. ¡Compra con confianza!" />
      <meta name="keywords" content="moda, ropa, accesorios, calzado, tienda online, fashion, estilo, tendencias, compras online, Colombia" />
      <meta name="author" content="StyleHub" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="es" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://stylehub.com/" />
      <meta property="og:title" content="StyleHub - Tu Tienda de Moda Online" />
      <meta property="og:description" content="Descubre las últimas tendencias en moda. Ropa, accesorios y calzado para hombres y mujeres. Envío gratis en pedidos superiores a $100.000." />
      <meta property="og:image" content="https://stylehub.com/og-image.jpg" />
      <meta property="og:site_name" content="StyleHub" />
      <meta property="og:locale" content="es_CO" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content="https://stylehub.com/" />
      <meta property="twitter:title" content="StyleHub - Tu Tienda de Moda Online" />
      <meta property="twitter:description" content="Descubre las últimas tendencias en moda. Ropa, accesorios y calzado para hombres y mujeres." />
      <meta property="twitter:image" content="https://stylehub.com/twitter-image.jpg" />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      
      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Canonical URL */}
      <link rel="canonical" href="https://stylehub.com/" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://js.stripe.com" />
      <link rel="preconnect" href="https://www.paypal.com" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//js.stripe.com" />
      <link rel="dns-prefetch" href="//www.paypal.com" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#ff6f61" />
      <meta name="msapplication-TileColor" content="#ff6f61" />
      
      {/* Additional SEO */}
      <meta name="geo.region" content="CO" />
      <meta name="geo.placename" content="Colombia" />
      <meta name="geo.position" content="4.7110;-74.0721" />
      <meta name="ICBM" content="4.7110, -74.0721" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "StyleHub",
            "url": "https://stylehub.com",
            "logo": "https://stylehub.com/logo.png",
            "description": "Tienda de moda online con las últimas tendencias en ropa, accesorios y calzado",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "CO",
              "addressRegion": "Bogotá"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+57-1-XXX-XXXX",
              "contactType": "customer service",
              "availableLanguage": "Spanish"
            },
            "sameAs": [
              "https://facebook.com/stylehub",
              "https://instagram.com/stylehub",
              "https://twitter.com/stylehub"
            ]
          })
        }}
      />
    </>
  );
}
