import { describe, expect, it } from 'vitest';

const authSource = import.meta.glob('../../../convex/auth.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('OAuth provider configuration', () => {
  it('binds Google and Apple credentials using server-only deployment env names', () => {
    const source = Object.values(authSource)[0];

    expect(source).toBeDefined();
    expect(source).toContain('Google({');
    expect(source).toContain('clientId: process.env.AUTH_GOOGLE_ID');
    expect(source).toContain('clientSecret: process.env.AUTH_GOOGLE_SECRET');
    expect(source).not.toMatch(/process\.env\.GOOGLE_(?:ID|SECRET)/);
    expect(source).not.toContain('providers: [Google,');
    expect(source).toContain("import Apple from '@auth/core/providers/apple'");
    expect(source).toContain('Apple({');
    expect(source).toContain('clientId: process.env.AUTH_APPLE_ID');
    expect(source).toContain('clientSecret: process.env.AUTH_APPLE_SECRET');
    expect(source).toContain('return normalizeAppleProfile(profile)');
    expect(source).not.toMatch(/VITE_(?:AUTH_)?APPLE/);
  });
});
