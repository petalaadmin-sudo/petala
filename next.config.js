/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // só ativa PWA em produção
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // cache de páginas navegadas
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'petala-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
})

const nextConfig = {
  images: {
    domains: [
      'pub-*.r2.dev',           // Cloudflare R2 público
      '*.supabase.co',           // Supabase Storage fallback
    ],
  },
  // headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
