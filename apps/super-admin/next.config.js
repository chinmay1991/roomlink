const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Internal admin tool with sensitive data — cache the static app shell only,
  // never authenticated API responses.
  runtimeCaching: [
    {
      urlPattern: /^\/api\/.*/,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'roomlink-app-shell',
        expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // apps/super-admin imports @roomlink/db and @roomlink/ui from outside its
  // own directory (npm workspace packages) — Next.js must be told to
  // transpile them rather than treat them as pre-built.
  transpilePackages: ['@roomlink/db', '@roomlink/ui'],
}

module.exports = withPWA(nextConfig)
