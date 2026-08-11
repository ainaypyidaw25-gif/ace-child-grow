import { describe, expect, it } from 'vitest';

const authSource = import.meta.glob('../../../convex/auth.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('Google OAuth provider configuration', () => {
  it('binds the Convex preview OAuth credentials explicitly', () => {
    const source = Object.values(authSource)[0];

    expect(source).toBeDefined();
    expect(source).toContain('Google({');
    expect(source).toContain('clientId: process.env.GOOGLE_ID');
    expect(source).toContain('clientSecret: process.env.GOOGLE_SECRET');
    expect(source).not.toContain('providers: [Google,');
  });
});
