import { describe, expect, it } from 'vitest';

const authSource = import.meta.glob('../../../convex/auth.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('Google OAuth provider configuration', () => {
  it('binds the Convex OAuth credentials using the deployment env convention', () => {
    const source = Object.values(authSource)[0];

    expect(source).toBeDefined();
    expect(source).toContain('Google({');
    expect(source).toContain('clientId: process.env.AUTH_GOOGLE_ID');
    expect(source).toContain('clientSecret: process.env.AUTH_GOOGLE_SECRET');
    expect(source).not.toMatch(/process\.env\.GOOGLE_(?:ID|SECRET)/);
    expect(source).not.toContain('providers: [Google,');
  });
});
