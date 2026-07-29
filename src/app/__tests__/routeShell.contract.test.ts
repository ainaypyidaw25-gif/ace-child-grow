import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(resolve(process.cwd(), 'src/app/App.tsx'), 'utf8');
const viteSource = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');

describe('route shell resilience contract', () => {
  it('keeps lazy loading and error recovery inside the persistent layout', () => {
    expect(appSource).toContain('function AppScreen');
    expect(appSource).toContain('<Layout showNav={showNav}>');
    expect(appSource).toContain('<ScreenErrorBoundary locale={locale}>');
    expect(appSource).toContain('<Suspense fallback={<PageLoading locale={locale} />}>');
    expect(appSource).not.toContain('<Suspense fallback={<div className="flex min-h-[50vh]');
  });

  it('does not auto-inject service-worker registration into native assets', () => {
    expect(viteSource).toContain('injectRegister: null');
  });
});
