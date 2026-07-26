import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('production SPA routing', () => {
  it('serves the app shell when a browser reloads a nested route', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      rewrites?: Array<{ source: string; destination: string }>;
    };

    expect(config.rewrites).toContainEqual({
      source: '/(.*)',
      destination: '/index.html',
    });
  });
});
