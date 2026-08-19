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
  // Every route's JS chunk (~60-70 files) was being precached eagerly the
  // moment the service worker installed — on first login and on every
  // deploy — competing for bandwidth with the page the user actually asked
  // for. The NetworkFirst rule above already caches each chunk the first
  // time it's requested, so precaching only needs to warm the handful of
  // files every page depends on (framework/webpack/polyfills + CSS/fonts),
  // not every page in the app.
  buildExcludes: [/chunks\/app\/.*\.js$/, /chunks\/pages\/.*\.js$/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // apps/hotel-admin imports @roomlink/db and @roomlink/ui from outside its
  // own directory (npm workspace packages) — Next.js must be told to
  // transpile them rather than treat them as pre-built.
  transpilePackages: ['@roomlink/db', '@roomlink/ui'],
}

module.exports = withPWA(nextConfig)
