/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Configuración para manejar timeouts de Google Fonts
  experimental: {
    fontLoaders: [
      {
        loader: '@next/font/google',
        options: {
          timeout: 10000, // 10 segundos de timeout
          retries: 3,
        },
      },
    ],
  },
};

module.exports = nextConfig;
