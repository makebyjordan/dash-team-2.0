/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['picsum.photos', 'docs.google.com'],
  },
  // Producción
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  // Optimizaciones
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
