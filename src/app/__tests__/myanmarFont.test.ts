// The Myanmar font has to ship, and it has to survive going offline.
//
// This app is read mostly on low-end Android phones, often with no connection,
// by parents reading Myanmar. Naming 'Noto Sans Myanmar' in a font-family and
// hoping the device has it is not a typography decision — on a phone without a
// Myanmar font it is the difference between a working app and rows of boxes.
// A live check found exactly that: the family was named, the package was a
// dependency, and nothing imported it.
//
// The service-worker half is the same failure one step later. Workbox's default
// precache glob does not include fonts, so the stylesheet was cached offline
// while the glyphs it referenced were not.
//
// Both are configuration, so both are asserted against the configuration files
// rather than against a rendered page: a unit test cannot see a missing glyph,
// but it can see the line that would cause one.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// Imported rather than taken as a global: this project deliberately does not put
// node's globals in scope for src/, because src/ runs in a browser. A test that
// reads the repository is the exception, and it says so explicitly.
import process from 'node:process';

// Read from disk rather than through import.meta.glob: Vite hands CSS to its
// own pipeline, so a ?raw glob of a stylesheet comes back empty and every
// assertion below would pass against an empty string — a test that cannot fail.
//
// Resolved from the process working directory, which vitest sets to the project
// root, rather than from import.meta.url: Vite rewrites import.meta in the
// transformed module and the URL came back undefined here.
const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

const indexCss = read('src/index.css');
const viteConfig = read('vite.config.ts');
const pkg = JSON.parse(read('package.json'));

// Guard the guard: if a rename empties one of these, say so here rather than
// letting four assertions quietly succeed against nothing.
for (const [name, text] of [
  ['src/index.css', indexCss],
  ['vite.config.ts', viteConfig],
] as const) {
  if (!text.trim()) throw new Error(`${name} read as empty — these assertions would be vacuous`);
}

describe('Myanmar font', () => {
  it('ships with the app rather than being assumed present on the device', () => {
    expect(pkg.dependencies['@fontsource/noto-sans-myanmar']).toBeTruthy();
    expect(indexCss).toMatch(/@import ['"]@fontsource\/noto-sans-myanmar\/\d+\.css['"]/);
  });

  it('is imported before Tailwind, so the @import is legal CSS', () => {
    // CSS requires @import to precede every rule. After @tailwind the browser
    // drops it silently — the build succeeds and the font never loads.
    expect(indexCss.indexOf('@fontsource')).toBeLessThan(indexCss.indexOf('@tailwind'));
  });

  it('covers the weights the interface actually uses', () => {
    for (const weight of ['400', '500', '700']) {
      expect(indexCss, `weight ${weight} is used but not loaded`).toContain(
        `@fontsource/noto-sans-myanmar/${weight}.css`,
      );
    }
  });

  it('is still there when the phone goes offline', () => {
    // Without an explicit glob, workbox precaches js/css/html/ico/png/svg and
    // no fonts at all.
    expect(viteConfig).toMatch(/globPatterns:.*woff2/s);
  });

  it('names the font family it actually loads', () => {
    expect(indexCss).toMatch(/font-family:\s*'Noto Sans Myanmar'/);
  });

  it('automatically activates a new app shell instead of leaving Safari on stale UI', () => {
    expect(viteConfig).toContain("registerType: 'autoUpdate'");
    expect(viteConfig).toContain('skipWaiting: true');
    expect(viteConfig).toContain('clientsClaim: true');
  });
});
