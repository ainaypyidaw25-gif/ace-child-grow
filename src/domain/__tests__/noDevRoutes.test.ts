import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The application bundle must not ship a developer/preview route.
 *
 * The owner-priority layout fixture is real UI with fake data — harmless to
 * look at, but an unauthenticated route into staff screens is still an
 * exposure, and one that would quietly survive every functional test. These
 * assertions pin the separation: the harness lives under tests/, is built by
 * its own vite config, and nothing under src/ may reach it.
 */

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

// Only shipped application source. Test files live under src/ but are never
// bundled, and this file necessarily names the harness in its own assertions.
const sourceFiles = walk('src')
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .filter((file) => !file.includes('__tests__'));

describe('no developer routes in the application', () => {
  it('App.tsx declares no /dev route', () => {
    const app = readFileSync('src/app/App.tsx', 'utf8');
    expect(app).not.toContain('/dev/');
    expect(app).not.toContain('owner-priority-preview');
    expect(app).not.toContain('OwnerPriorityPreview');
  });

  it('no route anywhere in src points at a dev or preview path', () => {
    for (const file of sourceFiles) {
      const source = readFileSync(file, 'utf8');
      const devRoutes = [...source.matchAll(/path=["'`](\/dev\/[^"'`]*)["'`]/g)].map((match) => match[1]);
      expect(devRoutes, `${file} declares a dev route`).toEqual([]);
    }
  });

  it('nothing under src imports the tests/ harness', () => {
    for (const file of sourceFiles) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${file} imports the test harness`).not.toMatch(/from\s+["'][^"']*tests\/harness/);
      expect(source, `${file} references OwnerPriorityHarness`).not.toContain('OwnerPriorityHarness');
    }
  });

  it('the harness exists, but only under tests/ with its own build config', () => {
    expect(existsSync('tests/harness/OwnerPriorityHarness.tsx')).toBe(true);
    expect(existsSync('vite.harness.config.ts')).toBe(true);
    // The production vite config must not name the harness in any way.
    const viteConfig = readFileSync('vite.config.ts', 'utf8');
    expect(viteConfig).not.toContain('harness');
    // The harness config must write somewhere other than the app's dist/.
    const harnessConfig = readFileSync('vite.harness.config.ts', 'utf8');
    expect(harnessConfig).toContain('dist-harness');
  });

  it('the built application bundle contains no harness marker', () => {
    // Only meaningful after `npm run build`; skipped otherwise so the check is
    // additive rather than a source of false failures in a fresh checkout.
    if (!existsSync('dist')) return;
    const bundled = walk('dist').filter((file) => /\.(js|html)$/.test(file));
    expect(bundled.length).toBeGreaterThan(0);
    for (const file of bundled) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${file} contains the harness banner`).not.toContain('LAYOUT PREVIEW');
      expect(source, `${file} contains a dev route`).not.toContain('owner-priority-preview');
    }
  });
});
