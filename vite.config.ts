/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// PWA strategy (see docs/security/security-model.md):
// - PUBLIC educational content is precached / runtime-cached in the service worker.
// - PRIVATE child records are NEVER cached by the service worker; they live only in
//   authenticated in-memory / IndexedDB storage keyed to the signed-in session.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    rollupOptions: {
      output: {
        // src/content/seed (bulk static content data) and src/evidence (the
        // reference registry) are each only imported by lazy-loaded staff
        // screens. Keep each authored seed module in its own chunk so the
        // library data does not produce one oversized JavaScript asset.
        manualChunks(id) {
          const seedMarker = '/src/content/seed/';
          const seedStart = id.indexOf(seedMarker);
          if (seedStart !== -1) {
            const seedModule = id
              .slice(seedStart + seedMarker.length)
              .replace(/\.tsx?$/, '')
              .replace(/\/index$/, '')
              .replace(/[^a-zA-Z0-9_-]+/g, '-');
            return `content-seed-${seedModule || 'index'}`;
          }
          if (id.includes('/src/evidence/')) return 'evidence';
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      // Registration is controlled at runtime. The web app registers normally,
      // while the packaged Capacitor app removes legacy PWA caches so an older
      // shell can never be mixed with the current Android bundle.
      injectRegister: null,
      // Activate a new application shell as soon as a deployment is available.
      // `prompt` was previously used without rendering an update prompt, which
      // could leave Safari displaying an old sign-in screen indefinitely.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'ACE Child Grow',
        short_name: 'ACE Grow',
        description: 'Every Child Can Grow — bilingual early-childhood development support',
        lang: 'my',
        theme_color: '#4DA8FF',
        background_color: '#F5FAFD',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        // The Myanmar font is precached with the rest of the shell. Workbox's
        // default glob does not include font files, so offline the stylesheet
        // was cached while the glyphs it names were not — the app would open
        // offline and render Myanmar in whatever the device happened to have.
        // For an offline-first, Myanmar-first product that is not a cosmetic
        // difference. woff2 only: every browser that can install a PWA reads
        // it, and precaching the woff duplicates would double the cost for no
        // one. About 160 KB, of which the Myanmar subsets are ~145 KB.
        //
        // webp covers the per-domain activity illustrations: they exist so a
        // caregiver who cannot read the instructions can still understand an
        // activity from the picture alone, which only holds offline too if
        // they are actually on the device. All 16 together are ~170 KB.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webmanifest,woff2}'],
        // public/social/** is Facebook/marketing content-calendar collateral
        // (scripts/generate-social-calendar.mjs) — it matches the png/webp
        // globs above but nothing in the app ever references it. Left
        // unexcluded it was ~11.5 MB, over half of the entire precache,
        // silently downloaded into every installed parent's PWA for content
        // they can never see.
        globIgnores: ['social/**'],
        // Only public educational routes are cached. Anything under /api/ (authenticated
        // child data) is explicitly excluded from runtime caching.
        navigateFallbackDenylist: [/^\/api\//, /^\/admin\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/content/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'public-educational-content' },
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
