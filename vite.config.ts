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
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
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
        // The Myanmar font is precached with the rest of the shell. Workbox's
        // default glob does not include font files, so offline the stylesheet
        // was cached while the glyphs it names were not — the app would open
        // offline and render Myanmar in whatever the device happened to have.
        // For an offline-first, Myanmar-first product that is not a cosmetic
        // difference. woff2 only: every browser that can install a PWA reads
        // it, and precaching the woff duplicates would double the cost for no
        // one. About 160 KB, of which the Myanmar subsets are ~145 KB.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
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
