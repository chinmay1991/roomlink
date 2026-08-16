const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Hotel-side app carries guest/staff data — cache the static app shell
  // only, never authenticated API responses. Mirrors apps/super-admin.
  runtimeCaching: [
    {
      urlPattern: /^\/api\/.*/,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'roomlink-hotel-app-shell',
        expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // apps/hotel-admin imports @roomlink/db and @roomlink/ui from outside its
  // own directory (npm workspace packages) — Next.js must be told to
  // transpile them rather than treat them as pre-built.
  transpilePackages: ['@roomlink/db', '@roomlink/ui'],
}

module.exports = withPWA(nextConfig)
