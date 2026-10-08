import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const gate = readFileSync(resolve(process.cwd(), 'public/legacy-tailwind-gate.js'), 'utf8');

describe('legacy Tailwind capability gate', () => {
  it.each([
    { name: 'modern engine', css: { supports: () => true, registerProperty: () => undefined }, fallback: false },
    { name: 'missing color-mix', css: { supports: () => false, registerProperty: () => undefined }, fallback: true },
    { name: 'color-mix without property registration', css: { supports: () => true }, fallback: true },
    { name: 'missing CSS API', css: undefined, fallback: true },
    { name: 'missing feature-query API', css: {}, fallback: true },
  ])('selects the correct stylesheet for $name', ({ css, fallback }) => {
    const link = { rel: '', href: '', setAttribute: vi.fn() };
    const document = { createElement: vi.fn(() => link), head: { appendChild: vi.fn() } };

    runInNewContext(gate, { CSS: css, document });

    expect(document.head.appendChild).toHaveBeenCalledTimes(fallback ? 1 : 0);
    if (fallback) {
      expect(document.createElement).toHaveBeenCalledWith('link');
      expect(link.rel).toBe('stylesheet');
      expect(link.href).toBe('/legacy-tailwind-v3.css');
      expect(link.setAttribute).toHaveBeenCalledWith('data-legacy-tailwind', '');
    } else {
      expect(document.createElement).not.toHaveBeenCalled();
    }
  });
});
