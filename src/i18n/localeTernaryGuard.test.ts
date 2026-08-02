import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findOneSidedLocaleTernaries } from './localeTernaryGuard';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(path);
    if (!/\.tsx?$/.test(entry.name) || /(?:\.d|\.test|\.spec)\.tsx?$/.test(entry.name)) return [];
    return [path];
  });
}

describe('inline locale ternary guard', () => {
  it('finds an empty English branch', () => {
    const source = `const label = locale === 'mm' ? 'ကလေးများ' : '';`;
    expect(findOneSidedLocaleTernaries(source)).toMatchObject([
      { line: 1, emptyLocale: 'en' },
    ]);
  });

  it('finds inverted and parenthesised empty Myanmar branches', () => {
    const source = `const label = ('en' !== (state.locale)) ? null : 'Children';`;
    expect(findOneSidedLocaleTernaries(source)).toMatchObject([
      { line: 1, emptyLocale: 'mm' },
    ]);
  });

  it('accepts two non-empty branches and unrelated conditionals', () => {
    const source = `
      const label = locale === 'mm' ? 'ကလေးများ' : 'Children';
      const dateLocale = locale === 'mm' ? 'my-MM' : 'en-GB';
      const optional = enabled ? 'Shown' : null;
    `;
    expect(findOneSidedLocaleTernaries(source)).toEqual([]);
  });

  it('keeps every application locale ternary two-sided', () => {
    const root = resolve(process.cwd(), 'src');
    const violations = sourceFiles(root).flatMap((path) => {
      const fileName = relative(process.cwd(), path);
      return findOneSidedLocaleTernaries(readFileSync(path, 'utf8'), fileName);
    });
    const details = violations.map((violation) => (
      `${violation.fileName}:${violation.line}:${violation.column} has an empty ${violation.emptyLocale} branch: ${violation.source}`
    )).join('\n');

    expect(violations, details).toEqual([]);
  });
});
