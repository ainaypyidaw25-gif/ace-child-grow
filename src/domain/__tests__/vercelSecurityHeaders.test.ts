import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Header = { key: string; value: string };
type HeaderRule = { source: string; headers: Header[] };
type VercelConfig = {
  buildCommand?: string;
  installCommand?: string;
  headers?: HeaderRule[];
};

const config = JSON.parse(
  readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'),
) as VercelConfig;
const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
) as { scripts?: Record<string, string> };

function headersFor(source: string) {
  const rule = config.headers?.find((candidate) => candidate.source === source);
  expect(rule, `missing Vercel header rule for ${source}`).toBeDefined();
  return new Map(rule?.headers.map(({ key, value }) => [key.toLowerCase(), value]));
}

describe('Vercel response security headers', () => {
  it('uses the lockfile and the complete production build gate', () => {
    expect(config.installCommand).toBe('PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci');
    expect(config.buildCommand).toBe('npm run build');
    expect(packageJson.scripts?.prebuild).toBeUndefined();
    expect(packageJson.scripts?.['social:generate']).toBe(
      'node scripts/generate-social-calendar.mjs',
    );
  });

  it('protects every route against framing, MIME sniffing, and referrer leakage', () => {
    const headers = headersFor('/(.*)');

    expect(headers.get('x-frame-options')).toBe('DENY');
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('permissions-policy')).toBe(
      'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
    );
  });

  it('uses an enforced CSP with only the runtime origins the app needs', () => {
    const csp = headersFor('/(.*)').get('content-security-policy');

    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("connect-src 'self' https://graceful-possum-566.convex.cloud wss://graceful-possum-566.convex.cloud https://graceful-possum-566.convex.site");
    expect(csp).toContain("img-src 'self' data: blob: https://graceful-possum-566.convex.cloud https://graceful-possum-566.convex.site https://developers.myanmyanpay.com https://lh3.googleusercontent.com");
    expect(csp).not.toContain('*.convex.cloud');
    expect(csp).not.toContain('*.convex.site');
    expect(csp).not.toContain(' *');
  });

  it('preserves the Apple universal-link association media type', () => {
    expect(
      headersFor('/.well-known/apple-app-site-association').get('content-type'),
    ).toBe('application/json');
  });
});
