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
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist-harness'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Layout checks, and the silent reviewer-training recording.
        index: path.resolve(__dirname, 'tests/harness/index.html'),
        guide: path.resolve(__dirname, 'tests/harness/guide.html'),
      },
    },
  },
});
