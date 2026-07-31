import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Build config for the Playwright layout harness ONLY.
 *
 * The harness renders the owner-priority components with fixture data so their
 * layout can be verified and photographed at real device sizes. It is built
 * here, into `dist-harness/`, entirely separately from the application bundle
 * (`vite.config.ts` → `dist/`), and no application route serves it.
 *
 * That separation is the point: an unauthenticated preview route inside the
 * production bundle would be a real exposure, however harmless its data looks.
 * `src/domain/__tests__/noDevRoutes.test.ts` asserts the application neither
 * routes to nor imports anything under tests/harness.
 */
export default defineConfig({
  root: path.resolve(__dirname, 'tests/harness'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // The parent walkthrough mounts the REAL <App />, so it needs a backend.
      // Rather than record against Production — which would mean creating a
      // real account and a real child row to film — the two Convex entry
      // points are swapped for an in-memory stand-in. This alias exists only
      // in the harness bundle; `vite.config.ts` is untouched, so the shipped
      // app can never resolve to it.
      'convex/react': path.resolve(__dirname, 'tests/harness/offlineConvex.tsx'),
      '@convex-dev/auth/react': path.resolve(__dirname, 'tests/harness/offlineConvex.tsx'),
    },
  },
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist-harness'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Layout checks, and the two silent training recordings.
        index: path.resolve(__dirname, 'tests/harness/index.html'),
        guide: path.resolve(__dirname, 'tests/harness/guide.html'),
        parent: path.resolve(__dirname, 'tests/harness/parent.html'),
      },
    },
  },
});
