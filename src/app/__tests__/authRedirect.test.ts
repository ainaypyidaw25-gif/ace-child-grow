import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveAuthRedirectUrl } from '../platform';

describe('native authentication redirects', () => {
  it('keeps browser sign-in on the current web origin', () => {
    expect(resolveAuthRedirectUrl(false, 'https://preview.example.com')).toBe(
      'https://preview.example.com',
    );
  });

  it('uses the verified production app link instead of the Capacitor localhost origin', () => {
    expect(resolveAuthRedirectUrl(true, 'https://localhost')).toBe(
      'https://child.acegroup.com.mm',
    );
  });

  it('preserves an invite path, query, and hash on the verified app link', () => {
    expect(
      resolveAuthRedirectUrl(
        true,
        'https://localhost',
        '/admin/accept-invite?invite=abc#review',
      ),
    ).toBe('https://child.acegroup.com.mm/admin/accept-invite?invite=abc#review');
  });

  it('keeps SignIn from sending native OAuth back to window.location.origin', () => {
    const signInSource = readFileSync('src/screens/SignIn.tsx', 'utf8');
    expect(signInSource).toContain('redirectTo: getAuthRedirectUrl()');
    expect(signInSource).toContain('redirectTo: getAuthRedirectUrl(redirectPath)');
    expect(signInSource).not.toContain('redirectTo: window.location.origin');
  });
});
