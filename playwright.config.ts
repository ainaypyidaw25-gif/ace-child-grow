import { defineConfig } from '@playwright/test';

// E2E runs against the production build served by `vite preview`, using the
// Chromium that ships in this environment (see executablePath).
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT = 4173;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: { executablePath: CHROMIUM, args: ['--no-sandbox'] },
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
