import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// E2E runs against the production build served by `vite preview`. The hosted
// runner keeps Chromium at a fixed path; local development uses Playwright's
// installed browser instead.
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT = 4173;
// The layout harness is a SEPARATE bundle on its own port; it is never part of
// the application build served on PORT.
const HARNESS_PORT = 4174;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: {
      ...(existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {}),
      args: ['--no-sandbox'],
    },
  },
  webServer: [
    {
      command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      timeout: 120_000,
      reuseExistingServer: true,
    },
    {
      command: `npm run build:harness && npx vite preview --config vite.harness.config.ts --port ${HARNESS_PORT} --strictPort`,
      url: `http://localhost:${HARNESS_PORT}`,
      timeout: 120_000,
      reuseExistingServer: true,
    },
  ],
});
